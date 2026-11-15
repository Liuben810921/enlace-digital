"""Offline process benchmark recorder. Never invokes OSRM; consumes supplied JSON only."""
import json, math, statistics, sys
REQUIRED=('phase','exit_code','wall_seconds','peak_bytes','disk_bytes','cpu_seconds','route_ms')
PHASES={'extract','partition','customize','routed','routes'}
def validate(record):
    if type(record) is not dict or set(record)!=set(REQUIRED): raise ValueError('schema')
    if record['phase'] not in PHASES or type(record['exit_code']) is not int: raise ValueError('phase/exit')
    for k in ('wall_seconds','peak_bytes','disk_bytes','cpu_seconds'):
        v=record[k]
        if type(v) not in (int,float) or not math.isfinite(v) or v<0: raise ValueError(k)
    if type(record['route_ms']) is not list or len(record['route_ms'])>100000: raise ValueError('route_ms')
    for v in record['route_ms']:
        if type(v) not in (int,float) or not math.isfinite(v) or v<0: raise ValueError('route sample')
    if record['phase']!='routes' and record['route_ms']: raise ValueError('samples only in routes')
    if record['phase']=='routes' and not record['route_ms']: raise ValueError('missing samples')
    return record
def summarize(records):
    if type(records) is not list or not records: raise ValueError('empty')
    for r in records: validate(r)
    out=[]
    for r in records:
        samples=sorted(r['route_ms'])
        out.append({'phase':r['phase'],'passed':r['exit_code']==0,'wall_seconds':r['wall_seconds'],'peak_bytes':r['peak_bytes'],'disk_bytes':r['disk_bytes'],'cpu_seconds':r['cpu_seconds'],'route_p95_ms':samples[math.ceil(.95*len(samples))-1] if samples else None})
    return out
if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('usage: measure.py measurements.json')
    with open(sys.argv[1],encoding='utf-8') as f: data=json.load(f)
    print(json.dumps(summarize(data),sort_keys=True,indent=2))
