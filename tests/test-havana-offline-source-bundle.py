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
        ("change sha256", lambda x: x["files"][0].update(sha256="0"*64)),
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
        ("duplicate JSON key", original.rstrip()[:-1] + b',"status":"ready"}'),
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
    for relative in module.EXPECTED:
        target = root / relative
        original_data = target.read_bytes()
        target.unlink()
        target.symlink_to(root / LOCK)
        try:
            verify(root)
        except (OSError, ValueError, TypeError, UnicodeError):
            count += 1
        else:
            raise RuntimeError("accepted symlink leaf: " + relative)
        finally:
            target.unlink()
            target.write_bytes(original_data)
    # Replace a parent directory with a symlink to an identical copy.
    fixtures = root / "tests/fixtures"
    alternate = root / "fixtures-copy"
    shutil.copytree(fixtures, alternate)
    shutil.rmtree(fixtures)
    fixtures.symlink_to(alternate, target_is_directory=True)
    try:
        verify(root)
    except (OSError, ValueError, TypeError, UnicodeError):
        count += 1
    else:
        raise RuntimeError("accepted symlink parent")
    finally:
        fixtures.unlink()
        shutil.move(str(alternate), str(fixtures))

    # Deterministic race: replace the first file between lstat and os.open.
    target = root / next(iter(module.EXPECTED))
    original_data = target.read_bytes()
    original_open = module.os.open
    def racing_open(path, flags, *args, **kwargs):
        if path == target.name and kwargs.get("dir_fd") is not None:
            target.unlink()
            target.symlink_to(root / LOCK)
        return original_open(path, flags, *args, **kwargs)
    module.os.open = racing_open
    try:
        try:
            verify(root)
        except (OSError, ValueError, TypeError, UnicodeError):
            count += 1
        else:
            raise RuntimeError("accepted TOCTOU leaf swap")
    finally:
        module.os.open = original_open
        target.unlink()
        target.write_bytes(original_data)

    # Parent replacement after the directory descriptor is opened must NOT
    # redirect the read to the newly substituted directory.
    target = root / "tests/fixtures/havana-offline-cartography-manifest.json"
    parent = target.parent
    moved = root / "fixtures-original"
    original_open = module.os.open
    swapped = [False]
    def parent_swap_open(path, flags, *args, **kwargs):
        if path == target.name and kwargs.get("dir_fd") is not None and not swapped[0]:
            swapped[0] = True
            parent.rename(moved)
            parent.mkdir()
            target.write_bytes(b"tampered")
        return original_open(path, flags, *args, **kwargs)
    module.os.open = parent_swap_open
    try:
        require(verify(root) == 3 and swapped[0], "anchored parent replacement")
        count += 1
    finally:
        module.os.open = original_open
        if swapped[0]:
            shutil.rmtree(parent)
            moved.rename(parent)
    # Deterministic in-place write on the already opened inode between fstat
    # and read. This must fail closed, without relying on assert under -O.
    target = root / next(iter(module.EXPECTED))
    original_data = target.read_bytes()
    original_dup = module.os.dup
    mutated = [False]
    def racing_dup(fd):
        result = original_dup(fd)
        metadata = module.os.fstat(fd)
        if not mutated[0] and metadata.st_size == len(original_data):
            # Only mutate the selected source inode, not an unrelated descriptor.
            if (metadata.st_dev, metadata.st_ino) == (target.stat().st_dev, target.stat().st_ino):
                mutated[0] = True
                with target.open("r+b") as writer:
                    writer.seek(0)
                    writer.write(bytes([original_data[0] ^ 1]))
                    writer.flush()
                    module.os.fsync(writer.fileno())
        return result
    module.os.dup = racing_dup
    try:
        try:
            verify(root)
        except (OSError, ValueError, TypeError, UnicodeError):
            require(mutated[0], "in-place write hook executed")
            count += 1
        else:
            raise RuntimeError("accepted in-place inode rewrite")
    finally:
        module.os.dup = original_dup
        target.write_bytes(original_data)
    ancestor = root / "ancestor-link"
    ancestor.symlink_to(root / "tests", target_is_directory=True)
    try:
        try:
            module.read_regular(ancestor / "fixtures", "havana-offline-cartography-manifest.json")
        except (OSError, ValueError, TypeError, UnicodeError):
            count += 1
        else:
            raise RuntimeError("accepted symlink in root ancestor")
    finally:
        ancestor.unlink()

    fd_directory = Path("/proc/self/fd")
    if fd_directory.is_dir():
        before = len(list(fd_directory.iterdir()))
        for _ in range(80):
            try:
                module.read_regular(root, "tests/fixtures/nonexistent-file")
            except (OSError, ValueError, TypeError, UnicodeError):
                pass
            else:
                raise RuntimeError("accepted missing file")
        after = len(list(fd_directory.iterdir()))
        require(before == after, "descriptor cleanup on failures")
        count += 1
    # Root replacement after its directory fd has been opened must retain the original inode.
    original_open = module.os.open
    moved_root = root.with_name(root.name + "-root-original")
    root_swapped = [False]
    def root_swap_open(path, flags, *args, **kwargs):
        fd = original_open(path, flags, *args, **kwargs)
        if path == root.name and kwargs.get("dir_fd") is not None and not root_swapped[0]:
            root_swapped[0] = True
            root.rename(moved_root)
            root.mkdir()
            (root / "tests").mkdir()
        return fd
    module.os.open = root_swap_open
    try:
        require(module.read_regular(root, module.LOCK) == (moved_root / module.LOCK).read_bytes() and root_swapped[0], "root swap retained anchored inode")
        count += 1
    finally:
        module.os.open = original_open
        if root_swapped[0]:
            shutil.rmtree(root)
            moved_root.rename(root)

    # Write on the already-opened inode while its read is in progress; reject changed metadata.
    target = root / next(iter(module.EXPECTED))
    original_data = target.read_bytes()
    original_fdopen = module.os.fdopen
    wrote_during_read = [False]
    class RacingReader:
        def __init__(self, handle):
            self.handle = handle
        def __enter__(self):
            self.handle.__enter__()
            return self
        def __exit__(self, *args):
            return self.handle.__exit__(*args)
        def read(self, *args):
            if not wrote_during_read[0]:
                wrote_during_read[0] = True
                with target.open("r+b") as writer:
                    writer.seek(0)
                    writer.write(bytes([original_data[0] ^ 1]))
                    writer.flush()
                    module.os.fsync(writer.fileno())
            return self.handle.read(*args)
    def racing_fdopen(fd, *args, **kwargs):
        handle = original_fdopen(fd, *args, **kwargs)
        if not wrote_during_read[0] and module.os.fstat(handle.fileno()).st_ino == target.stat().st_ino:
            return RacingReader(handle)
        return handle
    module.os.fdopen = racing_fdopen
    try:
        try:
            verify(root)
        except (OSError, ValueError, TypeError, UnicodeError):
            require(wrote_during_read[0], "write during read hook executed")
            count += 1
        else:
            raise RuntimeError("accepted write during read")
    finally:
        module.os.fdopen = original_fdopen
        target.write_bytes(original_data)
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
