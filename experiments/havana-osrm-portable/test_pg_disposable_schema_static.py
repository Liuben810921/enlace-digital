"""Static inspection of a review-only SQL draft. No PostgreSQL calls."""
from pathlib import Path
import re
import unittest

SQL = Path(__file__).with_name("pg_disposable_schema_spec.sql")

class SqlDraftContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SQL.read_text(encoding="utf-8")
        cls.active = "\n".join(line for line in cls.source.splitlines()
                               if not line.lstrip().startswith("--"))
    def test_explicit_rollback(self):
        self.assertRegex(self.active, r"(?m)^ROLLBACK;\s*$")
    def test_no_commit(self):
        self.assertNotRegex(self.active, r"(?m)^COMMIT;")
    def test_three_tables(self):
        self.assertEqual(len(re.findall(r"CREATE TABLE ed_pg_synthetic\.", self.active)), 3)
    def test_rls_enabled(self):
        self.assertEqual(self.active.count("ENABLE ROW LEVEL SECURITY"), 3)
    def test_rls_forced(self):
        self.assertEqual(self.active.count("FORCE ROW LEVEL SECURITY"), 3)
    def test_three_policies(self):
        self.assertEqual(self.active.count("CREATE POLICY "), 3)
    def test_with_check(self):
        self.assertEqual(self.active.count("WITH CHECK (tenant_id"), 3)
    def test_no_commercial_flags(self):
        self.assertIn("CHECK (commercial_quote_enabled=false)", self.active)
        self.assertIn("CHECK (commercial_approval=false)", self.active)
    def test_idempotency_unique(self):
        self.assertIn("PRIMARY KEY (tenant_id,operation_id)", self.active)
    def test_four_versions(self):
        for key in ("basket_v", "address_v", "routes_v", "warehouses_v"):
            self.assertIn(key, self.active)
    def test_no_direct_table_grant(self):
        self.assertNotRegex(self.active, r"GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE|ALL)\s+ON\s+(?:ALL\s+)?TABLE")
    def test_no_definer_function(self):
        self.assertNotIn("SECURITY DEFINER", self.active)
    def test_no_external_connectors(self):
        for term in ("http://", "https://", "dblink", "postgres_fdw", "COPY PROGRAM"):
            self.assertNotIn(term, self.active)
    def test_schema_is_synthetic(self):
        self.assertIn("CREATE SCHEMA ed_pg_synthetic", self.active)
    def test_no_bypassrls(self):
        self.assertNotRegex(self.active, r"(?<!NO)BYPASSRLS\b")

if __name__ == "__main__":
    unittest.main()
