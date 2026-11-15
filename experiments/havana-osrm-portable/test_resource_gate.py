"""Resource and hostile-input checks, entirely offline."""
import unittest
from synthetic_gate import evaluate
from test_synthetic_gate import fixture, check

class ResourceGateTests(unittest.TestCase):
    def test_aggregate_limit(self):
        x=evaluate(b" "*2_000_001,b" "*2_000_000)
        self.assertFalse(x['integrity']['passed'])
        self.assertIn('combined input size',x['integrity']['error'])
    def test_boundary_fails_closed(self):
        x=evaluate(b" "*2_000_000,b" "*2_000_000)
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_manifest_oversize(self):
        x=evaluate(b" "*4_000_001,b'{}')
        self.assertFalse(x['integrity']['passed'])
    def test_corpus_oversize(self):
        x=evaluate(b'{}',b" "*4_000_001)
        self.assertFalse(x['integrity']['passed'])
    def test_deep_manifest(self):
        x=evaluate(b'['*2000+b']'*2000,b'{}')
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_deep_corpus(self):
        m,c=fixture()
        x=evaluate(b'{}',b'['*2000+b']'*2000)
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_massive_integer(self):
        x=evaluate(b'{"a":'+b'9'*100000+b'}',b'{}')
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_surrogate_manifest(self):
        x=evaluate(b'{"a":"\ud800"}',b'{}')
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_invalid_utf8(self):
        x=evaluate(b'\xff',b'{}')
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_memoryview_rejected(self):
        x=evaluate(memoryview(b'{}'),b'{}')
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_bytearray_rejected(self):
        x=evaluate(bytearray(b'{}'),b'{}')
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_valid_unchanged(self):
        m,c=fixture()
        x=check(m,c)
        self.assertTrue(x['accepted_for_synthetic_review'])
        self.assertFalse(x['commercial_approval'])
if __name__=='__main__': unittest.main()
