import json, math, sys
from pathlib import Path
CODES={'Ok','NoRoute','NoSegment','Timeout'}
def number(v):
    return type(v) in (int,float) and math.isfinite(v) and v>=0
def unique(pairs):
    d={}
    for k,v in pairs:
        if k in d: raise ValueError('duplicate key: '+k)
        d[k]=v
    return d
def validate(raw):
    if len(raw)>4_000_000: raise ValueError('input too large')
    doc=json.loads(raw,object_pairs_hook=unique,parse_constant=lambda x: (_ for _ in ()).throw(ValueError('nonfinite')))
    if type(doc)!=dict or set(doc)!={'cases','snap_limit_m'}: raise ValueError('schema')
    if not number(doc['snap_limit_m']): raise ValueError('snap limit')
    cases=doc['cases']
    if type(cases)!=list or not 1<=len(cases)<=10000: raise ValueError('cases')
    seen=set(); errors=[]; checked=0; diffs=[]
    for c in cases:
        if type(c)!=dict or set(c)!={'id','in_coverage','baseline','candidate'}: raise ValueError('case schema')
        if type(c['id'])!=str or not c['id'] or c['id'] in seen: raise ValueError('case id')
        seen.add(c['id'])
        if type(c['in_coverage'])!=bool: raise ValueError('coverage')
        for side in ('baseline','candidate'):
            x=c[side]
            if type(x)!=dict or set(x)!={'code','distance_m','snap_m'}: raise ValueError('route schema')
            if type(x['code'])!=str or x['code'] not in CODES: raise ValueError('code')
            if not number(x['snap_m']): raise ValueError('snap')
            if x['code']=='Ok':
                if not number(x['distance_m']): raise ValueError('distance')
            elif x['distance_m'] is not None: raise ValueError('non-Ok distance')
        a,b=c['baseline'],c['candidate']; id=c['id']
        if c['in_coverage'] and a['code']=='Ok':
            checked+=1
            if b['code']!='Ok': errors.append([id,'connectivity_loss']); continue
            if a['snap_m']>doc['snap_limit_m'] or b['snap_m']>doc['snap_limit_m']: errors.append([id,'snapping']); continue
            delta=abs(a['distance_m']-b['distance_m'])
            if a['distance_m']==0:
                if delta!=0: errors.append([id,'zero_baseline_mismatch'])
            elif delta>100 or delta/a['distance_m']>0.02: errors.append([id,'distance_drift'])
            diffs.append(b['distance_m']-a['distance_m'])
    if checked==0: errors.append(['global','no_eligible_routes'])
    if diffs and all(x>0 for x in diffs): errors.append(['global','all_distances_increase'])
    return {'accepted':not errors,'eligible':checked,'errors':errors}
if __name__=='__main__':
    try:
        result=validate(Path(sys.argv[1]).read_bytes());print(json.dumps(result,sort_keys=True));sys.exit(0 if result['accepted'] else 1)
    except (ValueError,TypeError,IndexError,OSError) as exc:
        print('invalid input:',exc,file=sys.stderr);sys.exit(2)
