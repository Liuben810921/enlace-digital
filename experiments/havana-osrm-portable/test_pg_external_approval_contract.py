"""Offline, fail-closed approval contract; no approval is bundled or inferred."""
import re
import unittest
from test_pg_security_strict_boundary import strict_validate, MATRIX, MANIFEST, git_blob

HEX40 = re.compile(r'[0-9a-f]{40}\Z')
HEX64 = re.compile(r'[0-9a-f]{64}\Z')
FIELDS = {'decision', 'reviewer', 'review_reference', 'candidate_commit', 'matrix_blob', 'manifest_blob', 'matrix_sha256', 'manifest_sha256', 'approval_record_digest', 'independent_anchor_verified'}

def approval_gate(matrix, manifest, record=None, *, verified_external_record=False):
    if not isinstance(record, dict) or set(record) != FIELDS:
        return ['NO_VALID_APPROVAL_RECORD']
    if record['decision'] != 'APPROVED' or record['independent_anchor_verified'] is not True or verified_external_record is not True:
        return ['UNVERIFIED_APPROVAL']
    for field in ('reviewer', 'review_reference'):
        if not isinstance(record[field], str) or not record[field].strip():
            return ['MISSING_REVIEW_PROVENANCE']
    for field, pattern in [('candidate_commit', HEX40), ('matrix_blob', HEX40), ('manifest_blob', HEX40), ('matrix_sha256', HEX64), ('manifest_sha256', HEX64), ('approval_record_digest', HEX64)]:
        if not isinstance(record[field], str) or not pattern.fullmatch(record[field]):
            return ['INVALID_REFERENCE']
    import hashlib
    if record['matrix_sha256'] != hashlib.sha256(matrix).hexdigest() or record['manifest_sha256'] != hashlib.sha256(manifest).hexdigest():
        return ['CONTENT_MISMATCH']
    return strict_validate(matrix, manifest, record['matrix_blob'], record['manifest_blob'])

class ExternalApprovalContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = MATRIX.read_bytes(); cls.n = MANIFEST.read_bytes()

    def sample(self):
        import hashlib
        return dict(decision='APPROVED', reviewer='SYNTHETIC-NOT-REAL', review_reference='SYNTHETIC-NOT-REAL', candidate_commit='a'*40, matrix_blob=git_blob(self.m), manifest_blob=git_blob(self.n), matrix_sha256=hashlib.sha256(self.m).hexdigest(), manifest_sha256=hashlib.sha256(self.n).hexdigest(), approval_record_digest='b'*64, independent_anchor_verified=True)

    def test_default_denied(self): self.assertEqual(approval_gate(self.m,self.n), ['NO_VALID_APPROVAL_RECORD'])
    def test_empty_denied(self): self.assertTrue(approval_gate(self.m,self.n,{}))
    def test_no_external_verification(self): self.assertEqual(approval_gate(self.m,self.n,self.sample()), ['UNVERIFIED_APPROVAL'])
    def test_missing_provenance(self):
        r=self.sample();r['reviewer']=''
        self.assertEqual(approval_gate(self.m,self.n,r,verified_external_record=True),['MISSING_REVIEW_PROVENANCE'])
    def test_rejected_decision(self):
        r=self.sample();r['decision']='REJECTED'
        self.assertEqual(approval_gate(self.m,self.n,r,verified_external_record=True),['UNVERIFIED_APPROVAL'])
    def test_unverified_anchor(self):
        r=self.sample();r['independent_anchor_verified']=False
        self.assertEqual(approval_gate(self.m,self.n,r,verified_external_record=True),['UNVERIFIED_APPROVAL'])
    def test_wrong_content(self):
        self.assertEqual(approval_gate(self.m+b' ',self.n,self.sample(),verified_external_record=True),['CONTENT_MISMATCH'])
    def test_bad_digest(self):
        r=self.sample();r['approval_record_digest']='invalid'
        self.assertEqual(approval_gate(self.m,self.n,r,verified_external_record=True),['INVALID_REFERENCE'])
    def test_extra_field(self):
        r=self.sample();r['bypass']=True
        self.assertEqual(approval_gate(self.m,self.n,r,verified_external_record=True),['NO_VALID_APPROVAL_RECORD'])
    def test_synthetic_positive_is_not_actual_approval(self):
        # Positive unit fixture checks contract plumbing, not provenance or authorization.
        self.assertEqual(approval_gate(self.m,self.n,self.sample(),verified_external_record=True),[])

if __name__=='__main__': unittest.main()
