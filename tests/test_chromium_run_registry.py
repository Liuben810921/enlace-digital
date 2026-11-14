#!/usr/bin/env python3
"""Isolated offline regression tests for GitHub Actions run registry."""
import base64
import contextlib
import io
import json
import os
import runpy
import unittest
import urllib.error
import urllib.request
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "scripts/record_chromium_run.py"
BRANCH = "plan/maestro-finalizacion-seguridad-20261113"

class RegistryTests(unittest.TestCase):
    def run_case(self, previous, incoming, attempt=1, conflict=False):
        state = {"previous": previous, "writes": [], "conflict": conflict}
        def fake_open(req, timeout=20):
            method = req.get_method()
            if method == "GET":
                if state["previous"] is None:
                    raise urllib.error.HTTPError(req.full_url, 404, "missing", {}, None)
                body = {
                    "sha": "fake-sha",
                    "content": base64.b64encode(json.dumps(state["previous"]).encode()).decode(),
                }
            elif method == "PUT":
                if state["conflict"]:
                    state["conflict"] = False
                    raise urllib.error.HTTPError(req.full_url, 409, "conflict", {}, None)
                payload = json.loads(req.data)
                body = {"content": {"sha": "new-sha"}}
                state["writes"].append(payload)
                state["previous"] = json.loads(base64.b64decode(payload["content"]))
            else:
                raise AssertionError(method)
            class Response:
                def __enter__(self): return self
                def __exit__(self, *args): return False
                def read(self): return json.dumps(body).encode()
            return Response()
        env = {
            "GITHUB_REPOSITORY": "synthetic/example",
            "GITHUB_REF_NAME": BRANCH,
            "GITHUB_TOKEN": "synthetic-only",
            "GITHUB_RUN_ID": str(incoming),
            "GITHUB_RUN_ATTEMPT": str(attempt),
            "GITHUB_SHA": "synthetic-sha",
            "CHROMIUM_JOB_RESULT": "success",
        }
        with patch.dict(os.environ, env), patch.object(urllib.request, "urlopen", fake_open), patch("time.sleep"), contextlib.redirect_stdout(io.StringIO()):
            try:
                runpy.run_path(str(SCRIPT), run_name="__main__")
            except SystemExit as error:
                self.assertEqual(error.code, 0)
        return state

    def test_first_run_creates_record(self):
        state = self.run_case(None, 10)
        self.assertEqual(len(state["writes"]), 1)
        self.assertEqual(state["previous"]["run_id"], 10)

    def test_newer_run_replaces_older(self):
        state = self.run_case({"run_id": 10, "run_attempt": 1}, 11)
        self.assertEqual(len(state["writes"]), 1)

    def test_stale_run_does_not_replace_newer(self):
        state = self.run_case({"run_id": 11, "run_attempt": 1}, 10)
        self.assertEqual(state["writes"], [])

    def test_same_attempt_is_idempotent(self):
        state = self.run_case({"run_id": 11, "run_attempt": 2}, 11, 2)
        self.assertEqual(state["writes"], [])

    def test_new_attempt_replaces_old_attempt(self):
        state = self.run_case({"run_id": 11, "run_attempt": 1}, 11, 2)
        self.assertEqual(len(state["writes"]), 1)

    def test_conflict_retries_with_fresh_sha(self):
        state = self.run_case({"run_id": 10, "run_attempt": 1}, 11, conflict=True)
        self.assertEqual(len(state["writes"]), 1)

if __name__ == "__main__":
    unittest.main()
