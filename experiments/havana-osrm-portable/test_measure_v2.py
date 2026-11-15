import json
import pathlib
import tempfile
import unittest
from measure_v2 import validate, summarize, load
GOOD={'phase':'routes','exit_code':0,'wall_seconds':1.2,'peak_bytes':123,'disk_bytes':234,'cpu_seconds':0.5,'route_ms':[1,2,3,4,5]}
class TestMeasureV2(unittest.TestCase):
    def test_percentiles(self):
        x=summarize([GOOD])[0]
        self.assertEqual((x['route_p50_ms'],x['route_p95_ms'],x['route_p99_ms']),(3,5,5))
    def test_empty(self):
        with self.assertRaises(ValueError): summarize([])
    def test_nan(self):
        with self.assertRaises(ValueError): validate({**GOOD,'peak_bytes':float('nan')})
    def test_infinity(self):
        with self.assertRaises(ValueError): validate({**GOOD,'route_ms':[float('inf')]})
    def test_bool(self):
        with self.assertRaises(ValueError): validate({**GOOD,'peak_bytes':True})
    def test_bad_phase(self):
        with self.assertRaises(ValueError): validate({**GOOD,'phase':'shell'})
    def test_extra_field(self):
        with self.assertRaises(ValueError): validate({**GOOD,'command':'bad'})
    def test_missing_samples(self):
        with self.assertRaises(ValueError): validate({**GOOD,'route_ms':[]})
    def test_no_samples_in_extract(self):
        with self.assertRaises(ValueError): validate({**GOOD,'phase':'extract'})
    def test_negative_latency(self):
        with self.assertRaises(ValueError): validate({**GOOD,'route_ms':[-1]})
    def test_exit_bool(self):
        with self.assertRaises(ValueError): validate({**GOOD,'exit_code':False})
    def test_exit_negative(self):
        with self.assertRaises(ValueError): validate({**GOOD,'exit_code':-1})
    def test_failed_routes_samples(self):
        with self.assertRaises(ValueError): validate({**GOOD,'exit_code':1})
    def test_fractional_bytes(self):
        with self.assertRaises(ValueError): validate({**GOOD,'disk_bytes':2.3})
    def test_duplicate_keys(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td)/'data.json';p.write_text('[{"phase":"routes","phase":"extract"}]')
            with self.assertRaises(ValueError):load(p)
    def test_json_nan(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td)/'data.json';p.write_text('[NaN]')
            with self.assertRaises(ValueError):load(p)
    def test_sha256(self):
        with tempfile.TemporaryDirectory() as td:
            p=pathlib.Path(td)/'data.json';p.write_text(json.dumps([GOOD]))
            self.assertEqual(len(load(p)['input_sha256']),64)
    def test_too_many_records(self):
        with self.assertRaises(ValueError):summarize([GOOD]*10001)
    def test_too_many_samples(self):
        with self.assertRaises(ValueError):validate({**GOOD,'route_ms':[1]*100001})
    def test_nonlist(self):
        with self.assertRaises(ValueError):summarize({'x':GOOD})
if __name__=='__main__':unittest.main()
