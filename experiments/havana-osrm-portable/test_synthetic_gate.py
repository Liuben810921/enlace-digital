import json
import unittest
from provenance_gate import digest
from synthetic_gate import evaluate


def route(distance=1000, code='Ok', snaps=None):
    return {'code': code, 'distance_m': distance if code == 'Ok' else None,
            'snaps_m': [1, 1] if snaps is None else snaps}


def case(ident='A', inside=True, baseline=None, candidate=None):
    return {'id': ident, 'in_coverage': inside,
            'baseline': baseline if baseline is not None else route(),
            'candidate': candidate if candidate is not None else route()}


def fixture(cases=None):
    corpus = {'cases': [case()] if cases is None else cases, 'snap_limit_m': 30}
    ids = [x['id'] for x in corpus['cases']]
    inside = sum(x['in_coverage'] for x in corpus['cases'])
    manifest = {'schema': 'synthetic-osrm-comparison-v1', 'producer': 'synthetic',
                'corpus_sha256': digest(corpus), 'case_ids_sha256': digest(ids),
                'case_count': len(ids), 'coverage': {'declared_inside': inside,
                'declared_outside': len(ids)-inside, 'method': 'synthetic-declaration',
                'geometry_verified': False}}
    return manifest, corpus


def check(manifest, corpus):
    return evaluate(json.dumps(manifest).encode(), json.dumps(corpus).encode())


class GateTests(unittest.TestCase):
    def test_valid(self):
        m,c=fixture(); x=check(m,c)
        self.assertTrue(x['accepted_for_synthetic_review'])
        self.assertTrue(x['integrity']['passed'])
    def test_never_commercial(self):
        m,c=fixture(); x=check(m,c)
        self.assertFalse(x['commercial_quote_enabled'])
        self.assertFalse(x['commercial_approval'])
    def test_never_geo(self):
        m,c=fixture(); self.assertFalse(check(m,c)['coverage']['geographic_verified'])
    def test_integrity_tamper(self):
        m,c=fixture(); c['cases'][0]['candidate']['distance_m']=2
        x=check(m,c); self.assertFalse(x['integrity']['passed']); self.assertFalse(x['accepted_for_synthetic_review'])
    def test_bad_manifest(self):
        m,c=fixture(); m['case_count']=4; self.assertFalse(check(m,c)['integrity']['passed'])
    def test_bad_json(self):
        x=evaluate(b'{', b'{}'); self.assertFalse(x['accepted_for_synthetic_review'])
    def test_coverage_failure(self):
        m,c=fixture([case(candidate=route(code='NoRoute'))]); x=check(m,c)
        self.assertTrue(x['integrity']['passed']); self.assertFalse(x['coverage']['passed'])
        self.assertFalse(x['accepted_for_synthetic_review'])
    def test_equivalence_failure(self):
        m,c=fixture([case(candidate=route(970))]); x=check(m,c)
        self.assertTrue(x['coverage']['passed']); self.assertFalse(x['equivalence']['passed'])
    def test_snap_failure(self):
        m,c=fixture([case(candidate=route(snaps=[1,31]))]); x=check(m,c)
        self.assertFalse(x['coverage']['passed'])
    def test_outside_reported(self):
        m,c=fixture([case(),case('B',False,candidate=route(code='NoRoute'))]); x=check(m,c)
        self.assertEqual(x['coverage']['outside_unverified'],1)
    def test_outside_only_rejected(self):
        m,c=fixture([case(inside=False)]); self.assertFalse(check(m,c)['accepted_for_synthetic_review'])
    def test_schema_failure_after_hash(self):
        m,c=fixture(); c['cases'][0]['candidate']['snaps_m']=[1]
        m,c=fixture(c['cases']); x=check(m,c)
        self.assertTrue(x['integrity']['passed']); self.assertFalse(x['accepted_for_synthetic_review'])
    def test_overflow_after_hash(self):
        m,c=fixture([case('A',candidate=route(1e308),baseline=route(0)),case('B',candidate=route(1e308),baseline=route(0))])
        x=check(m,c); self.assertFalse(x['accepted_for_synthetic_review'])
    def test_bias(self):
        m,c=fixture([case(candidate=route(1001))]); self.assertFalse(check(m,c)['equivalence']['passed'])
    def test_invalid_bytes(self):
        x=evaluate(b'\xff', b'{}'); self.assertFalse(x['accepted_for_synthetic_review'])
    def test_duplicate_manifest_key(self):
        x=evaluate(b'{"a":1,"a":2}',b'{}'); self.assertFalse(x['integrity']['passed'])


if __name__=='__main__': unittest.main()
