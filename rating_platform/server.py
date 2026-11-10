"""Face rating platform server (Sprint 1: foundation).

Python standard library only. Provides:
  - SQLite schema (raters, trials, faces)
  - static file serving with caching and path-traversal protection
  - anonymous random rater ID, resume endpoint
  - config endpoint (public fields only)
Session/pair building arrives in Sprint 2.
"""
import csv
import hmac
import json
import mimetypes
import secrets
import sqlite3
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

BASE = Path(__file__).resolve().parent
PUBLIC = BASE / "public"
DATA = BASE / "data"
DB_PATH = DATA / "study.db"
CONFIG_PATH = BASE / "config.json"
FACES_CSV = DATA / "faces.csv"

PUBLIC_CONFIG_KEYS = ("study_open", "ethics_approval_no", "contact_email")
MAX_BODY = 64 * 1024

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


def connect():
    DATA.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=15)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys=ON")
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


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


class Handler(BaseHTTPRequestHandler):
    server_version = "RatingServer/0.1"

    # --- helpers -----------------------------------------------------
    def _json(self, obj, status=200):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

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
                r = conn.execute("SELECT id, completed_at FROM raters WHERE id=?", (rid,)).fetchone()
                if not r:
                    return self._json({"error": "unknown rater"}, 404)
                done = conn.execute(
                    "SELECT COUNT(*) FROM trials WHERE rater_id=? AND winner IS NOT NULL", (rid,)
                ).fetchone()[0]
            return self._json({"rater_id": rid, "answered": done,
                               "completed": r["completed_at"] is not None})
        if u.path == "/admin.html":
            if not self._admin_ok(qs):
                return self._json({"error": "forbidden"}, 403)
            return self._static("admin.html")
        if u.path.startswith("/api/"):
            return self._json({"error": "not found"}, 404)
        return self._static(u.path)

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
            with _db_lock, connect() as conn:
                conn.execute("INSERT INTO raters(id, created_at, lang) VALUES(?,?,?)",
                             (rid, time.time(), lang))
            return self._json({"rater_id": rid}, 201)
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
