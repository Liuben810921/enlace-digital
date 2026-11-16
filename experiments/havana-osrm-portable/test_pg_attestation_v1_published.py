"""Versioned synthetic attestation: offline deny-by-default contract."""
import hashlib
import json
import unittest
from datetime import datetime, timezone
from test_pg_security_strict_boundary import MATRIX, MANIFEST, git_blob

KEYS = {'version','candidate_commit','matrix_blob','manifest_blob','matrix_sha256','manifest_sha256','issued_at','expires_at','author_id','reviewers','revocation_id','signature_scheme','signatures'}
REVIEW = {'reviewer_id','role','decision'}

def check(raw, matrix, manifest, now, revoked=frozenset(), external_verifier=None):
    def pairs(seq):
        out = {}
        for k,v in seq:
            if k in out: raise ValueError('duplicate')
            out[k]=v
        return out
    try:
        d=json.loads(raw.decode('utf-8'),object_pairs_hook=pairs,parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))
    except (ValueError,UnicodeError,TypeError):
        return 'INVALID_JSON'
    if not isinstance(d,dict) or set(d)!=KEYS or type(d['version']) is not int or d['version']!=1:
        return 'SCHEMA'
    if any(not isinstance(d[k],str) for k in KEYS-{'version','reviewers','signatures'}):
        return 'SCHEMA'
    if d['matrix_blob']!=git_blob(matrix) or d['manifest_blob']!=git_blob(manifest) or d['matrix_sha256']!=hashlib.sha256(matrix).hexdigest() or d['manifest_sha256']!=hashlib.sha256(manifest).hexdigest():
        return 'CONTENT_MISMATCH'
    try:
        if not isinstance(now,datetime) or now.tzinfo is None: return 'CLOCK'
        def utc(s):
            if not s.endswith('Z'): raise ValueError('UTC required')
            return datetime.fromisoformat(s[:-1]+'+00:00')
        start,end=utc(d['issued_at']),utc(d['expires_at'])
    except (ValueError,TypeError):
        return 'TIME'
    if not start<end or not start<=now<end: return 'EXPIRED'
    if not d['revocation_id'] or d['revocation_id'] in revoked: return 'REVOKED'
    rs=d['reviewers']
    if not isinstance(rs,list) or len(rs)!=2 or any(not isinstance(r,dict) or set(r)!=REVIEW for r in rs):
        return 'REVIEWER_SCHEMA'
    if set(r['role'] for r in rs)!={'security','business'} or any(not isinstance(r['reviewer_id'],str) or not r['reviewer_id'] or r['decision']!='APPROVED' for r in rs) or len({r['reviewer_id'] for r in rs})!=2 or d['author_id'] in {r['reviewer_id'] for r in rs}:
        return 'SEPARATION'
    if d['signature_scheme']!='SYNTHETIC-NOT-CRYPTO' or not isinstance(d['signatures'],list) or len(d['signatures'])!=2 or any(not isinstance(s,str) or not s.startswith('SYNTHETIC:') for s in d['signatures']):
        return 'SIGNATURE_FIXTURE'
    # An untrusted caller-supplied verifier, flag, or signature cannot grant access.
    return 'DENY_NO_EXTERNAL_TRUST'

class AttestationV1Published(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m=MATRIX.read_bytes();cls.n=MANIFEST.read_bytes()
        cls.now=datetime(2026,11,15,20,tzinfo=timezone.utc)
    def fixture(self):
        return dict(version=1,candidate_commit='a'*40,matrix_blob=git_blob(self.m),manifest_blob=git_blob(self.n),matrix_sha256=hashlib.sha256(self.m).hexdigest(),manifest_sha256=hashlib.sha256(self.n).hexdigest(),issued_at='2026-11-15T19:00:00Z',expires_at='2026-11-16T19:00:00Z',author_id='SYNTHETIC-AUTHOR',reviewers=[dict(reviewer_id='SYNTHETIC-SEC',role='security',decision='APPROVED'),dict(reviewer_id='SYNTHETIC-BIZ',role='business',decision='APPROVED')],revocation_id='SYNTHETIC-REV-001',signature_scheme='SYNTHETIC-NOT-CRYPTO',signatures=['SYNTHETIC:a','SYNTHETIC:b'])
    def runcheck(self,d=None,**kw):
        return check(json.dumps(self.fixture() if d is None else d).encode(),self.m,self.n,kw.pop('now',self.now),**kw)
    def test_synthetic_denied(self): self.assertEqual(self.runcheck(),'DENY_NO_EXTERNAL_TRUST')
    def test_injected_verifier_denied(self): self.assertEqual(self.runcheck(external_verifier=True),'DENY_NO_EXTERNAL_TRUST')
    def test_missing_field(self):
        d=self.fixture();del d['expires_at'];self.assertEqual(self.runcheck(d),'SCHEMA')
    def test_duplicate_json(self): self.assertEqual(check(b'{"version":1,"version":1}',self.m,self.n,self.now),'INVALID_JSON')
    def test_changed_matrix(self):
        d=self.fixture();self.assertEqual(check(json.dumps(d).encode(),self.m+b' ',self.n,self.now),'CONTENT_MISMATCH')
    def test_expired(self): self.assertEqual(self.runcheck(now=datetime(2026,11,17,tzinfo=timezone.utc)),'EXPIRED')
    def test_revoked(self): self.assertEqual(self.runcheck(revoked={'SYNTHETIC-REV-001'}),'REVOKED')
    def test_same_reviewer(self):
        d=self.fixture();d['reviewers'][1]['reviewer_id']='SYNTHETIC-SEC';self.assertEqual(self.runcheck(d),'SEPARATION')
    def test_author_reviewer(self):
        d=self.fixture();d['author_id']='SYNTHETIC-SEC';self.assertEqual(self.runcheck(d),'SEPARATION')
    def test_wrong_roles(self):
        d=self.fixture();d['reviewers'][1]['role']='security';self.assertEqual(self.runcheck(d),'SEPARATION')
    def test_forged_scheme(self):
        d=self.fixture();d['signature_scheme']='Ed25519';self.assertEqual(self.runcheck(d),'SIGNATURE_FIXTURE')
    def test_nonfinite(self): self.assertEqual(check(b'{"x":NaN}',self.m,self.n,self.now),'INVALID_JSON')

if __name__=='__main__':unittest.main()
