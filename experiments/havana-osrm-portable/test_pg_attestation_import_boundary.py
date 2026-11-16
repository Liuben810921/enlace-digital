"""Mutation oracles for imported helpers, parsing failures, and concurrent faults."""
import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
import test_pg_attestation_v1_hardened as h
import test_pg_attestation_v1_published as published
from test_pg_security_strict_boundary import MATRIX, MANIFEST

class ImportedBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m,cls.n=MATRIX.read_bytes(),MANIFEST.read_bytes()
        f=published.AttestationV1Published();f.m=cls.m;f.n=cls.n
        cls.doc=f.fixture();cls.now=datetime(2026,11,15,20,tzinfo=timezone.utc)
    def runcheck(self, doc=None):
        return h.hardened_check(json.dumps(self.doc if doc is None else doc).encode(),self.m,self.n,self.now,frozenset())
    def test_01_imported_git_blob_raises(self):
        with patch.object(h,'git_blob',side_effect=RuntimeError('mutated')):
            self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_02_imported_keys_raises(self):
        with patch.object(published,'KEYS',None):
            self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_03_imported_review_schema_raises(self):
        with patch.object(published,'REVIEW',None):
            self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_04_hash_helper_raises(self):
        with patch.object(h.hashlib,'sha256',side_effect=RuntimeError('mutated')):
            self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_05_json_parser_raises(self):
        with patch.object(h.json,'loads',side_effect=RuntimeError('mutated')):
            self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_06_simultaneous_helper_and_dependency(self):
        with patch.object(h,'git_blob',side_effect=RuntimeError('mutated')),patch.object(h,'check',return_value='ALLOW'):
            self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_07_simultaneous_content_and_allow(self):
        with patch.object(h,'check',return_value='ALLOW'):
            self.assertEqual(self.runcheck(dict(self.doc,matrix_blob='f'*40)),'CONTENT_MISMATCH')
    def test_08_simultaneous_expiry_and_allow(self):
        with patch.object(h,'check',return_value='ALLOW'):
            self.assertEqual(self.runcheck(dict(self.doc,expires_at='2026-11-15T20:00:00Z')),'EXPIRED')
    def test_09_baseexception_boundary(self):
        with patch.object(h,'git_blob',side_effect=KeyboardInterrupt('stop')):
            with self.assertRaises(KeyboardInterrupt): self.runcheck()
    def test_10_system_exit_boundary(self):
        with patch.object(h,'git_blob',side_effect=SystemExit(3)):
            with self.assertRaises(SystemExit): self.runcheck()

if __name__=='__main__': unittest.main()
