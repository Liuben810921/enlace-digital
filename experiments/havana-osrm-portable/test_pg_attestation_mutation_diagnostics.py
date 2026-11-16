"""Mutated downstream decisions must not erase independently checked rejection reasons."""
import json
import unittest
from unittest.mock import patch
from test_pg_attestation_v1_hardened import hardened_check
import test_pg_attestation_v1_published as published
from test_pg_security_strict_boundary import MATRIX, MANIFEST
from datetime import datetime, timezone

class MutationDiagnostics(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m, cls.n = MATRIX.read_bytes(), MANIFEST.read_bytes()
        fixture = published.AttestationV1Published()
        fixture.m, fixture.n = cls.m, cls.n
        cls.doc = fixture.fixture()
        cls.now = datetime(2026, 11, 15, 20, tzinfo=timezone.utc)

    def evaluate(self, changes=None, *, matrix=None, revoked=frozenset()):
        doc = json.loads(json.dumps(self.doc))
        if changes:
            doc.update(changes)
        raw = json.dumps(doc).encode()
        with patch('test_pg_attestation_v1_hardened.check', return_value='DENY_NO_EXTERNAL_TRUST'):
            return hardened_check(raw, self.m if matrix is None else matrix,
                                  self.n, self.now, revoked)

    def test_content_not_masked(self):
        self.assertEqual(self.evaluate(matrix=self.m+b'x'), 'CONTENT_MISMATCH')

    def test_signature_not_masked(self):
        self.assertEqual(self.evaluate({'signature_scheme':'ED25519'}), 'SIGNATURE_FIXTURE')

    def test_expiry_not_masked(self):
        self.assertEqual(self.evaluate({'expires_at':'2026-11-15T20:00:00Z'}), 'EXPIRED')

    def test_revocation_not_masked(self):
        self.assertEqual(self.evaluate(revoked=frozenset({self.doc['revocation_id']})), 'REVOKED')

    def test_separation_not_masked(self):
        self.assertEqual(self.evaluate({'author_id':'SYNTHETIC-SEC'}), 'SEPARATION')

if __name__ == '__main__':
    unittest.main()
