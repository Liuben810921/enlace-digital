import unittest
from warehouse_assignment_v2 import State,allocate
V={'basket':0,'address':0,'routes':0,'warehouses':0}
class Adversarial(unittest.TestCase):
 def test_unhashable_kind(self):
  s=State({'P':1},{'A':{'P':1}},{'A':'4'})
  self.assertFalse(s.change([],{},s.snapshot()['versions']))
 def test_snapshot_mutation_warehouse(self):
  s=State({'P':1},{'A':{'P':1}},{'A':'4'})
  snap=s.snapshot();snap['data']['warehouses']['A']['P']=0
  self.assertEqual(s.data['warehouses']['A']['P'],1)
 def test_invalid_stock_no_partial_success(self):
  r=allocate({'P':2},{'A':{'P':1}}, {'A':'4'},V)
  self.assertFalse(r['valid_synthetic']);self.assertIsNone(r['fee_cup'])
 def test_invalid_route_no_partial_success(self):
  r=allocate({'P':1},{'A':{'P':1}}, {'A':'NaN'},V)
  self.assertFalse(r['valid_synthetic']);self.assertIsNone(r['fee_cup'])
 def test_stale_address(self):
  s=State({'P':1},{'A':{'P':1}},{'A':'4'});snap=s.snapshot()
  self.assertTrue(s.change('address','X',snap['versions']))
  self.assertFalse(s.evaluate(snap)['valid_synthetic'])
 def test_malformed_warehouse_change_rejected(self):
  s=State({'P':1},{'A':{'P':1}},{'A':'4'});v=s.snapshot()['versions']
  self.assertFalse(s.change('warehouses',[],v));self.assertEqual(s.snapshot()['versions'],v)
 def test_malformed_basket_change_rejected(self):
  s=State({'P':1},{'A':{'P':1}},{'A':'4'});v=s.snapshot()['versions']
  self.assertFalse(s.change('basket',None,v));self.assertEqual(s.snapshot()['versions'],v)
 def test_malformed_routes_change_rejected(self):
  s=State({'P':1},{'A':{'P':1}},{'A':'4'});v=s.snapshot()['versions']
  self.assertFalse(s.change('routes',[],v));self.assertEqual(s.snapshot()['versions'],v)
