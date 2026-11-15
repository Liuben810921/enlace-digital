import unittest
from warehouse_state_hardened import HardenedState


def state():
    return HardenedState({'P':2},{'A':{'P':1},'B':{'P':1}},{'A':'2','B':'5'})

class HardenedTests(unittest.TestCase):
    def test_normal(self): self.assertEqual(state().evaluate(state().snapshot())['commercial_quote_enabled'], False)
    def test_quote(self):
        s=state(); self.assertEqual(s.evaluate(s.snapshot())['fee_cup'],'1000.00')
    def test_external_data_mutation(self):
        s=state(); x=s.data; x['basket']['P']=999; self.assertEqual(s.data['basket']['P'],2)
    def test_external_versions_mutation(self):
        s=state(); x=s.versions; x['basket']=12; self.assertEqual(s.versions['basket'],0)
    def test_original_mutation(self):
        b={'P':2}; w={'A':{'P':2}}; r={'A':'4'}; s=HardenedState(b,w,r); b['P']=8;w['A']['P']=9;r['A']='90';self.assertEqual(s.data['basket']['P'],2);self.assertEqual(s.data['warehouses']['A']['P'],2)
    def test_snapshot_tampering(self):
        s=state(); x=s.snapshot(); x['data']['basket']['P']=1; self.assertFalse(s.evaluate(x)['valid_synthetic'])
    def test_snapshot_version_tampering(self):
        s=state(); x=s.snapshot(); x['versions']['basket']=1; self.assertFalse(s.evaluate(x)['valid_synthetic'])
    def test_invalid_snapshot(self):self.assertFalse(state().evaluate(None)['valid_synthetic'])
    def test_invalid_initial(self):
        with self.assertRaises(ValueError):HardenedState({}, {}, {})
    def test_bad_change(self):
        s=state(); x=s.snapshot(); self.assertFalse(s.change('warehouses',[],x['versions']));self.assertEqual(s.versions,x['versions'])
    def test_change_copy(self):
        s=state(); x=s.snapshot(); v={'P':1};self.assertTrue(s.change('basket',v,x['versions']));v['P']=100;self.assertEqual(s.data['basket']['P'],1)
    def test_stale_all_four(self):
        for kind,value in [('basket',{'P':1}),('address','test'),('routes',{'A':'2','B':'7'}),('warehouses',{'A':{'P':2}})]:
            s=state(); x=s.snapshot();self.assertTrue(s.change(kind,value,x['versions']));self.assertFalse(s.evaluate(x)['valid_synthetic'])
    def test_competing_writers(self):
        s=state();x=s.snapshot();self.assertTrue(s.change('basket',{'P':1},x['versions']));self.assertFalse(s.change('routes',{'A':'2','B':'6'},x['versions']))
    def test_requote(self):
        s=state();x=s.snapshot();s.change('routes',{'A':'2','B':'6'},x['versions']);self.assertEqual(s.evaluate(s.snapshot())['fee_cup'],'1200.00')
    def test_no_commercial(self):
        s=state();r=s.evaluate(s.snapshot());self.assertFalse(r['commercial_approval']);self.assertFalse(r['commercial_quote_enabled'])
