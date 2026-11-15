"""Offline static contract checks only; never connects to PostgreSQL."""
import json
from pathlib import Path
import unittest

FILE = Path(__file__).with_name("pg_security_negative_cases.json")
EXPECTED = {
    "RLS_FORGED_GUC": "DENY_UNTRUSTED_IDENTITY",
    "RLS_MISSING_IDENTITY": "DENY_DEFAULT",
    "RLS_INVALID_UUID": "REJECT_INVALID_CONTEXT",
    "RLS_CROSS_TENANT_READ": "DENY_CROSS_TENANT",
    "RLS_CROSS_TENANT_WRITE": "DENY_CROSS_TENANT",
    "ROLE_NOT_PROVISIONED": "BLOCK_DEPLOYMENT",
    "ROLE_BYPASSRLS": "BLOCK_DEPLOYMENT",
    "ROLE_PUBLIC_TABLE_GRANT": "BLOCK_DEPLOYMENT",
    "ROLE_DEFINER_SEARCH_PATH": "BLOCK_DEPLOYMENT",
    "CAS_BASKET_STALE": "REJECT_STALE",
    "CAS_ADDRESS_STALE": "REJECT_STALE",
    "CAS_ROUTES_STALE": "REJECT_STALE",
    "CAS_WAREHOUSES_STALE": "REJECT_STALE",
    "CAS_DUAL_WRITER": "ONE_WRITER_ONLY",
    "CAS_VERSION_OVERFLOW": "REJECT_OVERFLOW",
    "IDEM_SAME_KEY_SAME_PAYLOAD": "REPLAY_SAME_RESULT",
    "IDEM_SAME_KEY_DIFFERENT_PAYLOAD": "REJECT_CONFLICT",
    "IDEM_REJECTED_NO_QUOTE": "BLOCK_SCHEMA_REVIEW",
    "IDEM_UNKNOWN_COMMIT": "RECONCILE_BEFORE_RETRY",
    "IDEM_40001": "ROLLBACK_RETRY_BOUNDED",
    "IDEM_40P01": "ROLLBACK_RETRY_BOUNDED",
    "IDEM_KEY_EXPIRY": "BLOCK_UNDEFINED_REUSE",
}

class SecurityNegativeStatic(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(FILE.read_text(encoding="utf-8"))
        cls.cases = cls.doc["cases"]
        cls.by_id = {c["id"]: c for c in cls.cases}

    def test_offline_only(self):
        self.assertEqual(self.doc["status"], "OFFLINE_ONLY_NOT_EXECUTED_IN_POSTGRESQL")

    def test_commercial_disabled(self):
        self.assertIs(self.doc["commercial_quote_enabled"], False)

    def test_exact_ids(self):
        self.assertEqual(set(self.by_id), set(EXPECTED))
        self.assertEqual(len(self.cases), len(EXPECTED))

    def test_all_fields(self):
        for case in self.cases:
            self.assertEqual(set(case), {"id", "area", "attack", "expected", "required"})
            self.assertTrue(all(type(v) is str and v.strip() for v in case.values()))

    def test_areas(self):
        self.assertEqual({c["area"] for c in self.cases}, {"identity", "roles", "cas", "idempotency"})

def make_test(case_id, expected):
    def test(self):
        self.assertEqual(self.by_id[case_id]["expected"], expected)
    return test

for _id, _expected in EXPECTED.items():
    setattr(SecurityNegativeStatic, "test_case_" + _id.lower(), make_test(_id, _expected))

if __name__ == "__main__":
    unittest.main()
