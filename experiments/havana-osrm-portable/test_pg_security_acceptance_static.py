"""Offline-only matrix checks; not a database or SQL security test."""
import json
from collections import Counter
from pathlib import Path
import unittest

PATH = Path(__file__).with_name("pg_security_acceptance_matrix.json")
AREAS = {"identity_rls": 5, "roles": 5, "cas": 7, "idempotency": 6, "rpc": 5}
PREFIX = {"identity_rls": "ID", "roles": "RO", "cas": "CA", "idempotency": "IP", "rpc": "RP"}
ORACLES = {"DENY", "BLOCK_DEPLOYMENT", "REJECT_STALE", "ONE_COMMIT", "REJECT_OVERFLOW", "SINGLE_RESULT", "REJECT_CONFLICT", "RECONCILE", "ROLLBACK_RETRY"}

class AcceptanceStatic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(PATH.read_text(encoding="utf-8"))
        cls.cases = cls.doc["cases"]

    def test_offline_marker(self):
        self.assertEqual(self.doc["status"], "OFFLINE_SPECIFICATION_ONLY")

    def test_commercial_fail_closed(self):
        self.assertIs(self.doc["commercial_quote_enabled"], False)
        self.assertIs(self.doc["commercial_approval"], False)

    def test_schema_version(self):
        self.assertEqual(self.doc["schema_version"], 1)

    def test_areas_exact(self):
        self.assertEqual(set(self.doc["areas"]), set(AREAS))

    def test_case_count(self):
        self.assertEqual(len(self.cases), 28)

    def test_unique_ids(self):
        self.assertEqual(len({c["id"] for c in self.cases}), len(self.cases))

    def test_area_counts(self):
        self.assertEqual(dict(Counter(c["area"] for c in self.cases)), AREAS)

    def test_all_fields(self):
        for case in self.cases:
            self.assertEqual(set(case), {"id", "area", "attack", "oracle", "evidence", "blocker"})
            self.assertTrue(all(type(v) is str and v.strip() for v in case.values()))

    def test_id_prefixes(self):
        for c in self.cases:
            self.assertTrue(c["id"].startswith(PREFIX[c["area"]]))

    def test_oracle_allowlist(self):
        self.assertTrue(all(c["oracle"] in ORACLES for c in self.cases))

    def test_all_stale_dimensions(self):
        stale = [c for c in self.cases if c["oracle"] == "REJECT_STALE"]
        self.assertEqual(len(stale), 4)
        for name in ("basket", "address", "routes", "warehouses"):
            self.assertTrue(any(name in c["attack"] for c in stale))

    def test_no_network_or_credentials(self):
        s = PATH.read_text(encoding="utf-8").lower()
        for forbidden in ("https://", "postgres://", "password", "supabase", "service_role"):
            self.assertNotIn(forbidden, s)

    def test_no_approval_oracle(self):
        self.assertFalse(any("APPROVE" in c["oracle"] for c in self.cases))

    def test_two_connection_oracle(self):
        self.assertTrue(any("two-connection" in c["evidence"] for c in self.cases))

    def test_rls_identity_adversaries(self):
        identity = [c for c in self.cases if c["area"] == "identity_rls"]
        self.assertTrue(any("GUC" in c["attack"] or "ed.tenant_id" in c["attack"] for c in identity))
        self.assertTrue(any("connection" in c["attack"] for c in identity))

    def test_idempotency_unknown_commit(self):
        self.assertTrue(any(c["oracle"] == "RECONCILE" for c in self.cases))

    def test_sqlstate_coverage(self):
        self.assertTrue(any("40001" in c["attack"] and "40P01" in c["attack"] for c in self.cases))

    def test_rpc_fail_open(self):
        self.assertTrue(any(c["area"] == "rpc" and "commercial" in c["attack"] for c in self.cases))

if __name__ == "__main__":
    unittest.main()
