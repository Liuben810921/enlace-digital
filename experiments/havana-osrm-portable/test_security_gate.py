"""Adversarial gate tests on synthetic data only."""
import json
import unittest
from test_synthetic_gate import fixture, case, route, check
from synthetic_gate import evaluate


class SecurityGateTests(unittest.TestCase):
    def test_outside_valid_routes_do_not_approve(self):
        m, c = fixture([case(), case('B', False)])
        r = check(m, c)
        self.assertTrue(r['integrity']['passed'])
        self.assertTrue(r['coverage']['passed'])
        self.assertTrue(r['equivalence']['passed'])
        self.assertEqual(r['coverage']['outside_unverified'], 1)
        self.assertFalse(r['accepted_for_synthetic_review'])

    def test_outside_disagreement_does_not_approve(self):
        m, c = fixture([case(), case('B', False, candidate=route(code='NoRoute'))])
        self.assertFalse(check(m, c)['accepted_for_synthetic_review'])

    def test_all_inside_approved_synthetically_only(self):
        m, c = fixture([case(), case('B')])
        r = check(m, c)
        self.assertTrue(r['accepted_for_synthetic_review'])
        self.assertFalse(r['commercial_approval'])
        self.assertFalse(r['commercial_quote_enabled'])
        self.assertFalse(r['coverage']['geographic_verified'])

    def test_integrity_failure_skips_comparison(self):
        m, c = fixture()
        c['cases'][0]['candidate']['distance_m'] = 99
        r = check(m, c)
        self.assertFalse(r['integrity']['passed'])
        self.assertFalse(r['coverage']['passed'])
        self.assertFalse(r['equivalence']['passed'])

    def test_invalid_corpus_after_valid_hash_rejected(self):
        m, c = fixture([case(candidate=route(snaps=[1]))])
        r = check(m, c)
        self.assertTrue(r['integrity']['passed'])
        self.assertFalse(r['accepted_for_synthetic_review'])
        self.assertFalse(r['coverage']['passed'])

    def test_bad_manifest_type(self):
        r = evaluate(None, b'{}')
        self.assertFalse(r['accepted_for_synthetic_review'])

    def test_deep_json_fails_closed(self):
        r = evaluate(b'[' * 1200 + b']' * 1200, b'{}')
        self.assertFalse(r['accepted_for_synthetic_review'])

    def test_duplicate_json_fails_closed(self):
        r = evaluate(b'{"x":1,"x":2}', b'{}')
        self.assertFalse(r['accepted_for_synthetic_review'])

    def test_untrusted_producer_never_authenticated(self):
        m, c = fixture()
        m['producer'] = 'trusted-official'
        from provenance_gate import digest
        r = check(m, c)
        self.assertTrue(r['accepted_for_synthetic_review'])
        self.assertFalse(r['commercial_approval'])

    def test_bad_snap_fail_closed(self):
        m, c = fixture([case(candidate=route(snaps=[100, 1]))])
        self.assertFalse(check(m, c)['accepted_for_synthetic_review'])

    def test_positive_bias_fail_closed(self):
        m, c = fixture([case(candidate=route(1001))])
        self.assertFalse(check(m, c)['accepted_for_synthetic_review'])

    def test_no_eligible_routes_fail_closed(self):
        m, c = fixture([case(baseline=route(code='NoRoute'))])
        self.assertFalse(check(m, c)['accepted_for_synthetic_review'])


if __name__ == '__main__':
    unittest.main()
