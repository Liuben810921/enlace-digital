"""Offline adversarial contract tests; no network, DB or commercial quotes."""
import unittest
from warehouse_state_hardened import HardenedState
from warehouse_assignment_v2 import allocate
from delivery_quote import quote

V = dict(basket=0,address=0,routes=0,warehouses=0)

class StructuralAndSafetyTests(unittest.TestCase):
    def setUp(self):
        self.s=HardenedState({'P':2},{'A':{'P':2}},{'A':'4'})
    def assert_rejected(self,kind,value):
        before=self.s.snapshot()
        self.assertFalse(self.s.change(kind,value,before['versions']))
        self.assertEqual(before,self.s.snapshot())
    def test_nested_warehouse_bool(self):self.assert_rejected('warehouses',{'A':{'P':True}})
    def test_nested_warehouse_negative(self):self.assert_rejected('warehouses',{'A':{'P':-1}})
    def test_nested_warehouse_list(self):self.assert_rejected('warehouses',{'A':['P']})
    def test_nested_warehouse_null(self):self.assert_rejected('warehouses',{'A':None})
    def test_nested_warehouse_bad_key(self):self.assert_rejected('warehouses',{1:{'P':2}})
    def test_nested_warehouse_stock_limit(self):self.assert_rejected('warehouses',{'A':{'P':1000001}})
    def test_basket_bool(self):self.assert_rejected('basket',{'P':True})
    def test_basket_zero(self):self.assert_rejected('basket',{'P':0})
    def test_basket_overflow(self):self.assert_rejected('basket',{'P':10001})
    def test_address_overflow(self):self.assert_rejected('address','a'*301)
    def test_route_nested(self):self.assert_rejected('routes',{'A':{'distance':4}})
    def test_route_missing_after_change(self):
        self.assertTrue(self.s.change('routes',{},self.s.versions))
        r=self.s.evaluate(self.s.snapshot())
        self.assertFalse(r['valid_synthetic']);self.assertFalse(r['commercial_quote_enabled'])
    def test_quote_bad_warehouse(self):
        r=quote([['A']],{})
        self.assertFalse(r['valid_synthetic']);self.assertIsNone(r['fee_cup'])
    def test_quote_bad_route(self):
        r=quote(['A'],{'A':'NaN'})
        self.assertFalse(r['valid_synthetic']);self.assertFalse(r['commercial_approval'])
    def test_allocation_insufficient_no_partial_fee(self):
        r=allocate({'P':3},{'A':{'P':2}},{'A':'4'},V)
        self.assertFalse(r['valid_synthetic']);self.assertIsNone(r['fee_cup'])
    def test_versions_stale_all_dimensions(self):
        for kind,val in [('basket',{'P':1}),('address','new'),('routes',{'A':'6'}),('warehouses',{'A':{'P':3}})]:
            s=HardenedState({'P':2},{'A':{'P':2}},{'A':'4'})
            stale=s.snapshot();self.assertTrue(s.change(kind,val,stale['versions']))
            result=s.evaluate(stale)
            self.assertFalse(result['valid_synthetic']);self.assertFalse(result['commercial_quote_enabled'])
    def test_no_commercial_success(self):
        r=self.s.evaluate(self.s.snapshot())
        self.assertTrue(r['valid_synthetic'])
        self.assertFalse(r['commercial_approval']);self.assertFalse(r['commercial_quote_enabled'])
    def test_no_commercial_failure(self):
        r=self.s.evaluate(None)
        self.assertFalse(r['commercial_approval']);self.assertFalse(r['commercial_quote_enabled'])
