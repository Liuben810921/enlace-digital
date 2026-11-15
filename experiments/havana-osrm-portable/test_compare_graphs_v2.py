import unittest,json
from compare_graphs_v2 import validate
def route(d=1000,s=None,code='Ok'):
 return {'code':code,'distance_m':d if code=='Ok' else None,'snaps_m':[1,1] if s is None else s}
def case(i='a',a=None,b=None,inside=True):
 return {'id':i,'in_coverage':inside,'baseline':route() if a is None else a,'candidate':route() if b is None else b}
def run(cs,limit=30): return validate(json.dumps({'cases':cs,'snap_limit_m':limit}).encode())
class Tests(unittest.TestCase):
 def test_equal(self): self.assertTrue(run([case()])['accepted'])
 def test_decrease(self): self.assertTrue(run([case(b=route(990))])['accepted'])
 def test_increase(self): self.assertFalse(run([case(b=route(1001))])['accepted'])
 def test_mixed_bias(self):
  r=run([case(str(i),b=route(1001)) for i in range(5)]+[case('last',b=route(999))])
  self.assertIn(['global','positive_net_distance_bias'],r['route_equivalence']['errors'])
 def test_mixed_no_bias(self): self.assertTrue(run([case('a',b=route(1001)),case('b',b=route(995))])['accepted'])
 def test_balanced(self): self.assertTrue(run([case('a',b=route(1001)),case('b',b=route(999))])['accepted'])
 def test_candidate_origin(self): self.assertIn(['a','candidate_snap_origin'],run([case(b=route(s=[31,1]))])['coverage_audit']['errors'])
 def test_candidate_destination(self): self.assertIn(['a','candidate_snap_destination'],run([case(b=route(s=[1,31]))])['coverage_audit']['errors'])
 def test_baseline_origin(self): self.assertIn(['a','baseline_snap_origin'],run([case(a=route(s=[31,1]))])['coverage_audit']['errors'])
 def test_baseline_destination(self): self.assertIn(['a','baseline_snap_destination'],run([case(a=route(s=[1,31]))])['coverage_audit']['errors'])
 def test_snap_boundary(self): self.assertTrue(run([case(b=route(s=[30,30]))])['accepted'])
 def test_no_route(self): self.assertFalse(run([case(b=route(code='NoRoute'))])['accepted'])
 def test_no_segment(self): self.assertFalse(run([case(b=route(code='NoSegment'))])['accepted'])
 def test_timeout(self): self.assertFalse(run([case(b=route(code='Timeout'))])['accepted'])
 def test_baseline_failure_hidden(self): self.assertIn(['bad','baseline_unavailable'],run([case(),case('bad',a=route(code='NoRoute'))])['coverage_audit']['errors'])
 def test_outside(self): self.assertTrue(run([case(),case('b',inside=False,b=route(code='NoRoute'))])['accepted'])
 def test_no_eligible(self): self.assertFalse(run([case(a=route(code='NoRoute'))])['accepted'])
 def test_no_comparable(self): self.assertIn(['global','no_comparable_routes'],run([case(b=route(code='NoRoute'))])['route_equivalence']['errors'])
 def test_absolute(self): self.assertFalse(run([case(a=route(10000),b=route(9899))])['accepted'])
 def test_relative(self): self.assertFalse(run([case(b=route(979))])['accepted'])
 def test_threshold(self): self.assertTrue(run([case(a=route(5000),b=route(4900))])['accepted'])
 def test_zero(self): self.assertTrue(run([case(a=route(0),b=route(0))])['accepted'])
 def test_zero_mismatch(self): self.assertFalse(run([case(a=route(0),b=route(1))])['accepted'])
 def test_duplicate_case(self):
  with self.assertRaises(ValueError): run([case(),case()])
 def test_duplicate_key(self):
  with self.assertRaises(ValueError): validate(b'{"cases":[],"cases":[],"snap_limit_m":30}')
 def test_nan(self):
  with self.assertRaises(ValueError): validate(b'{"cases":[],"snap_limit_m":NaN}')
 def test_bool(self):
  with self.assertRaises(ValueError): run([case(b=route(True))])
 def test_negative(self):
  with self.assertRaises(ValueError): run([case(b=route(-1))])
 def test_infinite(self):
  with self.assertRaises(ValueError): run([case(b=route(float('inf')))])
 def test_snap_length(self):
  with self.assertRaises(ValueError): run([case(b=route(s=[1]))])
 def test_snap_bool(self):
  with self.assertRaises(ValueError): run([case(b=route(s=[True,1]))])
 def test_snap_negative(self):
  with self.assertRaises(ValueError): run([case(b=route(s=[-1,1]))])
 def test_snap_nan(self):
  with self.assertRaises(ValueError): run([case(b=route(s=[float('nan'),1]))])
 def test_extra(self):
  c=case();c['extra']=1
  with self.assertRaises(ValueError): run([c])
 def test_missing(self):
  c=case();del c['candidate']
  with self.assertRaises(ValueError): run([c])
 def test_invalid_code(self):
  with self.assertRaises(ValueError): run([case(b=route(code='Oops'))])
 def test_nonok_distance(self):
  b=route(code='NoRoute');b['distance_m']=1
  with self.assertRaises(ValueError): run([case(b=b)])
 def test_empty(self):
  with self.assertRaises(ValueError): run([])
 def test_oversize(self):
  with self.assertRaises(ValueError): validate(b' '*4000001)
 def test_bad_limit(self):
  with self.assertRaises(ValueError): run([case()],True)
 def test_bad_coverage(self):
  c=case();c['in_coverage']=1
  with self.assertRaises(ValueError): run([c])
 def test_status_counts(self): self.assertEqual(run([case(),case('b',a=route(code='NoRoute'))])['coverage_audit']['baseline_status']['NoRoute'],1)
 def test_separation(self):
  r=run([case('a',b=route(s=[40,1])),case('b',b=route(970))])
  self.assertFalse(r['coverage_audit']['passed']);self.assertFalse(r['route_equivalence']['passed'])
if __name__=='__main__': unittest.main()
