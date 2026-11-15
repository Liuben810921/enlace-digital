import unittest
from warehouse_assignment_v2 import allocate,State
V=dict(basket=0,address=0,routes=0,warehouses=0)
def run(b=None,s=None,r=None,v=None,expected=None):
    return allocate({'P':2} if b is None else b,{'A':{'P':1},'B':{'P':1}} if s is None else s,{'A':'2','B':'5'} if r is None else r,V if v is None else v,expected)
class Allocation(unittest.TestCase):
    def test_split(self):self.assertEqual(run()['allocation'],{'A':{'P':1},'B':{'P':1}})
    def test_farthest(self):self.assertEqual(run()['fee_cup'],'1000.00')
    def test_minimum(self):self.assertEqual(run(s={'A':{'P':2}},r={'A':'1'})['fee_cup'],'600.00')
    def test_determinism(self):self.assertEqual(run(s={'B':{'P':1},'A':{'P':1}})['participants'],['A','B'])
    def test_insufficient(self):self.assertFalse(run(b={'P':3})['valid_synthetic'])
    def test_empty(self):self.assertFalse(run(b={})['valid_synthetic'])
    def test_boolean(self):self.assertFalse(run(b={'P':True})['valid_synthetic'])
    def test_negative_stock(self):self.assertFalse(run(s={'A':{'P':-1}})['valid_synthetic'])
    def test_missing_route(self):self.assertFalse(run(r={'A':'2'})['valid_synthetic'])
    def test_extra_route(self):self.assertFalse(run(r={'A':'2','B':'5','C':'6'})['valid_synthetic'])
    def test_nan(self):self.assertFalse(run(r={'A':'NaN','B':'5'})['valid_synthetic'])
    def test_invalid_versions(self):self.assertFalse(run(v={'basket':True})['valid_synthetic'])
    def test_stale(self):self.assertFalse(run(expected=dict(V,routes=1))['valid_synthetic'])
    def test_never_commercial(self):self.assertFalse(run()['commercial_quote_enabled'])
    def test_sorted_skus(self):self.assertEqual(list(run(b={'Z':1,'P':1},s={'A':{'P':1,'Z':1}},r={'A':'4'})['allocation']['A']),['P','Z'])
    def test_no_stock(self):self.assertFalse(run(s={})['valid_synthetic'])
class Races(unittest.TestCase):
    def setUp(self):self.s=State({'P':2},{'A':{'P':1},'B':{'P':1}},{'A':'2','B':'5'})
    def test_stable(self):self.assertTrue(self.s.evaluate(self.s.snapshot())['valid_synthetic'])
    def test_basket(self):self.invalidate('basket',{'P':1})
    def test_address(self):self.invalidate('address','synthetic')
    def test_routes(self):self.invalidate('routes',{'A':'9','B':'1'})
    def test_warehouses(self):self.invalidate('warehouses',{'A':{'P':2}})
    def invalidate(self,k,v):
        snap=self.s.snapshot();self.assertTrue(self.s.change(k,v,snap['versions']));self.assertFalse(self.s.evaluate(snap)['valid_synthetic'])
    def test_competing_writers(self):
        snap=self.s.snapshot();self.assertTrue(self.s.change('routes',{'A':'4','B':'7'},snap['versions']));self.assertFalse(self.s.change('basket',{'P':1},snap['versions']))
    def test_requote(self):
        snap=self.s.snapshot();self.s.change('routes',{'A':'4','B':'7'},snap['versions']);self.assertEqual(self.s.evaluate(self.s.snapshot())['fee_cup'],'1400.00')
    def test_overflow(self):
        self.s.versions['routes']=2**63-1;self.assertFalse(self.s.change('routes',{},self.s.snapshot()['versions']))
    def test_snapshot_copy(self):
        snap=self.s.snapshot();snap['data']['basket']['P']=9;self.assertEqual(self.s.data['basket']['P'],2)
    def test_unknown_kind(self):self.assertFalse(self.s.change('payments',{},self.s.snapshot()['versions']))
    def test_rejected_write_preserves(self):
        snap=self.s.snapshot();self.s.change('routes',{'A':'4','B':'7'},snap['versions']);self.assertFalse(self.s.change('basket',{'P':9},snap['versions']));self.assertEqual(self.s.data['basket']['P'],2)
