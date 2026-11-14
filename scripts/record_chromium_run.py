#!/usr/bin/env python3
"""Publish only CI metadata to an isolated GitHub branch using GITHUB_TOKEN."""
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

repo = os.environ["GITHUB_REPOSITORY"]
branch = os.environ["GITHUB_REF_NAME"]
assert branch == "plan/maestro-finalizacion-seguridad-20261113", "Refusing non-isolated branch"
path = ".github/ci-evidence/latest-chromium-run.json"
api = f"https://api.github.com/repos/{repo}/contents/{path}"
headers = {
    "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
}
record = {
    "run_id": int(os.environ["GITHUB_RUN_ID"]),
    "run_attempt": int(os.environ["GITHUB_RUN_ATTEMPT"]),
    "head_sha": os.environ["GITHUB_SHA"],
    "branch": branch,
    "chromium_job_result": os.environ["CHROMIUM_JOB_RESULT"],
    "run_url": f"https://github.com/{repo}/actions/runs/{os.environ['GITHUB_RUN_ID']}",
}
def request(method, url, payload=None):
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.load(response)

for attempt in range(3):
    try:
        current = request("GET", api + "?" + urllib.parse.urlencode({"ref": branch}))
        sha = current["sha"]
        previous = json.loads(base64.b64decode(current["content"]).decode("utf-8"))
        previous_order = (int(previous["run_id"]), int(previous["run_attempt"]))
        incoming_order = (record["run_id"], record["run_attempt"])
        if previous_order >= incoming_order:
            print(json.dumps({"skipped_stale_run": record["run_id"], "latest": previous_order}))
            sys.exit(0)
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise
        sha = None
    payload = {
        "message": "ci: record isolated Chromium run [skip ci]",
        "branch": branch,
        "content": base64.b64encode((json.dumps(record, indent=2, sort_keys=True) + "\n").encode()).decode(),
    }
    if sha:
        payload["sha"] = sha
    try:
        request("PUT", api, payload)
        print(json.dumps({"recorded": record, "attempt": attempt + 1}))
        break
    except urllib.error.HTTPError as error:
        if error.code not in (409, 422) or attempt == 2:
            raise
        time.sleep(attempt + 1)
else:
    sys.exit("Could not publish run registry")
