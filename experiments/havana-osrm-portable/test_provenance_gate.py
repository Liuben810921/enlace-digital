import unittest,json
from provenance_gate import validate_manifest,digest
def fixture():
 c={'snap_limit_m':30,'cases':[{'id':i,'in_coverage':i=='A','baseline':{},'candidate':{}} for i in ('A','B')]}
 m={'schema':'synthetic-osrm-comparison-v1','producer':'synthetic','corpus_sha256':digest(c),'case_ids_sha256':digest(['A','B']),'case_count':2,'coverage':{'declared_inside':1,'declared_outside':1,'method':'synthetic-declaration','geometry_verified':False}}
 return m,c
def check(m,c): return validate_manifest(json.dumps(m).encode(),json.dumps(c).encode())
class Tests(unittest.TestCase):
 def reject(self,change):
  m,c=fixture();change(m,c)
  with self.assertRaises(ValueError):check(m,c)
 def test_valid(self):m,c=fixture();self.assertTrue(check(m,c)['integrity_verified'])
 def test_geo_false(self):m,c=fixture();self.assertFalse(check(m,c)['geographic_coverage_verified'])
 def test_auth_false(self):m,c=fixture();self.assertFalse(check(m,c)['producer_authenticated'])
 def test_tamper(self):self.reject(lambda m,c:c['cases'][0].update(candidate={'distance_m':99}))
 def test_coverage_tamper(self):self.reject(lambda m,c:c['cases'][0].update(in_coverage=False))
 def test_order(self):self.reject(lambda m,c:c['cases'].reverse())
 def test_hash(self):self.reject(lambda m,c:m.update(corpus_sha256='0'*64))
 def test_ids_hash(self):self.reject(lambda m,c:m.update(case_ids_sha256='0'*64))
 def test_count(self):self.reject(lambda m,c:m.update(case_count=3))
 def test_cov_count(self):self.reject(lambda m,c:m['coverage'].update(declared_inside=2))
 def test_geo_claim(self):self.reject(lambda m,c:m['coverage'].update(geometry_verified=True))
 def test_method(self):self.reject(lambda m,c:m['coverage'].update(method='verified'))
 def test_duplicate_id(self):self.reject(lambda m,c:c['cases'][1].update(id='A'))
 def test_missing(self):self.reject(lambda m,c:m.pop('producer'))
 def test_extra(self):self.reject(lambda m,c:m.update(trusted=True))
 def test_bool_count(self):self.reject(lambda m,c:m.update(case_count=True))
 def test_upper_hash(self):self.reject(lambda m,c:m.update(corpus_sha256=m['corpus_sha256'].upper()))
 def test_producer(self):self.reject(lambda m,c:m.update(producer=''))
 def test_duplicate_json(self):
  with self.assertRaises(ValueError):validate_manifest(b'{"schema":1,"schema":2}',b'{}')
 def test_nan(self):
  with self.assertRaises(ValueError):validate_manifest(b'{"x":NaN}',b'{}')
 def test_large(self):
  with self.assertRaises(ValueError):validate_manifest(b' '*4000001,b'{}')
 def test_version(self):self.reject(lambda m,c:m.update(schema='v2'))
 def test_id_type(self):self.reject(lambda m,c:c['cases'][0].update(id=1))
 def test_coverage_type(self):self.reject(lambda m,c:c['cases'][0].update(in_coverage=1))
if __name__=='__main__':unittest.main()
