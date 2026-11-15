import json
import unittest
from manifest import check, parse, percentiles
BASE = {'run_id':'run_001','phase':'routes','osrm_version':'5.27.1','profile_sha256':'a'*64,'input_sha256':'b'*64,'image_digest':'sha256:'+'c'*64,'source_url':'https://example.org/authorized.pbf','source_license':'ODbL-1.0','exit_code':0,'wall_seconds':2,'cpu_seconds':1,'peak_bytes':100,'disk_bytes':200,'route_ms':[1,2,3,4,5]}
class TestManifest(unittest.TestCase):
 def test_valid(self): self.assertEqual(percentiles(BASE['route_ms']),{'p50':3,'p95':5,'p99':5})
 def test_parse(self): self.assertEqual(len(parse(json.dumps([BASE]).encode())['input_sha256']),64)
 def test_duplicate_run(self):
  with self.assertRaises(ValueError): parse(json.dumps([BASE,BASE]).encode())
 def test_duplicate_key(self):
  with self.assertRaises(ValueError): parse(b'{"x":1,"x":2}')
 def test_nan(self):
  with self.assertRaises(ValueError): parse(b'[NaN]')
 def test_empty(self):
  with self.assertRaises(ValueError): parse(b'[]')
 def test_large(self):
  with self.assertRaises(ValueError): parse(b' '* (16*1024*1024+1))
 def test_bad_version(self):
  with self.assertRaises(ValueError): check({**BASE,'osrm_version':'latest'})
 def test_bad_digest(self):
  with self.assertRaises(ValueError): check({**BASE,'image_digest':'latest'})
 def test_bad_hash(self):
  with self.assertRaises(ValueError): check({**BASE,'input_sha256':'abc'})
 def test_bad_url(self):
  with self.assertRaises(ValueError): check({**BASE,'source_url':'http://example.org'})
 def test_negative(self):
  with self.assertRaises(ValueError): check({**BASE,'peak_bytes':-1})
 def test_bool(self):
  with self.assertRaises(ValueError): check({**BASE,'peak_bytes':True})
 def test_nan_latency(self):
  with self.assertRaises(ValueError): check({**BASE,'route_ms':[float('nan')]})
 def test_failed_route_with_samples(self):
  with self.assertRaises(ValueError): check({**BASE,'exit_code':1})
 def test_failed_no_samples(self): self.assertEqual(check({**BASE,'exit_code':1,'route_ms':[],'phase':'extract'})['exit_code'],1)
 def test_missing_field(self):
  x=dict(BASE);del x['run_id']
  with self.assertRaises(ValueError): check(x)
 def test_extra_field(self):
  with self.assertRaises(ValueError): check({**BASE,'secret':'x'})
 def test_duplicate_sample_invalid(self):
  with self.assertRaises(ValueError): check({**BASE,'route_ms':[False]})
 def test_invalid_run(self):
  with self.assertRaises(ValueError): check({**BASE,'run_id':'../../etc'})
 def test_no_samples_success_route(self):
  with self.assertRaises(ValueError): check({**BASE,'route_ms':[]})
 def test_percentile_one(self): self.assertEqual(percentiles([7]),{'p50':7,'p95':7,'p99':7})
if __name__=='__main__':unittest.main()
