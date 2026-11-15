"""Pure offline validator for synthetic OSRM benchmark records. No execution or network."""
import hashlib
import json
import math
import pathlib
import sys

PHASES = frozenset(('extract', 'partition', 'customize', 'routed', 'routes'))
FIELDS = frozenset(('phase','exit_code','wall_seconds','peak_bytes','disk_bytes','cpu_seconds','route_ms'))

def finite_nonnegative(value):
    return type(value) in (int, float) and math.isfinite(value) and value >= 0

def validate(record):
    if type(record) is not dict or record.keys() != FIELDS:
        raise ValueError('schema mismatch')
    if type(record['phase']) is not str or record['phase'] not in PHASES:
        raise ValueError('invalid phase')
    if type(record['exit_code']) is not int or not 0 <= record['exit_code'] <= 255:
        raise ValueError('invalid exit code')
    for key in ('wall_seconds','peak_bytes','disk_bytes','cpu_seconds'):
        if not finite_nonnegative(record[key]):
            raise ValueError('invalid '+key)
    if type(record['peak_bytes']) is not int or type(record['disk_bytes']) is not int:
        raise ValueError('byte counts must be integers')
    samples = record['route_ms']
    if type(samples) is not list or len(samples) > 100000:
        raise ValueError('invalid route samples')
    if any(not finite_nonnegative(v) for v in samples):
        raise ValueError('invalid latency')
    if (record['phase'] == 'routes') != bool(samples):
        raise ValueError('samples only required for routes')
    if record['exit_code'] != 0 and samples:
        raise ValueError('failed run cannot publish successful latency samples')
    return record

def percentile(sorted_samples, percentile_value):
    return sorted_samples[max(0, math.ceil(percentile_value*len(sorted_samples))-1)]

def summarize(records):
    if type(records) is not list or not records or len(records)>10000:
        raise ValueError('invalid records')
    result = []
    for record in records:
        validate(record)
        samples = sorted(record['route_ms'])
        result.append({
            'phase':record['phase'], 'passed':record['exit_code']==0,
            'wall_seconds':record['wall_seconds'], 'peak_bytes':record['peak_bytes'],
            'disk_bytes':record['disk_bytes'], 'cpu_seconds':record['cpu_seconds'],
            'route_count':len(samples),
            'route_p50_ms':percentile(samples,.50) if samples else None,
            'route_p95_ms':percentile(samples,.95) if samples else None,
            'route_p99_ms':percentile(samples,.99) if samples else None,
        })
    return result

def load(path):
    raw = pathlib.Path(path).read_bytes()
    if len(raw)>16*1024*1024:
        raise ValueError('input exceeds 16 MiB')
    def unique_pairs(pairs):
        out={}
        for k,v in pairs:
            if k in out:
                raise ValueError('duplicate JSON key')
            out[k]=v
        return out
    def reject_constant(value):
        raise ValueError('invalid JSON constant: '+value)
    records=json.loads(raw.decode('utf-8'),object_pairs_hook=unique_pairs,parse_constant=reject_constant)
    return {'input_sha256':hashlib.sha256(raw).hexdigest(),'summary':summarize(records)}

if __name__=='__main__':
    if len(sys.argv)!=2:
        raise SystemExit('usage: python measure_v2.py measurements.json')
    print(json.dumps(load(sys.argv[1]),sort_keys=True,indent=2,allow_nan=False))
