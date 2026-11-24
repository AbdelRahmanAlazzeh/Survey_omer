"""Face rating platform server.

Python standard library only. Provides:
  - SQLite schema (faces, raters, trials)
  - static file serving with caching and path-traversal protection
  - anonymous random rater ID, demographics, session/pair building, per-tap answer, completion, resume
  - admin stats and 5 analysis-ready CSV downloads (raters, comparisons, bt_scores completed/all, faces)
"""
import contextlib
import csv
import hmac
import io
import json
import mimetypes
import random
import secrets
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import bt
import sessions

BASE = Path(__file__).resolve().parent
PUBLIC = BASE / "public"
DATA = BASE / "data"
DB_PATH = DATA / "study.db"
CONFIG_PATH = BASE / "config.json"
FACES_CSV = DATA / "faces.csv"

PUBLIC_CONFIG_KEYS = ("study_open", "ethics_approval_no", "contact_email")
MAX_BODY = 64 * 1024

ALLOWED_POPULATIONS = {
    "han", "chinese_other", "arab", "persian", "turkish", "kurdish", "mideast_other", "other"
}
ALLOWED_RESIDENCES = {"china_region", "mideast_region", "other"}
ALLOWED_CONTACTS = {"never", "rarely", "sometimes", "often", "daily"}
ALLOWED_ANGLES = {"front", "side", "equal"}
ALLOWED_CONFIDENCE = {"1", "2", "3", "4", "5", "not_at_all", "slightly", "moderate", "confident", "very_confident"}

SCHEMA = """
CREATE TABLE IF NOT EXISTS faces (
  code TEXT PRIMARY KEY, sex TEXT NOT NULL, population TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active');
CREATE TABLE IF NOT EXISTS raters (
  id TEXT PRIMARY KEY, created_at REAL NOT NULL, lang TEXT,
  population TEXT, sex TEXT, age INTEGER, residence TEXT,
  years_china REAL, years_mideast REAL, contact_east_asia TEXT,
  contact_mideast TEXT, expert TEXT, repeat_participant TEXT,
  device TEXT, source TEXT, post_regions TEXT, post_angle TEXT,
  post_confidence TEXT, completed_at REAL);
CREATE TABLE IF NOT EXISTS trials (
  id INTEGER PRIMARY KEY AUTOINCREMENT, rater_id TEXT NOT NULL,
  part INTEGER NOT NULL, idx INTEGER NOT NULL,
  left_code TEXT NOT NULL, right_code TEXT NOT NULL,
  is_repeat INTEGER NOT NULL DEFAULT 0,
  winner TEXT, rt_ms INTEGER, answered_at REAL,
  UNIQUE (rater_id, part, idx),
  FOREIGN KEY (rater_id) REFERENCES raters(id));
CREATE INDEX IF NOT EXISTS idx_trials_rater ON trials(rater_id);
"""

_db_lock = threading.Lock()


def load_config():
    with open(CONFIG_PATH, encoding="utf-8") as f:
        return json.load(f)


@contextlib.contextmanager
def connect():
    DATA.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    try:
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA journal_mode=WAL")
        with conn:
            yield conn
    finally:
        conn.close()


def init_db():
    with _db_lock, connect() as conn:
        conn.executescript(SCHEMA)


def sync_faces():
    """Load data/faces.csv into the faces table (columns: code,sex,population,status)."""
    if not FACES_CSV.exists():
        return 0
    with open(FACES_CSV, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    with _db_lock, connect() as conn:
        for r in rows:
            conn.execute(
                "INSERT INTO faces(code,sex,population,status) VALUES(?,?,?,?) "
                "ON CONFLICT(code) DO UPDATE SET sex=excluded.sex, "
                "population=excluded.population, status=excluded.status",
                (r["code"], r["sex"], r["population"], r.get("status") or "active"),
            )
    return len(rows)


def new_rater_id():
    return "r_" + secrets.token_hex(8)


def build_session(conn, rater_id, cfg, rng=None):
    """Create all trials for a rater (idempotent). Caller holds _db_lock."""
    rng = rng or random.SystemRandom()
    if conn.execute("SELECT 1 FROM trials WHERE rater_id=? LIMIT 1", (rater_id,)).fetchone():
        return False
    fps, pps = int(cfg["faces_per_sex"]), int(cfg["pairs_per_sex"])
    rep = int(cfg["repeat_pairs_per_sex"])
    sessions.validate_settings(fps, pps, rep)
    sexes = ["F", "M"]
    rng.shuffle(sexes)
    for part, sex in enumerate(sexes, start=1):
        rows = conn.execute(
            "SELECT f.code, f.population, COUNT(t.id) FROM faces f "
            "LEFT JOIN trials t ON (t.left_code=f.code OR t.right_code=f.code) AND t.is_repeat=0 "
            "WHERE f.sex=? AND f.status='active' GROUP BY f.code", (sex,)).fetchall()
        faces = sessions.select_faces([tuple(r) for r in rows], fps, rng)
        for idx, (left, right, is_rep) in enumerate(sessions.build_pairs(faces, pps, rep, rng), start=1):
            conn.execute(
                "INSERT INTO trials(rater_id, part, idx, left_code, right_code, is_repeat) "
                "VALUES(?,?,?,?,?,?)", (rater_id, part, idx, left, right, is_rep))
    return True


def csv_safe(val):
    """Sanitize string cells against spreadsheet formula injection without mangling numbers."""
    if val is None:
        return ""
    if isinstance(val, (int, float)) and not isinstance(val, bool):
        return val
    s = str(val)
    if s and s[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + s
    return s


def render_csv(headers, rows):
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([csv_safe(v) for v in row])
    return ("\ufeff" + buf.getvalue()).encode("utf-8")


def compute_admin_stats(conn, cfg):
    started = conn.execute(
        "SELECT COUNT(*) FROM raters WHERE population IS NOT NULL"
    ).fetchone()[0]
    completed = conn.execute(
        "SELECT COUNT(*) FROM raters WHERE population IS NOT NULL AND completed_at IS NOT NULL"
    ).fetchone()[0]

    grp_rows = conn.execute(
        "SELECT population, sex, COUNT(*) AS started, "
        "SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) AS completed "
        "FROM raters WHERE population IS NOT NULL AND sex IS NOT NULL "
        "GROUP BY population, sex ORDER BY population, sex"
    ).fetchall()
    groups = [
        {
            "population": r["population"],
            "sex": r["sex"],
            "started": r["started"],
            "completed": r["completed"] or 0,
        }
        for r in grp_rows
    ]

    answered_comparisons = conn.execute(
        "SELECT COUNT(*) FROM trials WHERE winner IS NOT NULL"
    ).fetchone()[0]

    face_counts = {"F-CN": 0, "F-ME": 0, "M-CN": 0, "M-ME": 0}
    for r in conn.execute("SELECT sex, population FROM faces WHERE status='active'").fetchall():
        pop_tag = "CN" if sessions.in_group_a(r["population"]) else "ME"
        key = f"{r['sex']}-{pop_tag}"
        if key in face_counts:
            face_counts[key] += 1

    per_face = conn.execute(
        "SELECT f.code, COUNT(t.id) AS cnt FROM faces f "
        "LEFT JOIN trials t ON (t.left_code=f.code OR t.right_code=f.code) "
        "AND t.winner IS NOT NULL AND t.is_repeat=0 "
        "WHERE f.status='active' GROUP BY f.code"
    ).fetchall()
    counts = [r["cnt"] for r in per_face]
    comp_stats = {
        "min": min(counts) if counts else 0,
        "mean": round(sum(counts) / len(counts), 1) if counts else 0.0,
        "max": max(counts) if counts else 0,
    }

    rep_rows = conn.execute(
        "SELECT r.winner AS rep_w, m.winner AS main_w "
        "FROM trials r "
        "JOIN trials m ON m.rater_id=r.rater_id AND m.part=r.part "
        "AND m.is_repeat=0 AND m.left_code=r.right_code AND m.right_code=r.left_code "
        "WHERE r.is_repeat=1 AND r.winner IS NOT NULL AND m.winner IS NOT NULL"
    ).fetchall()
    rep_total = len(rep_rows)
    rep_agreed = sum(1 for r in rep_rows if r["rep_w"] != r["main_w"])
    rep_pct = round(100.0 * rep_agreed / rep_total, 1) if rep_total else 0.0

    part_rows = conn.execute(
        "SELECT r.id, r.lang, r.population, r.sex, r.age, r.residence, r.device, r.source, "
        "r.post_angle, r.post_confidence, r.created_at, r.completed_at, "
        "(SELECT COUNT(*) FROM trials t WHERE t.rater_id=r.id AND t.winner IS NOT NULL) AS answered, "
        "(SELECT COUNT(*) FROM trials t WHERE t.rater_id=r.id) AS total "
        "FROM raters r ORDER BY r.created_at DESC LIMIT 200"
    ).fetchall()
    participants = [
        {
            "id": r["id"],
            "lang": r["lang"] or "",
            "population": r["population"] or "-",
            "sex": r["sex"] or "-",
            "age": r["age"],
            "residence": r["residence"] or "-",
            "device": r["device"] or "-",
            "source": r["source"] or "-",
            "answered": r["answered"],
            "total": r["total"],
            "completed": r["completed_at"] is not None,
            "post_angle": r["post_angle"] or "-",
            "post_confidence": r["post_confidence"] or "-",
            "created_at": r["created_at"],
        }
        for r in part_rows
    ]

    all_faces = conn.execute("SELECT code, sex, population, status FROM faces").fetchall()
    all_raters = conn.execute("SELECT id, population, completed_at FROM raters").fetchall()
    all_trials = conn.execute(
        "SELECT rater_id, left_code, right_code, is_repeat, winner FROM trials WHERE winner IS NOT NULL"
    ).fetchall()
    bt_all = bt.compute_bt_rows(all_faces, all_trials, all_raters, completed_only=False)
    bt_preview = []
    for fsex in ("F", "M"):
        ranked = [
            x for x in bt_all
            if x["face_sex"] == fsex and x["rater_group"] == "all" and x["comparisons"] > 0
        ]
        ranked.sort(key=lambda x: x["bt_log_strength"], reverse=True)
        bt_preview.extend(ranked[:5])
        if len(ranked) > 5:
            bt_preview.extend(ranked[-5:])

    return {
        "started": started,
        "completed": completed,
        "groups": groups,
        "answered_comparisons": answered_comparisons,
        "active_faces": face_counts,
        "comparisons_per_face": comp_stats,
        "repeat_agreement": {"agreed": rep_agreed, "total": rep_total, "pct": rep_pct},
        "study_open": bool(cfg.get("study_open", True)),
        "participants": participants,
        "bt_preview": bt_preview,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "RatingServer/0.2"

    # --- helpers -----------------------------------------------------
    def _json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _csv(self, filename, data):
        self.send_response(200)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
        except ValueError:
            return None
        if n <= 0 or n > MAX_BODY:
            return None
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return None

    def _static(self, rel):
        rel = rel.lstrip("/") or "index.html"
        target = (PUBLIC / rel).resolve()
        if PUBLIC.resolve() not in target.parents and target != PUBLIC.resolve():
            return self._json({"error": "forbidden"}, 403)
        if not target.is_file():
            return self._json({"error": "not found"}, 404)
        ctype = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        data = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        is_face = rel.startswith("faces/")
        self.send_header("Cache-Control", "public, max-age=86400" if is_face else "no-cache")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def _admin_ok(self, qs):
        key = load_config().get("admin_key", "")
        given = (qs.get("key") or [""])[0]
        return bool(key) and hmac.compare_digest(key, given)

    def log_message(self, fmt, *args):  # keep logs free of query strings (admin key, rater id)
        line = str(args[0]).split("?")[0] if args else ""
        print(f"{self.address_string()} {line} {' '.join(str(a) for a in args[1:])}")

    # --- routes ------------------------------------------------------
    def do_GET(self):
        u = urlparse(self.path)
        qs = parse_qs(u.query)
        if u.path == "/api/health":
            return self._json({"ok": True})
        if u.path == "/api/config":
            cfg = load_config()
            return self._json({k: cfg.get(k) for k in PUBLIC_CONFIG_KEYS}
                              | {"needs_access_code": bool(cfg.get("access_code"))})
        if u.path == "/api/resume":
            rid = (qs.get("rid") or [""])[0]
            with _db_lock, connect() as conn:
                r = conn.execute(
                    "SELECT id, lang, population, completed_at FROM raters WHERE id=?", (rid,)
                ).fetchone()
                if not r:
                    return self._json({"error": "unknown rater"}, 404)
                done = conn.execute(
                    "SELECT COUNT(*) FROM trials WHERE rater_id=? AND winner IS NOT NULL", (rid,)
                ).fetchone()[0]
                total = conn.execute(
                    "SELECT COUNT(*) FROM trials WHERE rater_id=?", (rid,)
                ).fetchone()[0]
            return self._json({
                "rater_id": rid,
                "lang": r["lang"] or "",
                "answered": done,
                "total": total,
                "has_demographics": bool(r["population"]),
                "completed": r["completed_at"] is not None,
            })
        if u.path == "/api/trials":
            rid = (qs.get("rid") or [""])[0]
            with _db_lock, connect() as conn:
                rows = conn.execute(
                    "SELECT t.part, t.idx, t.left_code, t.right_code, t.winner IS NOT NULL AS answered, "
                    "(SELECT sex FROM faces WHERE code=t.left_code) AS sex "
                    "FROM trials t WHERE t.rater_id=? ORDER BY t.part, t.idx", (rid,)).fetchall()
            if not rows:
                return self._json({"error": "no session"}, 404)
            return self._json({"trials": [
                {"part": r["part"], "idx": r["idx"], "left": r["left_code"],
                 "right": r["right_code"], "answered": bool(r["answered"]), "sex": r["sex"]}
                for r in rows]})
        if u.path == "/api/admin/stats":
            if not self._admin_ok(qs):
                return self._json({"error": "forbidden"}, 403)
            cfg = load_config()
            with _db_lock, connect() as conn:
                stats = compute_admin_stats(conn, cfg)
            return self._json(stats)
        if u.path.startswith("/api/admin/export/"):
            if not self._admin_ok(qs):
                return self._json({"error": "forbidden"}, 403)
            name = u.path.rsplit("/", 1)[-1]
            return self._export_csv(name)
        if u.path == "/admin.html":
            if not self._admin_ok(qs):
                return self._json({"error": "forbidden"}, 403)
            return self._static("admin.html")
        if u.path.startswith("/api/"):
            return self._json({"error": "not found"}, 404)
        return self._static(u.path)

    def _export_csv(self, name):
        if name == "faces.csv":
            if FACES_CSV.is_file():
                with open(FACES_CSV, newline="", encoding="utf-8") as f:
                    reader = list(csv.reader(f))
                if reader:
                    return self._csv("faces.csv", render_csv(reader[0], reader[1:]))
            with _db_lock, connect() as conn:
                rows = conn.execute("SELECT code, sex, population, status FROM faces ORDER BY code").fetchall()
            return self._csv("faces.csv", render_csv(
                ["code", "sex", "population", "status"],
                [[r["code"], r["sex"], r["population"], r["status"]] for r in rows]
            ))

        with _db_lock, connect() as conn:
            if name == "raters.csv":
                rows = conn.execute("SELECT * FROM raters ORDER BY created_at").fetchall()
                headers = [
                    "id", "created_at", "lang", "population", "sex", "age", "residence",
                    "years_china", "years_mideast", "contact_east_asia", "contact_mideast",
                    "expert", "repeat_participant", "device", "source",
                    "post_regions", "post_angle", "post_confidence", "completed_at", "completion_seconds"
                ]
                out = []
                for r in rows:
                    dur = round(r["completed_at"] - r["created_at"], 1) if r["completed_at"] else ""
                    out.append([
                        r["id"], r["created_at"], r["lang"], r["population"], r["sex"], r["age"],
                        r["residence"], r["years_china"], r["years_mideast"],
                        r["contact_east_asia"], r["contact_mideast"], r["expert"],
                        r["repeat_participant"], r["device"], r["source"],
                        r["post_regions"], r["post_angle"], r["post_confidence"],
                        r["completed_at"] or "", dur
                    ])
                return self._csv("raters.csv", render_csv(headers, out))

            if name == "comparisons.csv":
                rows = conn.execute(
                    "SELECT t.rater_id, r.population AS rater_population, r.sex AS rater_sex, "
                    "t.part, t.idx, fl.sex AS face_sex, t.left_code, t.right_code, "
                    "fl.population AS left_population, fr.population AS right_population, "
                    "t.winner, t.is_repeat, t.rt_ms, t.answered_at "
                    "FROM trials t "
                    "JOIN raters r ON r.id = t.rater_id "
                    "JOIN faces fl ON fl.code = t.left_code "
                    "JOIN faces fr ON fr.code = t.right_code "
                    "WHERE t.winner IS NOT NULL "
                    "ORDER BY t.answered_at, t.rater_id, t.part, t.idx"
                ).fetchall()
                headers = [
                    "rater_id", "rater_population", "rater_sex", "part", "idx", "face_sex",
                    "left_code", "right_code", "left_population", "right_population",
                    "winner", "winner_code", "loser_code", "is_repeat", "rt_ms", "answered_at"
                ]
                out = []
                for r in rows:
                    w_code = r["left_code"] if r["winner"] == "left" else r["right_code"]
                    l_code = r["right_code"] if r["winner"] == "left" else r["left_code"]
                    out.append([
                        r["rater_id"], r["rater_population"], r["rater_sex"], r["part"], r["idx"],
                        r["face_sex"], r["left_code"], r["right_code"],
                        r["left_population"], r["right_population"], r["winner"],
                        w_code, l_code, r["is_repeat"], r["rt_ms"], r["answered_at"]
                    ])
                return self._csv("comparisons.csv", render_csv(headers, out))

            if name in ("bt_scores_completed.csv", "bt_scores_all.csv"):
                completed_only = (name == "bt_scores_completed.csv")
                faces = conn.execute("SELECT code, sex, population, status FROM faces").fetchall()
                raters = conn.execute("SELECT id, population, completed_at FROM raters").fetchall()
                trials = conn.execute(
                    "SELECT rater_id, left_code, right_code, is_repeat, winner FROM trials WHERE winner IS NOT NULL"
                ).fetchall()
                bt_rows = bt.compute_bt_rows(faces, trials, raters, completed_only=completed_only)
                headers = ["code", "face_sex", "face_population", "rater_group", "bt_log_strength", "wins", "comparisons"]
                out = [[r[h] for h in headers] for r in bt_rows]
                return self._csv(name, render_csv(headers, out))

        return self._json({"error": "not found"}, 404)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path == "/api/rater":
            cfg = load_config()
            if not cfg.get("study_open", True):
                return self._json({"error": "study closed"}, 403)
            body = self._read_json()
            if body is None:
                return self._json({"error": "bad request"}, 400)
            code = cfg.get("access_code", "")
            if code and not hmac.compare_digest(str(body.get("access_code", "")), code):
                return self._json({"error": "access code required"}, 403)
            rid = new_rater_id()
            lang = str(body.get("lang", ""))[:5]
            device = str(body.get("device", ""))[:32]
            source = str(body.get("source", ""))[:64]
            with _db_lock, connect() as conn:
                conn.execute(
                    "INSERT INTO raters(id, created_at, lang, device, source) VALUES(?,?,?,?,?)",
                    (rid, time.time(), lang, device, source),
                )
            return self._json({"rater_id": rid}, 201)

        if u.path == "/api/demographics":
            body = self._read_json()
            if not isinstance(body, dict):
                return self._json({"error": "bad request"}, 400)
            rid = str(body.get("rater_id", ""))
            age = body.get("age")
            sex = str(body.get("sex", ""))
            pop = str(body.get("population", ""))
            res = str(body.get("residence", ""))
            yc = body.get("years_china", 0)
            ym = body.get("years_mideast", 0)
            cea = str(body.get("contact_east_asia", ""))
            cme = str(body.get("contact_mideast", ""))
            exp = str(body.get("expert", ""))
            rep = str(body.get("repeat_participant", ""))

            age_ok = isinstance(age, int) and not isinstance(age, bool) and 18 <= age <= 105
            years_ok = (
                isinstance(yc, (int, float)) and not isinstance(yc, bool) and 0 <= yc <= 105
                and isinstance(ym, (int, float)) and not isinstance(ym, bool) and 0 <= ym <= 105
            )
            if (
                not age_ok
                or sex not in ("female", "male")
                or pop not in ALLOWED_POPULATIONS
                or res not in ALLOWED_RESIDENCES
                or not years_ok
                or cea not in ALLOWED_CONTACTS
                or cme not in ALLOWED_CONTACTS
                or exp not in ("yes", "no")
                or rep not in ("yes", "no")
            ):
                return self._json({"error": "bad request"}, 400)

            device = str(body.get("device", ""))[:32]
            source = str(body.get("source", ""))[:64]
            try:
                with _db_lock, connect() as conn:
                    r = conn.execute("SELECT id FROM raters WHERE id=?", (rid,)).fetchone()
                    if not r:
                        return self._json({"error": "unknown rater"}, 404)
                    conn.execute(
                        "UPDATE raters SET population=?, sex=?, age=?, residence=?, "
                        "years_china=?, years_mideast=?, contact_east_asia=?, contact_mideast=?, "
                        "expert=?, repeat_participant=?, "
                        "device=COALESCE(NULLIF(?, ''), device), "
                        "source=COALESCE(NULLIF(?, ''), source) "
                        "WHERE id=?",
                        (pop, sex, age, res, float(yc), float(ym), cea, cme, exp, rep, device, source, rid),
                    )
                    created = build_session(conn, rid, load_config())
            except sessions.NotEnoughFaces as e:
                return self._json({"error": "not enough faces", "detail": str(e)}, 503)
            except ValueError as e:
                return self._json({"error": "bad config", "detail": str(e)}, 500)
            return self._json({"saved": True, "session_created": created})

        if u.path == "/api/start":
            body = self._read_json()
            if not isinstance(body, dict):
                return self._json({"error": "bad request"}, 400)
            rid = str(body.get("rater_id", ""))
            try:
                with _db_lock, connect() as conn:
                    if not conn.execute("SELECT 1 FROM raters WHERE id=?", (rid,)).fetchone():
                        return self._json({"error": "unknown rater"}, 404)
                    created = build_session(conn, rid, load_config())
            except sessions.NotEnoughFaces as e:
                return self._json({"error": "not enough faces", "detail": str(e)}, 503)
            except ValueError as e:
                return self._json({"error": "bad config", "detail": str(e)}, 500)
            return self._json({"rater_id": rid, "created": created})

        if u.path == "/api/answer":
            body = self._read_json()
            if not isinstance(body, dict):
                return self._json({"error": "bad request"}, 400)
            rid, part, idx = str(body.get("rater_id", "")), body.get("part"), body.get("idx")
            winner, rt = body.get("winner"), body.get("rt_ms")
            ints_ok = all(isinstance(v, int) and not isinstance(v, bool) for v in (part, idx, rt))
            if winner not in ("left", "right") or not ints_ok or not (0 <= rt <= 600000):
                return self._json({"error": "bad request"}, 400)
            with _db_lock, connect() as conn:
                cur = conn.execute(
                    "UPDATE trials SET winner=?, rt_ms=?, answered_at=? "
                    "WHERE rater_id=? AND part=? AND idx=? AND winner IS NULL",
                    (winner, rt, time.time(), rid, part, idx))
                if cur.rowcount == 1:
                    return self._json({"saved": True})
                exists = conn.execute(
                    "SELECT 1 FROM trials WHERE rater_id=? AND part=? AND idx=?",
                    (rid, part, idx)).fetchone()
            if exists:
                return self._json({"saved": False, "duplicate": True})
            return self._json({"error": "unknown trial"}, 404)

        if u.path == "/api/complete":
            body = self._read_json()
            if not isinstance(body, dict):
                return self._json({"error": "bad request"}, 400)
            rid = str(body.get("rater_id", ""))
            regions = body.get("post_regions")
            angle = str(body.get("post_angle", ""))
            conf = str(body.get("post_confidence", ""))
            if isinstance(regions, list):
                if not (1 <= len(regions) <= 2):
                    return self._json({"error": "bad request"}, 400)
                regions_str = ",".join(str(x)[:32] for x in regions)
            elif isinstance(regions, str) and regions.strip():
                regions_str = regions.strip()[:64]
            else:
                return self._json({"error": "bad request"}, 400)
            if angle not in ALLOWED_ANGLES or conf not in ALLOWED_CONFIDENCE:
                return self._json({"error": "bad request"}, 400)
            with _db_lock, connect() as conn:
                r = conn.execute("SELECT id, completed_at FROM raters WHERE id=?", (rid,)).fetchone()
                if not r:
                    return self._json({"error": "unknown rater"}, 404)
                conn.execute(
                    "UPDATE raters SET post_regions=?, post_angle=?, post_confidence=?, "
                    "completed_at=COALESCE(completed_at, ?) WHERE id=?",
                    (regions_str, angle, conf, time.time(), rid),
                )
            return self._json({"completed": True})

        return self._json({"error": "not found"}, 404)


def main():
    init_db()
    n = sync_faces()
    cfg = load_config()
    port = int(cfg.get("port", 8080))
    print(f"faces loaded: {n}; serving on http://0.0.0.0:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
