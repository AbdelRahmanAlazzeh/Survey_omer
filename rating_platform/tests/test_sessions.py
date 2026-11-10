import json
import random
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import server  # noqa: E402
import sessions  # noqa: E402


class PairDesignTest(unittest.TestCase):
    def test_invariants_over_many_seeds(self):
        faces = [f"f{i}" for i in range(24)]
        for seed in range(200):
            rng = random.Random(seed)
            out = sessions.build_pairs(faces, 30, 2, rng)
            self.assertEqual(len(out), 32)
            main, reps = out[:30], out[30:]
            self.assertTrue(all(r == 0 for _, _, r in main))
            self.assertTrue(all(r == 1 for _, _, r in reps))
            keys = [frozenset((l, r)) for l, r, _ in main]
            self.assertEqual(len(set(keys)), 30)  # distinct pairs
            for l, r, _ in out:
                self.assertNotEqual(l, r)
            for a, b in zip(out, out[1:]):  # no shared face in consecutive pairs
                self.assertFalse({a[0], a[1]} & {b[0], b[1]})
            # every face appears (cycle) and graph is connected
            seen = {x for l, r, _ in main for x in (l, r)}
            self.assertEqual(seen, set(faces))
            parent = {f: f for f in faces}

            def find(x):
                while parent[x] != x:
                    parent[x] = parent[parent[x]]
                    x = parent[x]
                return x
            for l, r, _ in main:
                parent[find(l)] = find(r)
            self.assertEqual(len({find(f) for f in faces}), 1)
            # repeats are main pairs with sides swapped
            main_set = {(l, r) for l, r, _ in main}
            for l, r, _ in reps:
                self.assertIn((r, l), main_set)

    def test_select_least_shown_and_balanced(self):
        rows = [(f"c{i}", "han", i) for i in range(20)] + [(f"m{i}", "arab", 20 - i) for i in range(20)]
        got = sessions.select_faces(rows, 24, random.Random(1))
        self.assertEqual(len(got), 24)
        self.assertEqual({c for c in got if c.startswith("c")}, {f"c{i}" for i in range(12)})
        self.assertEqual({c for c in got if c.startswith("m")}, {f"m{i}" for i in range(8, 20)})

    def test_not_enough_faces(self):
        rows = [(f"c{i}", "han", 0) for i in range(5)] + [(f"m{i}", "arab", 0) for i in range(30)]
        with self.assertRaises(sessions.NotEnoughFaces):
            sessions.select_faces(rows, 24, random.Random(1))

    def test_validate_settings(self):
        sessions.validate_settings(24, 30, 2)
        for bad in [(23, 30, 2), (24, 10, 2), (24, 30, 31), (24, 999, 2)]:
            with self.assertRaises(ValueError):
                sessions.validate_settings(*bad)


class SessionApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        (tmp / "public").mkdir()
        (tmp / "data").mkdir()
        cfg = {"faces_per_sex": 24, "pairs_per_sex": 30, "repeat_pairs_per_sex": 2,
               "study_open": True, "admin_key": "", "access_code": ""}
        (tmp / "config.json").write_text(json.dumps(cfg))
        lines = ["code,sex,population,status"]
        for sex in "FM":
            for i in range(15):
                lines.append(f"{sex}c{i},{sex},han,active")
                lines.append(f"{sex}m{i},{sex},arab,active")
        lines.append("Fx,F,han,excluded")
        (tmp / "data" / "faces.csv").write_text("\n".join(lines))
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
        try:
            cls.tmp.cleanup()
        except OSError:
            pass

    def req(self, path, data=None):
        r = urllib.request.Request(f"http://127.0.0.1:{self.port}{path}",
                                   data=json.dumps(data).encode() if data is not None else None,
                                   headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(r) as resp:
                return resp.status, json.loads(resp.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def new_started(self):
        rid = self.req("/api/rater", {"lang": "en"})[1]["rater_id"]
        self.assertEqual(self.req("/api/start", {"rater_id": rid})[1]["created"], True)
        return rid

    def test_session_shape(self):
        rid = self.new_started()
        s, body = self.req(f"/api/trials?rid={rid}")
        self.assertEqual(s, 200)
        trials = body["trials"]
        self.assertEqual(len(trials), 64)
        self.assertEqual({t["part"] for t in trials}, {1, 2})
        self.assertEqual(len({t["sex"] for t in trials if t["part"] == 1}), 1)
        self.assertNotEqual({t["sex"] for t in trials if t["part"] == 1},
                            {t["sex"] for t in trials if t["part"] == 2})
        self.assertFalse(any("Fx" in (t["left"], t["right"]) for t in trials))  # excluded face

    def test_start_is_idempotent(self):
        rid = self.new_started()
        self.assertEqual(self.req("/api/start", {"rater_id": rid})[1]["created"], False)
        self.assertEqual(len(self.req(f"/api/trials?rid={rid}")[1]["trials"]), 64)

    def test_answer_flow_and_validation(self):
        rid = self.new_started()
        ok = {"rater_id": rid, "part": 1, "idx": 1, "winner": "left", "rt_ms": 1234}
        self.assertEqual(self.req("/api/answer", ok)[1], {"saved": True})
        self.assertEqual(self.req("/api/answer", dict(ok, winner="right"))[1]["duplicate"], True)
        for bad in (dict(ok, winner="up"), dict(ok, rt_ms=-1), dict(ok, rt_ms=10**9),
                    dict(ok, idx="1"), dict(ok, rt_ms=True)):
            self.assertEqual(self.req("/api/answer", bad)[0], 400)
        self.assertEqual(self.req("/api/answer", dict(ok, idx=99))[0], 404)
        self.assertEqual(self.req("/api/answer", dict(ok, rater_id="nope"))[0], 404)
        self.assertEqual(self.req(f"/api/resume?rid={rid}")[1]["answered"], 1)

    def test_start_unknown_rater(self):
        self.assertEqual(self.req("/api/start", {"rater_id": "nope"})[0], 404)


if __name__ == "__main__":
    unittest.main()
