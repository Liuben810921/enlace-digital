import unittest
from measure import summarize,validate
GOOD={'phase':'routes','exit_code':0,'wall_seconds':1.2,'peak_bytes':123,'disk_bytes':234,'cpu_seconds':0.5,'route_ms':[1,2,3,4,5]}
class TestMeasure(unittest.TestCase):
 def test_valid(self): self.assertEqual(summarize([GOOD])[0]['route_p95_ms'],5)
 def test_empty(self):
  with self.assertRaises(ValueError): summarize([])
 def test_nan(self):
  with self.assertRaises(ValueError): validate({**GOOD,'peak_bytes':float('nan')})
 def test_bool(self):
  with self.assertRaises(ValueError): validate({**GOOD,'peak_bytes':True})
 def test_bad_phase(self):
  with self.assertRaises(ValueError): validate({**GOOD,'phase':'shell'})
 def test_bad_extra_field(self):
  with self.assertRaises(ValueError): validate({**GOOD,'command':'rm -rf /'})
 def test_missing_samples(self):
  with self.assertRaises(ValueError): validate({**GOOD,'route_ms':[]})
 def test_no_samples_in_extract(self):
  with self.assertRaises(ValueError): validate({**GOOD,'phase':'extract'})
 def test_negative_latency(self):
  with self.assertRaises(ValueError): validate({**GOOD,'route_ms':[-1]})
 def test_exit_code(self):
  with self.assertRaises(ValueError): validate({**GOOD,'exit_code':False})
if __name__=='__main__':unittest.main()
