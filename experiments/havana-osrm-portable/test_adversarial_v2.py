import unittest, json, math
from compare_graphs_v2 import validate

def r(d=1000, code='Ok', snaps=(0,0)):
    return dict(code=code,distance_m=d if code=='Ok' else None,snaps_m=list(snaps))
def c(i='a',inside=True,a=None,b=None):
    return dict(id=i,in_coverage=inside,baseline=a or r(),candidate=b or r())
def check(cases):
    return validate(json.dumps(dict(cases=cases,snap_limit_m=30)).encode())
class Adversarial(unittest.TestCase):
    def test_overflow_sum(self):
        with self.assertRaisesRegex(ValueError,'numeric overflow'):
            check([c(str(i),a=r(0),b=r(1e308)) for i in range(2)])
    def test_outside_disagreement_is_visible(self):
        z=check([c(),c('outside',False,b=r(code='NoRoute'))])
        self.assertTrue(z['accepted'])
        self.assertEqual(z['coverage_audit']['outside_unverified'],1)
        self.assertEqual(z['coverage_audit']['outside_status_disagreements'],1)
    def test_outside_same_status(self):
        z=check([c(),c('outside',False)])
        self.assertEqual(z['coverage_audit']['outside_status_disagreements'],0)
    def test_overflow_difference(self):
        with self.assertRaisesRegex(ValueError,'numeric overflow'):
            check([c(a=r(1e-308),b=r(1e308)),c('b',a=r(1e-308),b=r(1e308))])
    def test_snapping_both_ends(self):
        z=check([c(b=r(snaps=(31,32)))])
        self.assertIn(['a','candidate_snap_origin'],z['coverage_audit']['errors'])
        self.assertIn(['a','candidate_snap_destination'],z['coverage_audit']['errors'])
    def test_mixed_bias(self):
        z=check([c('a',b=r(1004)),c('b',b=r(999))])
        self.assertIn(['global','positive_net_distance_bias'],z['route_equivalence']['errors'])
    def test_outside_only_rejected(self):
        self.assertFalse(check([c(inside=False)])['accepted'])
    def test_limit_finite(self):
        with self.assertRaises(ValueError): validate(b'{"cases":[],"snap_limit_m":Infinity}')
if __name__=='__main__': unittest.main()
