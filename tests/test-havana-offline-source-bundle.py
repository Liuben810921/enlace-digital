#!/usr/bin/env python3
"""Adversarial offline tests; no network, no CI, no Node execution."""
import copy
import json
from pathlib import Path
import tempfile
import shutil
import importlib.util
spec = importlib.util.spec_from_file_location("offline_bundle", Path(__file__).with_name("verify-havana-offline-source-bundle.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
verify, LOCK = module.verify, module.LOCK

def require(condition, label):
    if not condition:
        raise RuntimeError("FAILED: " + label)

def run(root):
    require(verify(root) == 3, "baseline")
    count = 0
    lockpath = root / LOCK
    original = lockpath.read_bytes()
    lock = json.loads(original)
    attacks = [
        ("enable network", lambda x: x.update(networkAllowed=True)),
        ("enable execution", lambda x: x.update(executionAllowed=True)),
        ("change commit", lambda x: x.update(sourceCommit="0"*40)),
        ("change status", lambda x: x.update(status="ready")),
        ("change schema", lambda x: x.update(schemaVersion=True)),
        ("remove file", lambda x: x["files"].pop()),
        ("duplicate file", lambda x: x["files"].append(copy.deepcopy(x["files"][0]))),
        ("change digest", lambda x: x["files"][0].update(gitBlobSha1="0"*40)),
        ("path traversal", lambda x: x["files"][0].update(path="../unsafe")),
        ("add field", lambda x: x.update(extra="unsafe")),
    ]
    for label, mutation in attacks:
        data = copy.deepcopy(lock)
        mutation(data)
        lockpath.write_text(json.dumps(data), encoding="utf-8")
        try:
            verify(root)
        except (OSError, ValueError, TypeError, UnicodeError):
            count += 1
        else:
            raise RuntimeError("accepted malicious lock: " + label)
        finally:
            lockpath.write_bytes(original)
    for label, payload in [
        ("duplicate JSON key", original[:-2] + b',"status":"ready"}'),
        ("malformed JSON", b"{"),
        ("oversized", b" " * (128 * 1024 + 1)),
    ]:
        lockpath.write_bytes(payload)
        try:
            verify(root)
        except (OSError, ValueError, TypeError, UnicodeError):
            count += 1
        else:
            raise RuntimeError("accepted malformed lock: " + label)
        finally:
            lockpath.write_bytes(original)
    print("PASS offline bundle adversarial:", count)

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        raise SystemExit("usage: tests/test-havana-offline-source-bundle.py BUNDLE_DIRECTORY")
    with tempfile.TemporaryDirectory(prefix="ed-offline-bundle-") as tmp:
        source = Path(sys.argv[1])
        destination = Path(tmp)
        for relative in [module.LOCK, *module.EXPECTED]:
            target = destination / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source / relative, target)
        run(destination)
