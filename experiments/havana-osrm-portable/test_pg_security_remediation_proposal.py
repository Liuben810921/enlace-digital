"""Adversarial offline contract inspection; never executes SQL or connects to DB."""
from pathlib import Path
import unittest

SOURCE = Path(__file__).with_name('pg_security_remediation_proposal.sql')

class SecurityProposalStatic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.text = SOURCE.read_text(encoding='utf-8')

    def test_comment_only(self):
        self.assertTrue(all(not x.strip() or x.lstrip().startswith('--') for x in self.text.splitlines()))

    def test_identity_trusted(self):
        self.assertIn('verified auth', self.text)

    def test_forged_guc_rejected(self):
        self.assertIn('SET ed.tenant_id', self.text)

    def test_rls_force(self):
        self.assertIn('FORCE ROW LEVEL SECURITY', self.text)

    def test_rls_checks(self):
        self.assertIn('USING and WITH CHECK', self.text)

    def test_nonbypass_owner(self):
        self.assertIn('owner NOLOGIN NOBYPASSRLS', self.text)

    def test_nonbypass_app(self):
        self.assertIn('app NOBYPASSRLS', self.text)

    def test_public_dml_rejected(self):
        self.assertIn('PUBLIC DML', self.text)

    def test_rpc_allowlist(self):
        self.assertIn('allowlisted RPC', self.text)

    def test_four_versions(self):
        self.assertIn('basket_v,address_v,routes_v,warehouses_v', self.text)

    def test_cas_returning(self):
        self.assertIn('RETURNING routes_v', self.text)

    def test_cas_rollback(self):
        self.assertIn('otherwise ROLLBACK', self.text)

    def test_all_writers_coordinate(self):
        self.assertIn('every dimension writer', self.text)

    def test_idempotency_unique(self):
        self.assertIn('UNIQUE(tenant_id,operation_id)', self.text)

    def test_hash_conflict(self):
        self.assertIn('different hash reject', self.text)

    def test_idempotency_lock(self):
        self.assertIn('SELECT ... FOR UPDATE', self.text)

    def test_rejected_quote_semantics(self):
        self.assertIn('nullable quote_id or separate rejection record', self.text)

    def test_unknown_commit(self):
        self.assertIn('unknown COMMIT resolved by lookup', self.text)

    def test_retry_sqlstates(self):
        self.assertIn('40001/40P01 rollback+retry', self.text)

    def test_definer_search_path(self):
        self.assertIn('fixed search_path', self.text)

    def test_no_dynamic_sql(self):
        self.assertIn('no dynamic SQL', self.text)

    def test_cross_tenant_denial(self):
        self.assertIn('deny cross-tenant', self.text)

    def test_no_commercial_approval(self):
        self.assertIn('commercial_approval=false', self.text)

    def test_no_external_endpoints(self):
        self.assertNotIn('https://', self.text)
        self.assertNotIn('postgres://', self.text)

if __name__ == '__main__':
    unittest.main()
