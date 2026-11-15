"""Strict offline manifest validation; does not execute OSRM."""
import hashlib
import json
import math
import re
from pathlib import Path

HEX64 = re.compile(r'[0-9a-f]{64}\Z', re.ASCII)
ID = re.compile(r'[a-z0-9][a-z0-9_-]{0,63}\Z', re.ASCII)
PHASES = {'extract', 'partition', 'customize', 'routed', 'routes'}
FIELDS = {'run_id', 'phase', 'osrm_version', 'profile_sha256', 'input_sha256', 'image_digest', 'source_url', 'source_license', 'exit_code', 'wall_seconds', 'cpu_seconds', 'peak_bytes', 'disk_bytes', 'route_ms'}

def check(x):
    if type(x) is not dict or set(x) != FIELDS:
        raise ValueError('schema')
    if type(x['run_id']) is not str or not ID.fullmatch(x['run_id']):
        raise ValueError('run_id')
    if x['phase'] not in PHASES or type(x['phase']) is not str:
        raise ValueError('phase')
    if type(x['osrm_version']) is not str or not re.fullmatch(r'[0-9]+\.[0-9]+\.[0-9]+', x['osrm_version']):
        raise ValueError('version')
    for k in ('profile_sha256', 'input_sha256'):
        if type(x[k]) is not str or not HEX64.fullmatch(x[k]):
            raise ValueError(k)
    if type(x['image_digest']) is not str or not re.fullmatch(r'sha256:[0-9a-f]{64}', x['image_digest']):
        raise ValueError('digest')
    for k in ('source_url', 'source_license'):
        if type(x[k]) is not str or not 1 <= len(x[k]) <= 256 or any(ord(c) < 32 for c in x[k]):
            raise ValueError(k)
    if not x['source_url'].startswith('https://'):
        raise ValueError('url')
    if type(x['exit_code']) is not int or not 0 <= x['exit_code'] <= 255:
        raise ValueError('exit')
    for k in ('wall_seconds', 'cpu_seconds', 'peak_bytes', 'disk_bytes'):
        v = x[k]
        if type(v) not in (int, float) or not math.isfinite(v) or v < 0:
            raise ValueError(k)
    if any(type(x[k]) is not int for k in ('peak_bytes', 'disk_bytes')):
        raise ValueError('bytes')
    samples = x['route_ms']
    if type(samples) is not list or len(samples) > 100000 or any(type(v) not in (int, float) or not math.isfinite(v) or v < 0 for v in samples):
        raise ValueError('latencies')
    if (x['phase'] == 'routes') != bool(samples) or (x['exit_code'] != 0 and samples):
        raise ValueError('samples inconsistent')
    return x

def percentiles(samples):
    a = sorted(samples)
    return {f'p{p}': a[math.ceil(p * len(a) / 100) - 1] if a else None for p in (50, 95, 99)}

def parse(raw):
    if len(raw) > 16 * 1024 * 1024:
        raise ValueError('too large')
    def pairs(items):
        d = {}
        for k, v in items:
            if k in d:
                raise ValueError('duplicate key')
            d[k] = v
        return d
    records = json.loads(raw.decode('utf-8'), object_pairs_hook=pairs, parse_constant=lambda x: (_ for _ in ()).throw(ValueError('nonfinite')))
    if type(records) is not list or not 1 <= len(records) <= 10000:
        raise ValueError('records')
    ids = set()
    result = []
    for record in records:
        check(record)
        if record['run_id'] in ids:
            raise ValueError('duplicate run')
        ids.add(record['run_id'])
        result.append({'run_id': record['run_id'], 'phase': record['phase'], 'passed': record['exit_code'] == 0, 'percentiles_ms': percentiles(record['route_ms'])})
    return {'input_sha256': hashlib.sha256(raw).hexdigest(), 'runs': result}

if __name__ == '__main__':
    import sys
    if len(sys.argv) != 2:
        raise SystemExit('usage: python manifest.py records.json')
    print(json.dumps(parse(Path(sys.argv[1]).read_bytes()), sort_keys=True, indent=2))
