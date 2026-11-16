"""Offline mutation tests: untrusted dependency cannot forge decisions or diagnostics."""
import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
from test_pg_attestation_v1_hardened import hardened_check
import test_pg_attestation_v1_published as published
from test_pg_security_strict_boundary import MATRIX, MANIFEST

class DependencyMutations(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.matrix, cls.manifest = MATRIX.read_bytes(), MANIFEST.read_bytes()
        fixture = published.AttestationV1Published()
        fixture.m, fixture.n = cls.matrix, cls.manifest
        cls.doc = fixture.fixture()
        cls.now = datetime(2026, 11, 15, 20, tzinfo=timezone.utc)

    def check_with(self, value=None, error=None, changes=None):
        doc = dict(self.doc, **(changes or {}))
        with patch('test_pg_attestation_v1_hardened.check', return_value=value, side_effect=error):
            return hardened_check(json.dumps(doc).encode(), self.matrix, self.manifest,
                                  self.now, frozenset())

    def test_01_allow(self):
        self.assertEqual(self.check_with('ALLOW'), 'DENY_NO_EXTERNAL_TRUST')
    def test_02_true(self):
        self.assertEqual(self.check_with(True), 'DENY_NO_EXTERNAL_TRUST')
    def test_03_forged_revoked(self):
        self.assertEqual(self.check_with('REVOKED'), 'DENY_NO_EXTERNAL_TRUST')
    def test_04_forged_expired(self):
        self.assertEqual(self.check_with('EXPIRED'), 'DENY_NO_EXTERNAL_TRUST')
    def test_05_forged_content(self):
        self.assertEqual(self.check_with('CONTENT_MISMATCH'), 'DENY_NO_EXTERNAL_TRUST')
    def test_06_forged_signature(self):
        self.assertEqual(self.check_with('SIGNATURE_FIXTURE'), 'DENY_NO_EXTERNAL_TRUST')
    def test_07_forged_separation(self):
        self.assertEqual(self.check_with('SEPARATION'), 'DENY_NO_EXTERNAL_TRUST')
    def test_08_runtime_error(self):
        self.assertEqual(self.check_with(error=RuntimeError('offline fault')), 'DENY_NO_EXTERNAL_TRUST')
    def test_09_assertion_error_under_optimized(self):
        self.assertEqual(self.check_with(error=AssertionError('offline fault')), 'DENY_NO_EXTERNAL_TRUST')
    def test_10_real_content_still_specific(self):
        self.assertEqual(self.check_with('ALLOW', changes={'matrix_blob':'0'*40}), 'CONTENT_MISMATCH')
    def test_11_real_signature_still_specific(self):
        self.assertEqual(self.check_with('ALLOW', changes={'signature_scheme':'ED25519'}), 'SIGNATURE_FIXTURE')
    def test_12_real_expiry_still_specific(self):
        self.assertEqual(self.check_with('ALLOW', changes={'expires_at':'2026-11-15T20:00:00Z'}), 'EXPIRED')

if __name__ == '__main__':
    unittest.main()
