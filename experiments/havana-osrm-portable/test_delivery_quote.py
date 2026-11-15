import unittest
from delivery_quote import quote

class DeliveryQuoteTests(unittest.TestCase):
    def test_farthest_warehouse(self):
        r=quote(['A','B'],{'A':'2','B':'7.5'})
        self.assertTrue(r['valid_synthetic']); self.assertEqual(r['selected_warehouse'],'B'); self.assertEqual(r['fee_cup'],'1500.00')
    def test_minimum_three_km(self):
        self.assertEqual(quote(['A'],{'A':'1'})['fee_cup'],'600.00')
    def test_exact_floor(self):
        self.assertEqual(quote(['A'],{'A':'3'})['fee_cup'],'600.00')
    def test_special_fee(self):
        self.assertEqual(quote(['A'],{'A':'9'},special_fee_cup='1250')['fee_cup'],'1250.00')
    def test_tie_deterministic(self):
        self.assertEqual(quote(['B','A'],{'A':'5','B':'5'})['selected_warehouse'],'B')
    def test_incomplete_routes_fail_closed(self):
        self.assertFalse(quote(['A','B'],{'A':'5'})['valid_synthetic'])
    def test_extra_route_fail_closed(self):
        self.assertFalse(quote(['A'],{'A':'5','B':'6'})['valid_synthetic'])
    def test_negative_fail_closed(self):
        self.assertFalse(quote(['A'],{'A':'-1'})['valid_synthetic'])
    def test_nan_fail_closed(self):
        self.assertFalse(quote(['A'],{'A':'NaN'})['valid_synthetic'])
    def test_infinity_fail_closed(self):
        self.assertFalse(quote(['A'],{'A':'Infinity'})['valid_synthetic'])
    def test_boolean_fail_closed(self):
        self.assertFalse(quote(['A'],{'A':True})['valid_synthetic'])
    def test_duplicate_warehouse_fail_closed(self):
        self.assertFalse(quote(['A','A'],{'A':'3'})['valid_synthetic'])
    def test_no_warehouse_fail_closed(self):
        self.assertFalse(quote([], {})['valid_synthetic'])
    def test_no_commercial_approval(self):
        r=quote(['A'],{'A':'10'}); self.assertFalse(r['commercial_approval']); self.assertFalse(r['commercial_quote_enabled'])
    def test_bad_special_fee(self):
        self.assertFalse(quote(['A'],{'A':'10'},special_fee_cup='-1')['valid_synthetic'])
    def test_rounding(self):
        self.assertEqual(quote(['A'],{'A':'3.001'},rate_cup_km='200.001')['fee_cup'],'600.20')
    def test_large_warehouse_count(self):
        ws=[str(i) for i in range(21)]; self.assertFalse(quote(ws,{w:'1' for w in ws})['valid_synthetic'])

if __name__=='__main__': unittest.main()
