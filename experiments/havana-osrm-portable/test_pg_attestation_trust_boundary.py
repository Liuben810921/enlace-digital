"""Offline trust-boundary threat model. Synthetic claims NEVER authorize."""
import copy
import hashlib
import json
import unittest
from datetime import datetime, timezone
from test_pg_attestation_v1_hardened import hardened_check
import test_pg_attestation_v1_published as published
from test_pg_security_strict_boundary import MATRIX, MANIFEST, git_blob

DENY = 'DENY_EXTERNAL_TRUST_UNAVAILABLE'
REQUIRED = frozenset(('anchor', 'reviewers', 'revocations', 'clock', 'signatures'))

def trust_boundary(claims, matrix, manifest, now, *, unavailable=frozenset()):
    """Demonstrate dependency checks without possessing external trust roots.

    Claims and proofs are entirely caller-controlled, so the only final decision is DENY.
    """
    if not isinstance(claims, dict) or set(claims) != REQUIRED:
        return DENY
    if type(unavailable) is not frozenset or unavailable:
        return DENY
    if type(now) is not datetime or now.tzinfo is None:
        return DENY
    if type(matrix) is not bytes or type(manifest) is not bytes:
        return DENY
    for key in REQUIRED:
        if not isinstance(claims[key], dict) or claims[key].get('trusted') is not True:
            return DENY
    return DENY

class TrustBoundaryAdversarial(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m=MATRIX.read_bytes(); cls.n=MANIFEST.read_bytes()
        t=published.AttestationV1Published();t.m=cls.m;t.n=cls.n
        cls.attestation=t.fixture()
        cls.now=datetime(2026,11,15,20,tzinfo=timezone.utc)
    def claims(self):
        return {k:{'trusted':True,'evidence':'SYNTHETIC-NOT-VERIFIED'} for k in REQUIRED}
    def decision(self, claims=None, **kw):
        return trust_boundary(self.claims() if claims is None else claims,self.m,self.n,self.now,**kw)
    def test_01_complete_claims_denied(self): self.assertEqual(self.decision(),DENY)
    def test_02_missing_anchor(self):
        c=self.claims();del c['anchor'];self.assertEqual(self.decision(c),DENY)
    def test_03_replaced_anchor(self):
        c=self.claims();c['anchor']['evidence']='FORGED';self.assertEqual(self.decision(c),DENY)
    def test_04_reviewer_identity_spoof(self):
        c=self.claims();c['reviewers']['identity']='FAKE';self.assertEqual(self.decision(c),DENY)
    def test_05_reviewer_role_collusion(self):
        c=self.claims();c['reviewers']['roles']=['security','security'];self.assertEqual(self.decision(c),DENY)
    def test_06_revocation_forgery(self):
        c=self.claims();c['revocations']['snapshot']='REPLACED';self.assertEqual(self.decision(c),DENY)
    def test_07_stale_revocation(self):
        c=self.claims();c['revocations']['issued_at']='2000-01-01';self.assertEqual(self.decision(c),DENY)
    def test_08_clock_rollback(self):
        c=self.claims();c['clock']['offset']=-3600;self.assertEqual(self.decision(c),DENY)
    def test_09_signature_replay(self):
        c=self.claims();c['signatures']['candidate_commit']='b'*40;self.assertEqual(self.decision(c),DENY)
    def test_10_signature_substitution(self):
        c=self.claims();c['signatures']['sig']='SYNTHETIC';self.assertEqual(self.decision(c),DENY)
    def test_11_dependency_anchor_unavailable(self): self.assertEqual(self.decision(unavailable=frozenset({'anchor'})),DENY)
    def test_12_dependency_clock_unavailable(self): self.assertEqual(self.decision(unavailable=frozenset({'clock'})),DENY)
    def test_13_dependency_revocation_unavailable(self): self.assertEqual(self.decision(unavailable=frozenset({'revocations'})),DENY)
    def test_14_dependency_signatures_unavailable(self): self.assertEqual(self.decision(unavailable=frozenset({'signatures'})),DENY)
    def test_15_dependency_reviewers_unavailable(self): self.assertEqual(self.decision(unavailable=frozenset({'reviewers'})),DENY)
    def test_16_invalid_claims(self): self.assertEqual(self.decision(None if False else []),DENY)
    def test_17_boolean_spoof(self):
        c=self.claims();c['anchor']['trusted']=1;self.assertEqual(self.decision(c),DENY)
    def test_18_replay_across_manifest(self):
        c=self.claims();self.assertEqual(trust_boundary(c,self.m,self.n+b' ',self.now),DENY)
    def test_19_synthetic_hardened_still_denied(self):
        raw=json.dumps(self.attestation).encode()
        self.assertEqual(hardened_check(raw,self.m,self.n,self.now,frozenset()),'DENY_NO_EXTERNAL_TRUST')
    def test_20_synthetic_hardened_revoked(self):
        raw=json.dumps(self.attestation).encode()
        self.assertEqual(hardened_check(raw,self.m,self.n,self.now,frozenset({'SYNTHETIC-REV-001'})),'REVOKED')

if __name__ == '__main__': unittest.main()
