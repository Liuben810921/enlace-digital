"""Adversarial offline regression tests for the exact published v1 attestation."""
import copy
import hashlib
import json
import unittest
from datetime import datetime, timezone, timedelta
from test_pg_attestation_v1_published import check
import test_pg_attestation_v1_published as published
from test_pg_security_strict_boundary import git_blob

class AttestationV1Negative(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        base = published.AttestationV1Published()
        cls.m = base.m = __import__('test_pg_security_strict_boundary').MATRIX.read_bytes()
        cls.n = base.n = __import__('test_pg_security_strict_boundary').MANIFEST.read_bytes()
        cls.fixture = base.fixture
        cls.now = datetime(2026, 11, 15, 20, tzinfo=timezone.utc)

    def run_case(self, change=None, **kwargs):
        d = self.fixture()
        if change: change(d)
        return check(json.dumps(d).encode(), self.m, self.n, kwargs.pop('now', self.now), **kwargs)

    def test_01_issued_boundary(self):
        self.assertEqual(self.run_case(now=datetime(2026,11,15,19,tzinfo=timezone.utc)), 'DENY_NO_EXTERNAL_TRUST')
    def test_02_expires_boundary(self):
        self.assertEqual(self.run_case(now=datetime(2026,11,16,19,tzinfo=timezone.utc)), 'EXPIRED')
    def test_03_before_issue(self):
        self.assertEqual(self.run_case(now=datetime(2026,11,15,18,tzinfo=timezone.utc)), 'EXPIRED')
    def test_04_reversed_window(self):
        self.assertEqual(self.run_case(lambda d: d.update(expires_at='2026-11-15T18:00:00Z')), 'EXPIRED')
    def test_05_naive_clock(self):
        self.assertEqual(self.run_case(now=datetime(2026,11,15,20)), 'CLOCK')
    def test_06_bad_time_zone(self):
        self.assertEqual(self.run_case(lambda d: d.update(expires_at='2026-11-16T19:00:00+01:00')), 'TIME')
    def test_07_bad_timestamp(self):
        self.assertEqual(self.run_case(lambda d: d.update(issued_at='not-a-time')), 'TIME')
    def test_08_revocation_matches(self):
        self.assertEqual(self.run_case(revoked={'SYNTHETIC-REV-001'}), 'REVOKED')
    def test_09_revocation_empty(self):
        self.assertEqual(self.run_case(lambda d: d.update(revocation_id='')), 'REVOKED')
    def test_10_author_same_as_business(self):
        self.assertEqual(self.run_case(lambda d: d.update(author_id='SYNTHETIC-BIZ')), 'SEPARATION')
    def test_11_reviewer_duplicate(self):
        self.assertEqual(self.run_case(lambda d: d['reviewers'][1].update(reviewer_id='SYNTHETIC-SEC')), 'SEPARATION')
    def test_12_reviewer_rejected(self):
        self.assertEqual(self.run_case(lambda d: d['reviewers'][0].update(decision='REJECTED')), 'SEPARATION')
    def test_13_extra_reviewer_field(self):
        self.assertEqual(self.run_case(lambda d: d['reviewers'][0].update(extra=True)), 'REVIEWER_SCHEMA')
    def test_14_extra_attestation_field(self):
        self.assertEqual(self.run_case(lambda d: d.update(extra=True)), 'SCHEMA')
    def test_15_manifest_substitution(self):
        d=self.fixture()
        self.assertEqual(check(json.dumps(d).encode(),self.m,self.n+b' ',self.now), 'CONTENT_MISMATCH')
    def test_16_coordinated_reanchor_never_allows(self):
        d=self.fixture()
        changed=self.m+b' '
        d['matrix_blob']=git_blob(changed)
        d['matrix_sha256']=hashlib.sha256(changed).hexdigest()
        self.assertEqual(check(json.dumps(d).encode(),changed,self.n,self.now), 'DENY_NO_EXTERNAL_TRUST')
    def test_17_untrusted_external_verifier_never_allows(self):
        self.assertEqual(self.run_case(external_verifier=lambda *a: True), 'DENY_NO_EXTERNAL_TRUST')
    def test_18_signature_fixture_not_crypto(self):
        self.assertEqual(self.run_case(lambda d: d.update(signature_scheme='Ed25519')), 'SIGNATURE_FIXTURE')
    def test_19_duplicate_nested_json(self):
        d=self.fixture()
        raw=json.dumps(d).replace('"role": "security"', '"role": "security", "role": "business"',1).encode()
        self.assertEqual(check(raw,self.m,self.n,self.now), 'INVALID_JSON')
    def test_20_unsupported_version(self):
        self.assertEqual(self.run_case(lambda d: d.update(version=2)), 'SCHEMA')

if __name__=='__main__': unittest.main()
