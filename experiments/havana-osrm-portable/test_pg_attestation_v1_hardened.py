"""Fail-closed offline wrapper; never grants authorization."""
import json
import re
import unittest
from datetime import datetime, timezone
import test_pg_attestation_v1_published as published
check = published.check

ID = re.compile(r'[A-Za-z0-9][A-Za-z0-9._:-]{0,127}\Z', re.ASCII)


def hardened_check(raw, matrix, manifest, now, revoked=None, external_verifier=None):
    if not isinstance(raw, bytes) or not isinstance(matrix, bytes) or not isinstance(manifest, bytes):
        return 'INVALID_INPUT'
    if type(now) is not datetime or now.tzinfo is None or now.utcoffset() is None:
        return 'CLOCK'
    if now.utcoffset().total_seconds() != 0:
        return 'CLOCK'
    # Revocation source must be an independently trusted snapshot. None/untrusted input fails closed.
    if type(revoked) is not frozenset or not all(type(x) is str and ID.fullmatch(x) for x in revoked):
        return 'REVOCATION_UNTRUSTED'
    try:
        def unique(pairs):
            d = {}
            for k, v in pairs:
                if k in d: raise ValueError('duplicate')
                d[k] = v
            return d
        d = json.loads(raw.decode('utf-8'), object_pairs_hook=unique,
                       parse_constant=lambda _: (_ for _ in ()).throw(ValueError('nonfinite')))
    except (ValueError, UnicodeError, TypeError):
        return 'INVALID_JSON'
    if not isinstance(d, dict): return 'SCHEMA'
    for key in ('candidate_commit','author_id','revocation_id'):
        if type(d.get(key)) is not str or not ID.fullmatch(d[key]): return 'IDENTIFIER'
    if not re.fullmatch('[0-9a-f]{40}', d['candidate_commit']): return 'IDENTIFIER'
    rs = d.get('reviewers')
    if not isinstance(rs, list) or len(rs) != 2: return 'REVIEWER_SCHEMA'
    for r in rs:
        if not isinstance(r, dict) or type(r.get('reviewer_id')) is not str or not ID.fullmatch(r['reviewer_id']):
            return 'IDENTIFIER'
    for key in ('issued_at','expires_at'):
        v=d.get(key)
        if type(v) is not str or not re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', v):
            return 'TIME'
    # The legacy parser can raise on malformed revocation sources; we pass only validated values.
    try:
        result=check(raw, matrix, manifest, now, revoked=revoked, external_verifier=None)
    except (TypeError, ValueError, OverflowError, UnicodeError, AttributeError, KeyError):
        return 'INVALID_INPUT'
    # Never propagate a positive or unknown decision from a replaceable dependency.
    allowed_denials = frozenset(('INVALID_JSON', 'SCHEMA', 'CONTENT_MISMATCH', 'CLOCK', 'TIME', 'EXPIRED', 'REVOKED', 'REVIEWER_SCHEMA', 'SEPARATION', 'SIGNATURE_FIXTURE', 'DENY_NO_EXTERNAL_TRUST'))
    return result if type(result) is str and result in allowed_denials else 'DENY_NO_EXTERNAL_TRUST'


class HardenedAdversarial(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from test_pg_security_strict_boundary import MATRIX, MANIFEST
        cls.m=MATRIX.read_bytes(); cls.n=MANIFEST.read_bytes()
        t=published.AttestationV1Published(); t.m=cls.m; t.n=cls.n
        cls.d=t.fixture(); cls.now=datetime(2026,11,15,20,tzinfo=timezone.utc)
    def run_case(self, d=None, revoked=frozenset(), now=None):
        return hardened_check(json.dumps(self.d if d is None else d).encode(),self.m,self.n,self.now if now is None else now,revoked)
    def test_01_synthetic_denied(self): self.assertEqual(self.run_case(),'DENY_NO_EXTERNAL_TRUST')
    def test_02_missing_revocation_source(self): self.assertEqual(self.run_case(revoked=None),'REVOCATION_UNTRUSTED')
    def test_03_mutable_revocation_source(self): self.assertEqual(self.run_case(revoked=set()),'REVOCATION_UNTRUSTED')
    def test_04_dict_revocation_source(self): self.assertEqual(self.run_case(revoked={}),'REVOCATION_UNTRUSTED')
    def test_05_boolean_revocation_source(self): self.assertEqual(self.run_case(revoked=True),'REVOCATION_UNTRUSTED')
    def test_06_revoked(self): self.assertEqual(self.run_case(revoked=frozenset({'SYNTHETIC-REV-001'})),'REVOKED')
    def test_07_unicode_confusable_author(self):
        d=dict(self.d,author_id='SYNTHETIC-ΑUTHOR');self.assertEqual(self.run_case(d),'IDENTIFIER')
    def test_08_unicode_confusable_reviewer(self):
        d=json.loads(json.dumps(self.d));d['reviewers'][0]['reviewer_id']='SYNTHETIC-ＳEC';self.assertEqual(self.run_case(d),'IDENTIFIER')
    def test_09_unicode_revocation(self):
        d=dict(self.d,revocation_id='ＲEV-001');self.assertEqual(self.run_case(d),'IDENTIFIER')
    def test_10_non_utc_clock(self):
        from datetime import timedelta
        self.assertEqual(self.run_case(now=datetime(2026,11,15,20,tzinfo=timezone(timedelta(hours=1)))),'CLOCK')
    def test_11_extreme_year(self):
        d=dict(self.d,expires_at='99999-01-01T00:00:00Z');self.assertEqual(self.run_case(d),'TIME')
    def test_12_invalid_day(self):
        d=dict(self.d,expires_at='2026-02-30T00:00:00Z');self.assertEqual(self.run_case(d),'TIME')
    def test_13_invalid_revocation_member(self): self.assertEqual(self.run_case(revoked=frozenset({None})),'REVOCATION_UNTRUSTED')
    def test_14_non_bytes(self): self.assertEqual(hardened_check('bad',self.m,self.n,self.now,frozenset()),'INVALID_INPUT')
    def test_15_forged_external_verifier(self):
        raw=json.dumps(self.d).encode()
        self.assertEqual(hardened_check(raw,self.m,self.n,self.now,frozenset(),external_verifier=True),'DENY_NO_EXTERNAL_TRUST')
    def test_16_duplicate_key(self): self.assertEqual(hardened_check(b'{"a":1,"a":2}',self.m,self.n,self.now,frozenset()),'INVALID_JSON')
    def test_17_unpaired_surrogate(self):
        d=dict(self.d,author_id='\ud800');self.assertEqual(self.run_case(d),'IDENTIFIER')
    def test_18_nonfinite(self): self.assertEqual(hardened_check(b'{"a":NaN}',self.m,self.n,self.now,frozenset()),'INVALID_JSON')

if __name__=='__main__': unittest.main()
