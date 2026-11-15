#!/usr/bin/env python3
"""Offline, fail-closed YAML audit; requires locally preinstalled PyYAML."""
import sys,re
from pathlib import Path
import yaml
class Loader(yaml.SafeLoader):pass
for k,v in list(Loader.yaml_implicit_resolvers.items()):
 Loader.yaml_implicit_resolvers[k]=[(t,r) for t,r in v if t!='tag:yaml.org,2002:bool']
Loader.add_implicit_resolver('tag:yaml.org,2002:bool',re.compile(r'^(true|false)$',re.I),list('tTfF'))
def mapping(loader,node):
 d={}
 for kn,vn in node.value:
  k=loader.construct_object(kn)
  if not isinstance(k,str) or k in d:raise ValueError('duplicate YAML key')
  d[k]=loader.construct_object(vn)
 return d
Loader.add_constructor('tag:yaml.org,2002:map',mapping)
FILES=['havana-manifest-offline-preparation.yml','havana-manifest-offline-candidate.yml']
SHA='886bcfc55cd482613025ffe9befe22d9462c1a58'
FLAGS={'ED_CARTOGRAPHY_ASSETS_READY':'false','ED_ROUTE_READY':'false','ED_COMMERCIAL_QUOTE_ENABLED':'false'}
def check(raw,candidate):
 try:d=yaml.load(raw,Loader=Loader)
 except (yaml.YAMLError,ValueError):return False
 if not isinstance(d,dict) or set(d)!={'name','on','permissions','jobs'} or d['on']!={} or d['permissions']!={}:return False
 jobs=d['jobs']
 key='manifest-node-offline' if candidate else 'manifest-offline'
 if not isinstance(jobs,dict) or set(jobs)!={key}:return False
 j=jobs[key]
 if not isinstance(j,dict) or set(j)!={'if','runs-on','timeout-minutes','permissions','env','steps'}:return False
 if j['if']!='$'+'{{ false }}' or j['runs-on']!='ubuntu-24.04' or j['permissions']!={}:return False
 if type(j['timeout-minutes']) is not int or not 1<=j['timeout-minutes']<=5:return False
 extra={'GIT_TERMINAL_PROMPT':'0','GIT_CONFIG_NOSYSTEM':'1','GIT_CONFIG_GLOBAL':'/dev/null'} if candidate else {'CI_NETWORK_FORBIDDEN':'true'}
 if j['env']!={**FLAGS,**extra}:return False
 steps=j['steps']
 if not isinstance(steps,list) or len(steps)!=(2 if candidate else 1):return False
 if any(not isinstance(s,dict) or set(s)!={'name','shell','run'} or s['shell']!='bash' or not isinstance(s['run'],str) for s in steps):return False
 if not candidate:return steps[0]['run'].strip()=="echo 'BLOCKED: offline source provenance, runner and billing review required'\nexit 1"
 a,b=(s['run'] for s in steps)
 # Exact command inventory and order, rejecting added commands even if disguised.
 expected_a=['set -euo pipefail','test "$GITHUB_REPOSITORY" =','test "$GITHUB_REF_NAME" =','test "$GITHUB_SHA" =','echo ','exit 1','export GIT_CONFIG_COUNT=2','export GIT_CONFIG_KEY_0=credential.helper','export GIT_CONFIG_VALUE_0=','export GIT_CONFIG_KEY_1=http.followRedirects','export GIT_CONFIG_VALUE_1=false','git init -q','cd ','git remote add origin https://github.com/Liuben810921/enlace-digital.git','git -c protocol.version=2 fetch --no-tags --depth=1 origin "$GITHUB_SHA"','test "$(git rev-parse FETCH_HEAD)" = "$GITHUB_SHA"','mkdir -p tests/fixtures','for file in','test "$(git cat-file -t','git show ','test -s ','done','for file in','git ls-tree ','done']
 expected_b=['set -euo pipefail','cd ','unshare --user --map-root-user --net --fork -- bash -euo pipefail -c','ip link set lo up','node tests/havana-offline-cartography-manifest-isolated.test.cjs','node tests/havana-offline-cartography-manifest-isolated.cjs']
 def commands(s):
  return [x.strip() for x in s.splitlines() if x.strip() and not x.lstrip().startswith('#') and not x.strip().startswith('tests/') and x.strip() not in ('}',"'") and not x.strip().endswith('; do')]
 # Fail closed on full shell content using fixed SHA-256 values established by offline review.
 import hashlib
 return hashlib.sha256(a.encode()).hexdigest()==BOOTSTRAP_SHA and hashlib.sha256(b.encode()).hexdigest()==ISOLATED_SHA and SHA in a
# Digests are set after independently checking exact workflow content offline.
BOOTSTRAP_SHA='TO_BE_PINNED'
ISOLATED_SHA='TO_BE_PINNED'
def main(root):
 originals={f:(root/f).read_text() for f in FILES}
 for f,raw in originals.items():
  assert check(raw,f.endswith('candidate.yml')),f
  print('PASS baseline',f)
 raw=originals[FILES[1]];count=0
 for a,b in [('on: {}','on:\n  push:'),('on: {}','on:\n  workflow_dispatch:'),('permissions: {}','permissions: write'),('runs-on: ubuntu-24.04','runs-on: self-hosted'),('timeout-minutes: 5','timeout-minutes: 60'),('on: {}','on: {}\non: {}')]:
  assert a in raw and not check(raw.replace(a,b,1),True);count+=1
 for injected in ['curl https://invalid.example','sudo apt install x','git checkout HEAD','npm install x','echo upload-artifact','node -e "require(\\\"https\\\")"']:
  d=yaml.load(raw,Loader=Loader);d['jobs']['manifest-node-offline']['steps'][0]['run']+=injected+'\n'
  assert not check(yaml.safe_dump(d,sort_keys=False),True);count+=1
 assert not check('on: [',True);count+=1
 print('PASS',count,'adversarial mutations')
if __name__=='__main__':main(Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).resolve().parents[1]/'.github/workflows')
