"""Offline static checks only: never connects to PostgreSQL."""
import json
import pathlib
import unittest

MATRIX = pathlib.Path(__file__).with_name("pg_transaction_scenarios_offline.json")

class Contract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(MATRIX.read_text(encoding="utf-8"))
        cls.scenarios = cls.doc["scenarios"]

    def test_not_executed(self):
        self.assertEqual(self.doc["status"], "SPECIFICATION_NOT_EXECUTED")

    def test_no_commercial(self):
        self.assertIs(self.doc["commercial_quote_enabled"], False)

    def test_four_dimensions(self):
        self.assertEqual(set(self.doc["dimensions"]), {"basket", "address", "routes", "warehouses"})

    def test_isolation(self):
        self.assertEqual(set(self.doc["isolation_levels"]), {"READ COMMITTED", "SERIALIZABLE"})

    def test_eleven_scenarios(self):
        self.assertEqual(len(self.scenarios), 11)

    def test_unique_ids(self):
        ids = [s["id"] for s in self.scenarios]
        self.assertEqual(len(ids), len(set(ids)))

    def test_stale_all_dimensions(self):
        stale = [s for s in self.scenarios if s["expect"] == "REJECT_STALE"]
        self.assertEqual({s["dimension"] for s in stale}, set(self.doc["dimensions"]))

    def test_stale_rollback(self):
        for s in self.scenarios:
            if s["expect"] == "REJECT_STALE":
                self.assertEqual(s["steps"][-1], "T1_ROLLBACK")

    def test_idempotency(self):
        ids = {s["id"] for s in self.scenarios}
        self.assertTrue({"IDEMPOTENT_RETRY", "IDEMPOTENT_CONFLICT", "UNKNOWN_COMMIT"} <= ids)

    def test_rls(self):
        self.assertIn("RLS_CROSS_TENANT", {s["id"] for s in self.scenarios})

    def test_sqlstates(self):
        scenarios = {s["id"]: s for s in self.scenarios}
        self.assertIn("40001", scenarios["SERIALIZATION_RETRY"]["expect"])
        self.assertIn("40P01", scenarios["DEADLOCK_RETRY"]["expect"])

    def test_no_external_connection(self):
        text = MATRIX.read_text(encoding="utf-8").lower()
        for word in ("https://", "http://", "password", "connection_string", "supabase"):
            self.assertNotIn(word, text)

if __name__ == "__main__":
    unittest.main()
