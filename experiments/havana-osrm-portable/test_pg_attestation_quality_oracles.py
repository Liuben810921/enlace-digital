"""Independent, offline quality oracles: assert specific rejection reasons.

These checks do not confer trust or authorization.
"""
import json
import unittest
from datetime import datetime, timezone
from unittest.mock import patch
import test_pg_attestation_v1_published as base
from test_pg_attestation_v1_hardened import hardened_check
from test_pg_attestation_trust_boundary import trust_boundary, DENY, REQUIRED
from test_pg_security_strict_boundary import MATRIX, MANIFEST

class QualityOracles(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m, cls.n = MATRIX.read_bytes(), MANIFEST.read_bytes()
        t=base.AttestationV1Published();t.m=cls.m;t.n=cls.n
        cls.doc=t.fixture()
        cls.now=datetime(2026,11,15,20,tzinfo=timezone.utc)

    def decision(self, **changes):
        d=dict(self.doc, **changes)
        return hardened_check(json.dumps(d).encode(),self.m,self.n,self.now,frozenset())

    def test_01_baseline_denied(self):
        self.assertEqual(self.decision(),'DENY_NO_EXTERNAL_TRUST')
    def test_02_wrong_commit_type(self):
        self.assertEqual(self.decision(candidate_commit=42),'IDENTIFIER')
    def test_03_commit_non_hex(self):
        self.assertEqual(self.decision(candidate_commit='g'*40),'IDENTIFIER')
    def test_04_commit_wrong_length(self):
        self.assertEqual(self.decision(candidate_commit='a'*39),'IDENTIFIER')
    def test_05_missing_author(self):
        self.assertEqual(self.decision(author_id=''),'IDENTIFIER')
    def test_06_unicode_author(self):
        self.assertEqual(self.decision(author_id='SYNTHETIC-ΑUTHOR'),'IDENTIFIER')
    def test_07_revocation_source_mutable(self):
        self.assertEqual(hardened_check(json.dumps(self.doc).encode(),self.m,self.n,self.now,set()),'REVOCATION_UNTRUSTED')
    def test_08_revoked_specific(self):
        self.assertEqual(hardened_check(json.dumps(self.doc).encode(),self.m,self.n,self.now,frozenset({self.doc['revocation_id']})),'REVOKED')
    def test_09_bad_date_separator(self):
        self.assertEqual(self.decision(issued_at='2026-11-15 19:00:00Z'),'TIME')
    def test_10_bad_calendar_date(self):
        self.assertEqual(self.decision(expires_at='2026-02-30T00:00:00Z'),'TIME')
    def test_11_expired_at_boundary(self):
        self.assertEqual(self.decision(expires_at='2026-11-15T20:00:00Z'),'EXPIRED')
    def test_12_manifest_changed(self):
        raw=json.dumps(self.doc).encode()
        self.assertEqual(hardened_check(raw,self.m,self.n+b'X',self.now,frozenset()),'CONTENT_MISMATCH')
    def test_13_wrong_reviewer_role_unhashable(self):
        d=json.loads(json.dumps(self.doc));d['reviewers'][0]['role']=['security']
        self.assertEqual(hardened_check(json.dumps(d).encode(),self.m,self.n,self.now,frozenset()),'SEPARATION')
    def test_14_duplicate_reviewer(self):
        d=json.loads(json.dumps(self.doc));d['reviewers'][1]['reviewer_id']=d['reviewers'][0]['reviewer_id']
        self.assertEqual(hardened_check(json.dumps(d).encode(),self.m,self.n,self.now,frozenset()),'SEPARATION')
    def test_15_author_is_reviewer(self):
        self.assertEqual(self.decision(author_id='SYNTHETIC-SEC'),'SEPARATION')
    def test_16_signature_fixture_rejected(self):
        self.assertEqual(self.decision(signature_scheme='ED25519'),'SIGNATURE_FIXTURE')
    def test_17_missing_external_verifier_denied(self):
        self.assertEqual(hardened_check(json.dumps(self.doc).encode(),self.m,self.n,self.now,frozenset(),external_verifier=lambda *_: True),'DENY_NO_EXTERNAL_TRUST')
    def test_18_trust_boundary_is_constant_deny_even_if_validation_bypassed(self):
        c={k:{'trusted':True} for k in REQUIRED}
        self.assertEqual(trust_boundary(c,self.m,self.n,self.now),DENY)
    def test_19_mutation_oracle_catches_wrong_baseline_result(self):
        with patch('test_pg_attestation_v1_hardened.check',return_value='ALLOW'):
            self.assertEqual(self.decision(),'DENY_NO_EXTERNAL_TRUST')
    def test_20_mutation_oracle_catches_wrong_content_result(self):
        with patch('test_pg_attestation_v1_hardened.check',return_value='DENY_NO_EXTERNAL_TRUST'):
            self.assertEqual(hardened_check(json.dumps(self.doc).encode(),self.m,self.n+b'X',self.now,frozenset()),'CONTENT_MISMATCH')

if __name__ == '__main__': unittest.main()
