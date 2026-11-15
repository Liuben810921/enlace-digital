#!/usr/bin/env python3
"""Offline, read-only verification of an explicitly supplied source bundle; never fetches."""
import hashlib
import json
from pathlib import Path
import stat
import sys

EXPECTED = {
    "tests/havana-offline-cartography-manifest-isolated.cjs": "c8503cb7a67c5d4517ef21ba34881a412fbddc6c",
    "tests/havana-offline-cartography-manifest-isolated.test.cjs": "af3bbcb60ff67237ed3691b45a30046cd52322e1",
    "tests/fixtures/havana-offline-cartography-manifest.json": "cf9f67c507d2619ee5979a39db0caef3e6ae7145",
}
SOURCE_COMMIT = "1ce20519fea72c6f4d723cc82dab0b0fbf33a793"
LOCK = "tests/fixtures/havana-offline-source-bundle-lock.json"
MAX_BYTES = 128 * 1024

def fail(message):
    raise ValueError(message)

def git_blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + bytes([0]) + data).hexdigest()

def read_regular(root, relative):
    path = root / relative
    st = path.lstat()
    if not stat.S_ISREG(st.st_mode) or st.st_nlink != 1:
        fail("non_regular_or_hardlinked:" + relative)
    if st.st_size > MAX_BYTES:
        fail("oversized:" + relative)
    with path.open("rb") as handle:
        data = handle.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        fail("oversized:" + relative)
    return data

def verify(root):
    root = Path(root)
    lock_raw = read_regular(root, LOCK)
    def no_duplicates(pairs):
        result = {}
        for k, v in pairs:
            if k in result:
                fail("duplicate_json_key:" + k)
            result[k] = v
        return result
    lock = json.loads(lock_raw.decode("utf-8"), object_pairs_hook=no_duplicates)
    if not isinstance(lock, dict) or set(lock) != {"schemaVersion", "status", "sourceCommit", "networkAllowed", "executionAllowed", "files"}:
        fail("invalid_lock_schema")
    if type(lock["schemaVersion"]) is not int or lock["schemaVersion"] != 1 or lock["status"] != "blocked_offline_review_only":
        fail("invalid_lock_status")
    if lock["sourceCommit"] != SOURCE_COMMIT or lock["networkAllowed"] is not False or lock["executionAllowed"] is not False:
        fail("unsafe_lock_flags")
    files = lock["files"]
    if not isinstance(files, list) or len(files) != len(EXPECTED):
        fail("invalid_file_list")
    seen = set()
    for item in files:
        if not isinstance(item, dict) or set(item) != {"path", "gitBlobSha1"}:
            fail("invalid_file_entry")
        name, expected = item["path"], item["gitBlobSha1"]
        if not isinstance(name, str) or name not in EXPECTED or name in seen or expected != EXPECTED[name]:
            fail("unexpected_path_or_digest")
        seen.add(name)
    if seen != set(EXPECTED):
        fail("missing_file")
    for name, digest in EXPECTED.items():
        data = read_regular(root, name)
        if git_blob_sha(data) != digest:
            fail("hash_mismatch:" + name)
    return len(EXPECTED)

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            fail("usage: verifier.py BUNDLE_DIRECTORY")
        count = verify(sys.argv[1])
        print("PASS offline source bundle:", count, "pinned files; no network or execution")
    except (OSError, ValueError, UnicodeError, TypeError, json.JSONDecodeError) as error:
        print("BLOCKED offline source bundle:", str(error), file=sys.stderr)
        sys.exit(1)
