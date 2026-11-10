import json
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


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        (tmp / "public").mkdir()
        (tmp / "public" / "index.html").write_text("<h1>ok</h1>")
        (tmp / "secret.txt").write_text("secret")
        (tmp / "config.json").write_text(json.dumps({"admin_key": "k1", "study_open": True}))
        server.BASE, server.PUBLIC = tmp, tmp / "public"
        server.DATA, server.DB_PATH = tmp / "data", tmp / "data" / "study.db"
        server.CONFIG_PATH, server.FACES_CSV = tmp / "config.json", tmp / "data" / "faces.csv"
        server.init_db()
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
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def test_static_and_traversal(self):
        self.assertEqual(self.req("/")[0], 200)
        self.assertIn(self.req("/..%2fsecret.txt")[0], (403, 404))
        self.assertNotIn(b"secret", self.req("/../secret.txt")[1])

    def test_rater_and_resume(self):
        s, b = self.req("/api/rater", {"lang": "ar"})
        self.assertEqual(s, 201)
        rid = json.loads(b)["rater_id"]
        s, b = self.req(f"/api/resume?rid={rid}")
        self.assertEqual((s, json.loads(b)["answered"]), (200, 0))
        self.assertEqual(self.req("/api/resume?rid=nope")[0], 404)

    def test_admin_key(self):
        self.assertEqual(self.req("/admin.html")[0], 403)
        self.assertEqual(self.req("/admin.html?key=bad")[0], 403)

    def test_config_hides_secrets(self):
        _, b = self.req("/api/config")
        self.assertNotIn("admin_key", json.loads(b))


if __name__ == "__main__":
    unittest.main()
