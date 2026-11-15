import unittest
from warehouse_state_hardened import HardenedState

class HardenedAdversarialV2(unittest.TestCase):
    def setUp(self):
        self.s=HardenedState({'P':1},{'A':{'P':1}},{'A':'4'})
    def test_nan_route_rejected_without_version_bump(self):
        before=self.s.versions
        self.assertFalse(self.s.change('routes',{'A':float('nan')},before))
        self.assertEqual(self.s.versions,before)
    def test_inf_route_rejected(self):
        self.assertFalse(self.s.change('routes',{'A':float('inf')},self.s.versions))
    def test_negative_route_rejected(self):
        self.assertFalse(self.s.change('routes',{'A':'-1'},self.s.versions))
    def test_bool_route_rejected(self):
        self.assertFalse(self.s.change('routes',{'A':True},self.s.versions))
    def test_route_overflow_rejected(self):
        self.assertFalse(self.s.change('routes',{'A':'1000001'},self.s.versions))
    def test_valid_route_change(self):
        self.assertTrue(self.s.change('routes',{'A':'5.25'},self.s.versions))
        self.assertEqual(self.s.evaluate(self.s.snapshot())['fee_cup'],'1050.00')
    def test_stale_cannot_override(self):
        old=self.s.snapshot(); self.s.change('address','new',old['versions'])
        self.assertFalse(self.s.change('routes',{'A':'9'},old['versions']))
    def test_reject_unexpected_snapshot_key(self):
        snap=self.s.snapshot(); snap['unexpected']='x'
        self.assertFalse(self.s.evaluate(snap)['valid_synthetic'])
