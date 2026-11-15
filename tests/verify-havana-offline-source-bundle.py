#!/usr/bin/env python3
"""Offline, read-only verification of an explicitly supplied source bundle; never fetches."""
import hashlib
import json
import os
from pathlib import Path
import stat
import sys

EXPECTED = {
    "tests/havana-offline-cartography-manifest-isolated.cjs": "c8503cb7a67c5d4517ef21ba34881a412fbddc6c",
    "tests/havana-offline-cartography-manifest-isolated.test.cjs": "af3bbcb60ff67237ed3691b45a30046cd52322e1",
    "tests/fixtures/havana-offline-cartography-manifest.json": "cf9f67c507d2619ee5979a39db0caef3e6ae7145",
}
SHA256 = {
    "tests/havana-offline-cartography-manifest-isolated.cjs": "f53625ccd634311c4858303dfe03280702b694dc8f110f5766a5598969599c40",
    "tests/havana-offline-cartography-manifest-isolated.test.cjs": "27bea12aa0b192c99c86f647fd4fc7a70f04dc7d407ea9e4f2995ccd7cf97cfc",
    "tests/fixtures/havana-offline-cartography-manifest.json": "092dfeac27878b4dc01d49222e21b352400c0327bce98745dd05139326546435",
}
SOURCE_COMMIT = "1ce20519fea72c6f4d723cc82dab0b0fbf33a793"
LOCK = "tests/fixtures/havana-offline-source-bundle-lock.json"
MAX_BYTES = 128 * 1024

def fail(message):
    raise ValueError(message)

def git_blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + bytes([0]) + data).hexdigest()

def read_regular(root, relative):
    """Read only beneath an anchored root fd; reject symlinks at every level."""
    parts = Path(relative).parts
    if not parts or any(p in ("", ".", "..") for p in parts) or Path(relative).is_absolute():
        fail("unsafe_path:" + relative)
    directory_flags = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW | getattr(os, "O_CLOEXEC", 0)
    file_flags = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK | getattr(os, "O_CLOEXEC", 0)
    descriptors = []
    try:
        base = Path(root).absolute()
        # Reject a symlinked root before opening; the descriptor is thereafter anchored.
        if not stat.S_ISDIR(base.lstat().st_mode):
            fail("unsafe_root")
        fd = os.open(base, directory_flags)
        descriptors.append(fd)
        for component in parts[:-1]:
            fd = os.open(component, directory_flags, dir_fd=fd)
            descriptors.append(fd)
        fd = os.open(parts[-1], file_flags, dir_fd=fd)
        descriptors.append(fd)
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1:
            fail("non_regular_or_hardlinked:" + relative)
        if before.st_size > MAX_BYTES:
            fail("oversized:" + relative)
        with os.fdopen(os.dup(fd), "rb") as handle:
            data = handle.read(MAX_BYTES + 1)
        after = os.fstat(fd)
        if len(data) > MAX_BYTES or len(data) != before.st_size:
            fail("oversized_or_changed:" + relative)
        fields = ("st_dev", "st_ino", "st_size", "st_mtime_ns", "st_ctime_ns")
        if any(getattr(before, field) != getattr(after, field) for field in fields):
            fail("changed_during_read:" + relative)
        return data
    finally:
        for fd in reversed(descriptors):
            os.close(fd)

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
        if not isinstance(item, dict) or set(item) != {"path", "gitBlobSha1", "sha256"}:
            fail("invalid_file_entry")
        name, expected = item["path"], item["gitBlobSha1"]
        if not isinstance(name, str) or name not in EXPECTED or name in seen or expected != EXPECTED[name] or item["sha256"] != SHA256[name]:
            fail("unexpected_path_or_digest")
        seen.add(name)
    if seen != set(EXPECTED):
        fail("missing_file")
    for name, digest in EXPECTED.items():
        data = read_regular(root, name)
        if git_blob_sha(data) != digest or hashlib.sha256(data).hexdigest() != SHA256[name]:
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
