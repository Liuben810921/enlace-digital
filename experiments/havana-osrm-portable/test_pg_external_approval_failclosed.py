"""Offline authorization boundary: synthetically asserted verification never grants approval."""
import copy
import hashlib
import unittest
from test_pg_external_approval_contract import ExternalApprovalContract, approval_gate
from test_pg_security_strict_boundary import MATRIX, MANIFEST, git_blob


def authorization_decision(matrix, manifest, record=None, *, verified_external_record=False):
    """No trusted verifier or approval channel is configured: always deny.

    A caller-supplied boolean is untrusted input, never proof of authorization.
    The legacy approval_gate is only a synthetic contract fixture.
    """
    return ('DENY', 'EXTERNAL_TRUST_VERIFIER_NOT_CONFIGURED')


class FailClosedBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.m = MATRIX.read_bytes()
        cls.n = MANIFEST.read_bytes()
        cls.fixture = ExternalApprovalContract()

    def test_no_record_denied(self):
        self.assertEqual(authorization_decision(self.m, self.n)[0], 'DENY')

    def test_forged_boolean_denied(self):
        self.assertEqual(authorization_decision(self.m, self.n, {}, verified_external_record=True)[0], 'DENY')

    def test_synthetic_positive_is_not_authorization(self):
        r = self.fixture.sample()
        self.assertEqual(approval_gate(self.m, self.n, r, verified_external_record=True), [])
        self.assertEqual(authorization_decision(self.m, self.n, r, verified_external_record=True),
                         ('DENY', 'EXTERNAL_TRUST_VERIFIER_NOT_CONFIGURED'))

    def test_forged_reviewer_denied(self):
        r = self.fixture.sample()
        r['reviewer'] = 'FAKE-AUTHORITY'
        self.assertEqual(authorization_decision(self.m, self.n, r, verified_external_record=True)[0], 'DENY')

    def test_forged_digest_denied(self):
        r = self.fixture.sample()
        r['approval_record_digest'] = hashlib.sha256(b'fake').hexdigest()
        self.assertEqual(authorization_decision(self.m, self.n, r, verified_external_record=True)[0], 'DENY')

    def test_mutated_content_denied(self):
        self.assertEqual(authorization_decision(self.m + b' ', self.n, self.fixture.sample(), verified_external_record=True)[0], 'DENY')

    def test_missing_independent_anchor_denied(self):
        r = self.fixture.sample()
        r['independent_anchor_verified'] = False
        self.assertEqual(authorization_decision(self.m, self.n, r, verified_external_record=True)[0], 'DENY')

    def test_no_signature_denied(self):
        r = self.fixture.sample()
        r['review_reference'] = 'UNSIGNED'
        self.assertEqual(authorization_decision(self.m, self.n, r, verified_external_record=True)[0], 'DENY')

    def test_no_commit_proof_denied(self):
        r = self.fixture.sample()
        r['candidate_commit'] = 'a' * 40
        self.assertEqual(authorization_decision(self.m, self.n, r, verified_external_record=True)[0], 'DENY')

    def test_coordinated_hashes_denied(self):
        r = self.fixture.sample()
        altered = self.m + b'\n'
        r['matrix_blob'] = git_blob(altered)
        r['matrix_sha256'] = hashlib.sha256(altered).hexdigest()
        self.assertEqual(authorization_decision(altered, self.n, r, verified_external_record=True)[0], 'DENY')

    def test_no_untrusted_positive(self):
        for flag in (False, True):
            for record in (None, {}, self.fixture.sample()):
                with self.subTest(flag=flag, record=type(record).__name__):
                    self.assertNotEqual(authorization_decision(self.m, self.n, record, verified_external_record=flag)[0], 'ALLOW')


if __name__ == '__main__':
    unittest.main()
