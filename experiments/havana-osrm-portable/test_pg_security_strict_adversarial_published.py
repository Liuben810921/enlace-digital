"""Offline adversarial checks of strict validator, no services."""
import hashlib
import json
import unittest
from test_pg_security_strict_boundary import (MATRIX, MANIFEST, strict_validate, git_blob,
    TRUSTED_MATRIX_BLOB, TRUSTED_MANIFEST_BLOB)
from test_pg_security_semantic_manifest import fingerprint

class StrictAdversarialPublished(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m=MATRIX.read_bytes()
        cls.n=MANIFEST.read_bytes()

    def check(self,m=None,n=None,reanchor=False):
        m=self.m if m is None else m
        n=self.n if n is None else n
        return strict_validate(m,n,git_blob(m) if reanchor else TRUSTED_MATRIX_BLOB,
                               git_blob(n) if reanchor else TRUSTED_MANIFEST_BLOB)

    def test_baseline(self):
        self.assertEqual(self.check(),[])

    def test_duplicate_case_key(self):
        m=self.m.replace(b'"id":"ID01",',b'"id":"ID01","id":"ID01",',1)
        self.assertIn('INVALID_JSON:ValueError',self.check(m=m,reanchor=True))

    def test_duplicate_manifest_entry(self):
        n=self.n.replace(b'"ID01":',b'"ID01":"bad","ID01":',1)
        self.assertIn('INVALID_JSON:ValueError',self.check(n=n,reanchor=True))

    def test_extra_case_field(self):
        m=self.m.replace(b'"id":"ID01",',b'"id":"ID01","extra":true,',1)
        self.assertIn('CASE_SCHEMA',self.check(m=m,reanchor=True))

    def test_extra_matrix_field(self):
        m=self.m.replace(b'"schema_version": 1,',b'"extra":true,"schema_version": 1,')
        self.assertIn('MATRIX_SCHEMA',self.check(m=m,reanchor=True))

    def test_extra_manifest_field(self):
        n=self.n.replace(b'"manifest_version": 1,',b'"extra":true,"manifest_version": 1,')
        self.assertIn('MANIFEST_SCHEMA',self.check(n=n,reanchor=True))

    def test_coordinated_rehash_requires_pinned_anchors(self):
        d=json.loads(self.m); f=json.loads(self.n)
        d['cases'][0]['attack']+=' changed'
        f['entries']['ID01']=fingerprint(d['cases'][0])
        m=json.dumps(d).encode()
        f['source_sha256']=hashlib.sha256(m).hexdigest()
        f['source_blob']=git_blob(m)
        n=json.dumps(f).encode()
        self.assertIn('MATRIX_ANCHOR_MISMATCH',self.check(m=m,n=n))
        self.assertIn('MANIFEST_ANCHOR_MISMATCH',self.check(m=m,n=n))
        self.assertEqual(self.check(m=m,n=n,reanchor=True),[])

    def test_unicode_change(self):
        m=self.m.replace(b'"attack":"client','"attack":"café client'.encode(),1)
        self.assertIn('MATRIX_ANCHOR_MISMATCH',self.check(m=m))

    def test_nonfinite(self):
        m=self.m.replace(b'"schema_version": 1',b'"schema_version": NaN')
        self.assertIn('INVALID_JSON:ValueError',self.check(m=m,reanchor=True))

    def test_invalid_utf8(self):
        self.assertIn('INVALID_JSON:UnicodeDecodeError',self.check(m=b'\xff',reanchor=True))

    def test_missing_anchor(self):
        self.assertEqual(strict_validate(self.m,self.n,None,TRUSTED_MANIFEST_BLOB),
                         ['UNAUTHORIZED_ANCHOR'])

    def test_pinned_blobs(self):
        self.assertEqual(git_blob(self.m),TRUSTED_MATRIX_BLOB)
        self.assertEqual(git_blob(self.n),TRUSTED_MANIFEST_BLOB)

if __name__=='__main__':
    unittest.main()
