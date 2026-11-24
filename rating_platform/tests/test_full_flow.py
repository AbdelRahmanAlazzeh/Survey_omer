import csv
import io
import json
import random
import shutil
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import bt  # noqa: E402
import server  # noqa: E402
import sessions  # noqa: E402


class BradleyTerryTest(unittest.TestCase):
    def test_ordering_and_mean_centering(self):
        codes = ["a", "b", "c"]
        # a beats b 9-1, b beats c 9-1, a beats c 10-0
        pairs = [("a", "b")] * 9 + [("b", "a")] + [("b", "c")] * 9 + [("c", "b")] + [("a", "c")] * 10
        res = bt.fit_bradley_terry(codes, pairs)
        self.assertGreater(res["a"]["bt_log_strength"], res["b"]["bt_log_strength"])
        self.assertGreater(res["b"]["bt_log_strength"], res["c"]["bt_log_strength"])
        mean_val = sum(res[c]["bt_log_strength"] for c in codes) / 3.0
        self.assertAlmostEqual(mean_val, 0.0, places=3)
        self.assertEqual(res["a"]["wins"], 19)
        self.assertEqual(res["a"]["comparisons"], 20)

    def test_zero_comparison_faces_stay_finite(self):
        res = bt.fit_bradley_terry(["a", "b", "idle"], [("a", "b"), ("a", "b")])
        self.assertEqual(res["idle"]["comparisons"], 0)
        self.assertEqual(res["idle"]["wins"], 0)
        self.assertGreater(res["a"]["bt_log_strength"], res["b"]["bt_log_strength"])


class FullStudyFlowTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        (tmp / "public").mkdir()
        (tmp / "data").mkdir()
        cfg = {
            "faces_per_sex": 24,
            "pairs_per_sex": 30,
            "repeat_pairs_per_sex": 2,
            "study_open": True,
            "admin_key": "secret_admin_k",
            "access_code": "",
            "ethics_approval_no": "ETH-2026-01",
            "contact_email": "research@example.org",
        }
        (tmp / "config.json").write_text(json.dumps(cfg))

        # Mirror exact real dataset distribution: F-CN: 10, F-ME: 53, M-CN: 28 active + 1 excluded, M-ME: 46
        lines = ["code,source_file,sex,population,provenance,status,note"]
        for i in range(10):
            lines.append(f"f_cn{i},{i}Fchinese.png,F,CN,ok,active,")
        for i in range(53):
            lines.append(f"f_me{i},{i}F.jpeg,F,ME,ok,active,")
        for i in range(28):
            lines.append(f"m_cn{i},{i}Mchinese.jpg,M,CN,ok,active,")
        lines.append("m_cn_excl,20M chinese.jpg,M,CN,ok,excluded,nose cut off")
        for i in range(46):
            lines.append(f"m_me{i},{i}M.jpeg,M,ME,ok,active,")
        (tmp / "data" / "faces.csv").write_text("\n".join(lines), encoding="utf-8")

        server.BASE, server.PUBLIC = tmp, tmp / "public"
        server.DATA, server.DB_PATH = tmp / "data", tmp / "data" / "study.db"
        server.CONFIG_PATH, server.FACES_CSV = tmp / "config.json", tmp / "data" / "faces.csv"
        server.init_db()
        server.sync_faces()

        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.port = cls.httpd.server_address[1]
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.tmp.cleanup()

    def req(self, path, data=None):
        r = urllib.request.Request(
            f"http://127.0.0.1:{self.port}{path}",
            data=json.dumps(data).encode() if data is not None else None,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(r) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def test_complete_participant_and_admin_exports(self):
        # 1. Create Han Chinese rater who completes all 64 trials + post questions
        s, b = self.req("/api/rater", {"lang": "zh", "device": "mobile", "source": "=cmd|evil"})
        self.assertEqual(s, 201)
        rid1 = json.loads(b)["rater_id"]

        # Reject invalid underage demographics
        s, _ = self.req("/api/demographics", {
            "rater_id": rid1, "age": 17, "sex": "female", "population": "han",
            "residence": "china_region", "years_china": 20, "years_mideast": 0,
            "contact_east_asia": "daily", "contact_mideast": "never",
            "expert": "no", "repeat_participant": "no",
        })
        self.assertEqual(s, 400)

        # Valid demographics also creates the 64-trial session (including F-CN=10 top-up to 24)
        s, b = self.req("/api/demographics", {
            "rater_id": rid1, "age": 24, "sex": "female", "population": "han",
            "residence": "china_region", "years_china": 24, "years_mideast": 0,
            "contact_east_asia": "daily", "contact_mideast": "rarely",
            "expert": "no", "repeat_participant": "no",
        })
        self.assertEqual(s, 200)
        self.assertTrue(json.loads(b)["saved"])

        s, b = self.req(f"/api/trials?rid={rid1}")
        self.assertEqual(s, 200)
        trials = json.loads(b)["trials"]
        self.assertEqual(len(trials), 64)
        self.assertFalse(any("m_cn_excl" in (t["left"], t["right"]) for t in trials))

        # Answer all 64 trials consistently (always pick the lexicographically smaller code)
        for t in trials:
            winner = "left" if t["left"] < t["right"] else "right"
            s, b = self.req("/api/answer", {
                "rater_id": rid1, "part": t["part"], "idx": t["idx"],
                "winner": winner, "rt_ms": 1450,
            })
            self.assertEqual(s, 200)
            self.assertTrue(json.loads(b)["saved"])

        # Complete study with 3 final questions
        s, b = self.req("/api/complete", {
            "rater_id": rid1,
            "post_regions": ["eyes_brows", "face_shape"],
            "post_angle": "front",
            "post_confidence": "confident",
        })
        self.assertEqual(s, 200)
        self.assertTrue(json.loads(b)["completed"])

        # Resume verifies completed=True
        s, b = self.req(f"/api/resume?rid={rid1}")
        res_data = json.loads(b)
        self.assertTrue(res_data["completed"])
        self.assertEqual(res_data["answered"], 64)
        self.assertTrue(res_data["has_demographics"])

        # 2. Second partial Arab rater (started, not completed)
        rid2 = json.loads(self.req("/api/rater", {"lang": "ar"})[1])["rater_id"]
        self.req("/api/demographics", {
            "rater_id": rid2, "age": 29, "sex": "male", "population": "arab",
            "residence": "mideast_region", "years_china": 0, "years_mideast": 29,
            "contact_east_asia": "sometimes", "contact_mideast": "daily",
            "expert": "no", "repeat_participant": "no",
        })
        t2 = json.loads(self.req(f"/api/trials?rid={rid2}")[1])["trials"][0]
        self.req("/api/answer", {
            "rater_id": rid2, "part": t2["part"], "idx": t2["idx"], "winner": "left", "rt_ms": 980
        })

        # 3. Admin stats & 5 CSV exports
        self.assertEqual(self.req("/api/admin/stats?key=wrong")[0], 403)
        s, b = self.req("/api/admin/stats?key=secret_admin_k")
        self.assertEqual(s, 200)
        stats = json.loads(b)
        self.assertEqual(stats["started"], 2)
        self.assertEqual(stats["completed"], 1)
        self.assertEqual(stats["answered_comparisons"], 65)
        self.assertEqual(stats["active_faces"], {"F-CN": 10, "F-ME": 53, "M-CN": 28, "M-ME": 46})
        # Since rater 1 chose smaller code consistently, all 4 repeat pairs (2 per part) must agree 100%
        self.assertEqual(stats["repeat_agreement"], {"agreed": 4, "total": 4, "pct": 100.0})
        self.assertEqual(len(stats["participants"]), 2)
        self.assertTrue(any(p["id"] == rid1 and p["completed"] and p["answered"] == 64 for p in stats["participants"]))
        self.assertTrue(any(p["id"] == rid2 and not p["completed"] and p["answered"] == 1 for p in stats["participants"]))
        self.assertGreater(len(stats["bt_preview"]), 0)

        for fname in ("raters.csv", "comparisons.csv", "bt_scores_completed.csv", "bt_scores_all.csv", "faces.csv"):
            s, csv_bytes = self.req(f"/api/admin/export/{fname}?key=secret_admin_k")
            self.assertEqual(s, 200, f"failed export {fname}")
            rows = list(csv.reader(io.StringIO(csv_bytes.decode("utf-8-sig"))))
            self.assertGreater(len(rows), 1, f"empty export {fname}")
            if fname == "raters.csv":
                # Check formula injection protection on rater 1 source field ("=cmd|evil" -> "'=cmd|evil")
                src_col = rows[0].index("source")
                self.assertEqual(rows[1][src_col], "'=cmd|evil")
            if fname == "comparisons.csv":
                self.assertEqual(len(rows) - 1, 65)
            if fname == "bt_scores_completed.csv":
                # 137 active faces * 3 rater groups = 411 rows
                self.assertEqual(len(rows) - 1, 137 * 3)


if __name__ == "__main__":
    unittest.main()
