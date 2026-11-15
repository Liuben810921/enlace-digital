import unittest,json
from compare_graphs import validate
def route(distance=1000,snap=1,code='Ok'):
    return {'code':code,'distance_m':distance if code=='Ok' else None,'snap_m':snap}
def case(a=None,b=None,**kw):
    return dict(id='a',in_coverage=True,baseline=a or route(),candidate=b or route(),**kw)
def check(c,limit=30):return validate(json.dumps({'snap_limit_m':limit,'cases':[c]}).encode())
class Tests(unittest.TestCase):
    def test_equal(self):self.assertTrue(check(case())['accepted'])
    def test_connectivity(self):self.assertIn(['a','connectivity_loss'],check(case(b=route(code='NoRoute')))['errors'])
    def test_no_segment(self):self.assertFalse(check(case(b=route(code='NoSegment')))['accepted'])
    def test_timeout(self):self.assertFalse(check(case(b=route(code='Timeout')))['accepted'])
    def test_snap(self):self.assertFalse(check(case(b=route(snap=31)))['accepted'])
    def test_baseline_snap(self):self.assertFalse(check(case(a=route(snap=31)))['accepted'])
    def test_absolute(self):self.assertFalse(check(case(a=route(10000),b=route(10101)))['accepted'])
    def test_relative(self):self.assertFalse(check(case(a=route(1000),b=route(1021)))['accepted'])
    def test_threshold(self):self.assertTrue(check(case(a=route(5000),b=route(4900)))['accepted'])
    def test_zero(self):self.assertFalse(check(case(a=route(0),b=route(1)))['accepted'])
    def test_zero_equal(self):self.assertTrue(check(case(a=route(0),b=route(0)))['accepted'])
    def test_no_eligible(self):self.assertFalse(check(case(a=route(code='NoRoute')))['accepted'])
    def test_outside(self):
        c=case();c['in_coverage']=False;self.assertFalse(check(c)['accepted'])
    def test_increase(self):self.assertFalse(check(case(a=route(1000),b=route(1010)))['accepted'])
    def test_decrease(self):self.assertTrue(check(case(a=route(1000),b=route(990)))['accepted'])
    def test_duplicate_case(self):
        c=case();with_data={'snap_limit_m':30,'cases':[c,c]}
        with self.assertRaises(ValueError):validate(json.dumps(with_data).encode())
    def test_duplicate_json(self):
        with self.assertRaises(ValueError):validate(b'{"cases":[],"cases":[],"snap_limit_m":3}')
    def test_nan(self):
        with self.assertRaises(ValueError):validate(b'{"cases":[],"snap_limit_m":NaN}')
    def test_bool_number(self):
        with self.assertRaises(ValueError):check(case(b=route(distance=True)))
    def test_negative(self):
        with self.assertRaises(ValueError):check(case(b=route(distance=-1)))
    def test_extra(self):
        c=case();c['extra']=1
        with self.assertRaises(ValueError):check(c)
    def test_missing(self):
        c=case();del c['candidate']
        with self.assertRaises(ValueError):check(c)
    def test_invalid_code(self):
        with self.assertRaises(ValueError):check(case(b=route(code='Oops')))
    def test_non_ok_distance(self):
        r=route(code='NoRoute');r['distance_m']=2
        with self.assertRaises(ValueError):check(case(b=r))
    def test_nonfinite(self):
        with self.assertRaises(ValueError):check(case(b=route(distance=float('inf'))))
    def test_empty(self):
        with self.assertRaises(ValueError):validate(b'{"cases":[],"snap_limit_m":1}')
    def test_large(self):
        with self.assertRaises(ValueError):validate(b' '*4000001)
if __name__=='__main__':unittest.main()
