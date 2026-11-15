"""Offline synthetic corpus integrity; not producer authentication or geographic verification."""
import hashlib,json,re
HEX=re.compile(r'^[0-9a-f]{64}$')
def pairs(p):
 d={}
 for k,v in p:
  if k in d: raise ValueError('duplicate JSON key')
  d[k]=v
 return d
def parse(raw):
 if type(raw)!=bytes or len(raw)>4000000: raise ValueError('input size')
 return json.loads(raw,object_pairs_hook=pairs,parse_constant=lambda x:(_ for _ in ()).throw(ValueError('nonfinite')))
def digest(x):
 return hashlib.sha256(json.dumps(x,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()).hexdigest()
def validate_manifest(manifest_raw,corpus_raw):
 m=parse(manifest_raw); c=parse(corpus_raw)
 if type(m)!=dict or set(m)!={'schema','producer','corpus_sha256','case_ids_sha256','case_count','coverage'}: raise ValueError('manifest schema')
 if m['schema']!='synthetic-osrm-comparison-v1': raise ValueError('schema version')
 if type(m['producer'])!=str or not 1<=len(m['producer'])<=128: raise ValueError('producer')
 for key in ('corpus_sha256','case_ids_sha256'):
  if type(m[key])!=str or not HEX.fullmatch(m[key]): raise ValueError('hash format')
 if type(c)!=dict or set(c)!={'cases','snap_limit_m'} or type(c['cases'])!=list or not 1<=len(c['cases'])<=10000: raise ValueError('corpus schema')
 ids=[]; inside=0; outside=0
 for x in c['cases']:
  if type(x)!=dict or set(x)!={'id','in_coverage','baseline','candidate'}: raise ValueError('case schema')
  if type(x['id'])!=str or not x['id'] or len(x['id'])>128 or type(x['in_coverage'])!=bool: raise ValueError('case id or coverage')
  ids.append(x['id']); inside+=int(x['in_coverage']); outside+=int(not x['in_coverage'])
 if len(ids)!=len(set(ids)): raise ValueError('duplicate case id')
 if type(m['case_count'])!=int or m['case_count']!=len(ids): raise ValueError('case count')
 v=m['coverage']
 if type(v)!=dict or set(v)!={'declared_inside','declared_outside','method','geometry_verified'}: raise ValueError('coverage schema')
 if type(v['declared_inside'])!=int or type(v['declared_outside'])!=int or v['declared_inside']!=inside or v['declared_outside']!=outside: raise ValueError('coverage counts')
 if v['method']!='synthetic-declaration' or v['geometry_verified'] is not False: raise ValueError('unsubstantiated geometry claim')
 if m['corpus_sha256']!=digest(c) or m['case_ids_sha256']!=digest(ids): raise ValueError('integrity mismatch')
 return {'integrity_verified':True,'synthetic_coverage_counts_verified':True,'geographic_coverage_verified':False,'producer_authenticated':False,'case_count':len(ids),'declared_inside':inside,'declared_outside':outside}
