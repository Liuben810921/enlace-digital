"""Bounded subprocess checks; synthetic input only, Linux/POSIX resource limits."""
import json
import os
import subprocess
import sys
import unittest

CHILD = r'''
import json, resource, sys, time
from synthetic_gate import evaluate
from test_synthetic_gate import fixture
resource.setrlimit(resource.RLIMIT_AS, (512*1024*1024, 512*1024*1024))
mode=sys.argv[1]
if mode=='sleep':
    time.sleep(3)
elif mode=='allocate':
    try:
        bytearray(768*1024*1024)
    except MemoryError:
        print('MEMORY_LIMIT_ENFORCED')
    else:
        sys.exit(9)
elif mode=='valid':
    m,c=fixture()
    x=evaluate(json.dumps(m).encode(),json.dumps(c).encode())
    assert x['accepted_for_synthetic_review'] and not x['commercial_approval']
    print('VALID_SYNTHETIC_ONLY')
elif mode=='deep':
    x=evaluate(b'['*500+b']'*500,b'{}')
    assert not x['accepted_for_synthetic_review']
    print('DEEP_REJECTED')
elif mode=='large':
    x=evaluate(b' '*2000001,b' '*2000000)
    assert not x['accepted_for_synthetic_review']
    print('SIZE_REJECTED')
else:
    sys.exit(8)
'''

@unittest.skipUnless(sys.platform.startswith('linux') and hasattr(os, 'fork'), 'Linux process limits required')
class ProcessLimits(unittest.TestCase):
    def run_child(self, mode, timeout=2):
        return subprocess.run([sys.executable, '-c', CHILD, mode], capture_output=True,
                              text=True, timeout=timeout, check=False, cwd=os.path.dirname(__file__))
    def test_valid_under_memory_limit(self):
        r=self.run_child('valid'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertIn('VALID_SYNTHETIC_ONLY',r.stdout)
    def test_deep_json_under_memory_limit(self):
        r=self.run_child('deep'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertIn('DEEP_REJECTED',r.stdout)
    def test_large_input_under_memory_limit(self):
        r=self.run_child('large'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertIn('SIZE_REJECTED',r.stdout)
    def test_memory_cap_enforced(self):
        r=self.run_child('allocate'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertIn('MEMORY_LIMIT_ENFORCED',r.stdout)
    def test_timeout_enforced(self):
        with self.assertRaises(subprocess.TimeoutExpired): self.run_child('sleep',timeout=0.15)

if __name__=='__main__': unittest.main()
