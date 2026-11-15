"""Offline synthetic OSRM comparison v2; no routing or network calls."""
import json, math, sys
from pathlib import Path
CODES={'Ok','NoRoute','NoSegment','Timeout'}
def num(x): return type(x) in (int,float) and math.isfinite(x) and x>=0
def pairs(items):
 d={}
 for k,v in items:
  if k in d: raise ValueError('duplicate key')
  d[k]=v
 return d
def keys(obj,expected):
 if type(obj)!=dict or set(obj)!=set(expected): raise ValueError('schema')
def validate(raw):
 if type(raw)!=bytes or len(raw)>4000000: raise ValueError('input size')
 d=json.loads(raw,object_pairs_hook=pairs,parse_constant=lambda x:(_ for _ in ()).throw(ValueError('nonfinite')))
 keys(d,('cases','snap_limit_m'))
 limit=d['snap_limit_m']; cases=d['cases']
 if not num(limit) or type(cases)!=list or not 1<=len(cases)<=10000: raise ValueError('limits')
 seen=set(); ce=[]; ee=[]; diffs=[]; eligible=0; compared=0; outside=0; outside_disagreements=0
 bs={x:0 for x in sorted(CODES)}; cs={x:0 for x in sorted(CODES)}
 for c in cases:
  keys(c,('id','in_coverage','baseline','candidate'))
  ident=c['id']
  if type(ident)!=str or not ident or len(ident)>128 or ident in seen or type(c['in_coverage'])!=bool: raise ValueError('case')
  seen.add(ident)
  for side in ('baseline','candidate'):
   r=c[side]; keys(r,('code','distance_m','snaps_m'))
   if type(r['code'])!=str or r['code'] not in CODES: raise ValueError('code')
   if type(r['snaps_m'])!=list or len(r['snaps_m'])!=2 or not all(num(v) for v in r['snaps_m']): raise ValueError('endpoint snaps')
   if r['code']=='Ok':
    if not num(r['distance_m']): raise ValueError('distance')
   elif r['distance_m'] is not None: raise ValueError('non-ok distance')
  a=c['baseline']; b=c['candidate']; bs[a['code']]+=1; cs[b['code']]+=1
  if not c['in_coverage']:
   outside+=1
   if a['code']!=b['code']: outside_disagreements+=1
   continue
  if a['code']!='Ok': ce.append([ident,'baseline_unavailable']); continue
  eligible+=1
  if b['code']!='Ok': ce.append([ident,'candidate_unavailable']); continue
  bad=False
  for side,r in (('baseline',a),('candidate',b)):
   for i,v in enumerate(r['snaps_m']):
    if v>limit:
     ce.append([ident,side+'_snap_'+('origin' if i==0 else 'destination')]); bad=True
  if bad: continue
  compared+=1; delta=b['distance_m']-a['distance_m']
  if not math.isfinite(delta): raise ValueError('numeric overflow')
  diffs.append(delta)
  if a['distance_m']==0:
   if delta!=0: ee.append([ident,'zero_baseline_mismatch'])
  elif abs(delta)>100 or abs(delta)/a['distance_m']>0.02: ee.append([ident,'distance_drift'])
 if not eligible: ce.append(['global','no_eligible_routes'])
 if not compared: ee.append(['global','no_comparable_routes'])
 try:
  pos=math.fsum(v for v in diffs if v>0); neg=-math.fsum(v for v in diffs if v<0); net=math.fsum(diffs)
 except OverflowError as exc: raise ValueError('numeric overflow') from exc
 if pos>neg: ee.append(['global','positive_net_distance_bias'])
 return {'accepted':not ce and not ee,'coverage_audit':{'passed':not ce,'errors':ce,'baseline_status':bs,'candidate_status':cs,'eligible':eligible,'outside_unverified':outside,'outside_status_disagreements':outside_disagreements},'route_equivalence':{'passed':not ee,'errors':ee,'compared':compared,'increased':sum(v>0 for v in diffs),'decreased':sum(v<0 for v in diffs),'unchanged':sum(v==0 for v in diffs),'positive_delta_m':pos,'negative_delta_m':neg,'net_delta_m':net}}
if __name__=='__main__':
 try:
  result=validate(Path(sys.argv[1]).read_bytes());print(json.dumps(result,sort_keys=True));sys.exit(0 if result['accepted'] else 1)
 except (ValueError,TypeError,IndexError,OSError) as exc:
  print('invalid input:',exc,file=sys.stderr);sys.exit(2)
