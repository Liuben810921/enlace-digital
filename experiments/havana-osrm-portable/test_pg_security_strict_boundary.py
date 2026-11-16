"""Independent offline trust-boundary checks; never connects to external systems."""
import copy
import hashlib
import json
import unittest
from pathlib import Path
from test_pg_security_semantic_manifest import fingerprint
from test_pg_security_manifest_adversarial import strict_json

ROOT = Path(__file__).parent
MATRIX = ROOT / 'pg_security_acceptance_matrix.json'
MANIFEST = ROOT / 'pg_security_semantic_manifest.json'
CASE_KEYS = {'id', 'area', 'attack', 'oracle', 'evidence', 'blocker'}
MATRIX_KEYS = {'schema_version', 'status', 'commercial_quote_enabled', 'commercial_approval', 'areas', 'cases'}
MANIFEST_KEYS = {'manifest_version', 'algorithm', 'canonicalization', 'source_blob', 'source_sha256', 'entries'}
# Pinned to the original, independently published Git object; not obtained from candidate manifest.
TRUSTED_MATRIX_BLOB = '1d62376dfd549bb732c31f5cff6f46eb4e89420b'
TRUSTED_MANIFEST_BLOB = '97147fcfa58aac2cb612c2587db4ff39778c9eb0'

def git_blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode('ascii') + b'\0' + data).hexdigest()

def strict_validate(matrix_bytes, manifest_bytes, trusted_matrix_blob=None, trusted_manifest_blob=None):
    if not trusted_matrix_blob or not trusted_manifest_blob:
        return ['UNAUTHORIZED_ANCHOR']
    errors = []
    if git_blob(matrix_bytes) != trusted_matrix_blob: errors.append('MATRIX_ANCHOR_MISMATCH')
    if git_blob(manifest_bytes) != trusted_manifest_blob: errors.append('MANIFEST_ANCHOR_MISMATCH')
    try:
        matrix = strict_json(matrix_bytes.decode('utf-8'))
        manifest = strict_json(manifest_bytes.decode('utf-8'))
    except (ValueError, UnicodeError) as exc:
        return errors + ['INVALID_JSON:' + type(exc).__name__]
    if not isinstance(matrix, dict) or set(matrix) != MATRIX_KEYS: errors.append('MATRIX_SCHEMA')
    if not isinstance(manifest, dict) or set(manifest) != MANIFEST_KEYS: errors.append('MANIFEST_SCHEMA')
    if errors: return errors
    if matrix['schema_version'] != 1 or matrix['status'] != 'OFFLINE_SPECIFICATION_ONLY' or matrix['commercial_quote_enabled'] is not False or matrix['commercial_approval'] is not False: errors.append('MATRIX_POLICY')
    if manifest['manifest_version'] != 1 or manifest['algorithm'] != 'sha256': errors.append('MANIFEST_POLICY')
    if hashlib.sha256(matrix_bytes).hexdigest() != manifest['source_sha256'] or git_blob(matrix_bytes) != manifest['source_blob']: errors.append('SOURCE_INTEGRITY')
    cases = matrix['cases']
    entries = manifest['entries']
    if not isinstance(cases, list) or not isinstance(entries, dict): return errors + ['CASE_TYPES']
    ids = []
    for case in cases:
        if not isinstance(case, dict) or set(case) != CASE_KEYS or any(not isinstance(v, str) or not v.strip() for v in case.values()):
            errors.append('CASE_SCHEMA'); continue
        ids.append(case['id'])
        if fingerprint(case) != entries.get(case['id']): errors.append('SEMANTIC_HASH')
    if len(ids) != 28 or len(set(ids)) != 28 or set(ids) != set(entries): errors.append('CASE_IDS')
    return errors

class StrictBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = MATRIX.read_bytes(); cls.n = MANIFEST.read_bytes()

    def check(self, m=None, n=None, a=TRUSTED_MATRIX_BLOB, b=TRUSTED_MANIFEST_BLOB):
        return strict_validate(self.m if m is None else m, self.n if n is None else n, a, b)

    def test_baseline(self): self.assertEqual(self.check(), [])
    def test_missing_anchor(self): self.assertIn('UNAUTHORIZED_ANCHOR', self.check(a=None))
    def test_wrong_anchor(self): self.assertIn('MATRIX_ANCHOR_MISMATCH', self.check(a='0'*40))
    def test_duplicate_matrix_key(self): self.assertTrue(self.check(m=self.m.replace(b'"schema_version": 1,', b'"schema_version": 1,"schema_version": 1,')))
    def test_duplicate_manifest_key(self): self.assertTrue(self.check(n=self.n.replace(b'"algorithm": "sha256",', b'"algorithm": "sha256","algorithm": "sha256",')))
    def test_extra_matrix_field(self): self.assertIn('MATRIX_ANCHOR_MISMATCH', self.check(m=self.m.replace(b'"schema_version": 1,', b'"extra": 1,"schema_version": 1,')))
    def test_extra_manifest_field(self): self.assertIn('MANIFEST_ANCHOR_MISMATCH', self.check(n=self.n.replace(b'"manifest_version": 1,', b'"extra": 1,"manifest_version": 1,')))
    def test_coordinated_rehash(self):
        m = json.loads(self.m); n = json.loads(self.n)
        m['cases'][0]['attack'] += ' coordinated'
        n['entries']['ID01'] = fingerprint(m['cases'][0])
        n['source_sha256'] = hashlib.sha256(json.dumps(m).encode()).hexdigest()
        self.assertIn('MATRIX_ANCHOR_MISMATCH', self.check(m=json.dumps(m).encode(), n=json.dumps(n).encode()))
    def test_invalid_utf8(self): self.assertTrue(self.check(m=b'\xff'))
    def test_nonfinite(self): self.assertTrue(self.check(m=self.m.replace(b'"schema_version": 1', b'"schema_version": NaN')))
    def test_unicode_changed(self): self.assertIn('MATRIX_ANCHOR_MISMATCH', self.check(m=self.m.replace(b'"attack":"client', '"attack":"café client'.encode(), 1)))
    def test_no_approval_claim(self): self.assertNotIn('approval', json.loads(self.n))

if __name__ == '__main__': unittest.main()
