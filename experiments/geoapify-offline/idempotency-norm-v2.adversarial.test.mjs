import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {LedgerV2,operationHash} from './idempotency-norm-v2.mjs';import {parseStrictJson} from './strict-json-v2.mjs';import {Ledger} from './idempotency-ledger.mjs';
let n=0;const ok=x=>{assert.ok(x);n++},dir=mkdtempSync(join(tmpdir(),'ed-v2-adv-'));
try{
 const invalid=['{"a":1,"\\u0061":2}','{"e\\u0301":1,"é":2}','{"nested":{"x":1,"x":2}}','{"x":1,}','[1,]','{"x":1} garbage','{"x":01}','{"x":1e9999}'];
 for(const s of invalid){let rejected=false;try{parseStrictJson(s)}catch{rejected=true}ok(rejected)}
 ok(operationHash('person-A',{a:1,b:2})===operationHash('person-A',{b:2,a:1}));
 ok(operationHash('person-A',{a:1})!==operationHash('person-B',{a:1}));
 const file=join(dir,'race.sqlite');let q=new LedgerV2(file,{limit:2});q.close();
 const one=()=>new Promise((resolve,reject)=>{const js=`import {LedgerV2} from ${JSON.stringify(new URL('./idempotency-norm-v2.mjs',import.meta.url).href)};const q=new LedgerV2(process.argv[1],{limit:2});console.log(JSON.stringify(q.begin('same-operation','synthetic-user',{b:2,a:1})));q.close();`;const p=spawn(process.execPath,['--input-type=module','-e',js,file],{stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>c?reject(new Error(err)):resolve(JSON.parse(out.trim())))});
 const race=await Promise.all(Array.from({length:20},()=>one()));ok(race.filter(x=>x.status==='RESERVED').length===1);ok(race.filter(x=>x.reason==='IN_PROGRESS_OR_UNKNOWN').length===19);
 q=new LedgerV2(file,{limit:2});ok(q.stats().reserved===1);ok(q.finish('same-operation','synthetic-user',{a:1,b:2},{distanceMeters:3200}).status==='DONE');q.close();q=new LedgerV2(file,{limit:2});ok(q.begin('same-operation','synthetic-user',{a:1,b:2}).status==='REUSED');ok(q.begin('same-operation','different-user',{a:1,b:2}).status==='CONFLICT');q.close();
 const mixed=join(dir,'mixed.sqlite');let old=new Ledger(mixed,{limit:2});ok(old.begin('legacy-operation',{x:1}).status==='RESERVED');old.close();q=new LedgerV2(mixed,{limit:2});ok(q.begin('v2-operation','synthetic-user',{x:1}).status==='RESERVED');q.close();old=new Ledger(mixed,{limit:2});ok(old.begin('legacy-operation',{x:1}).reason==='IN_PROGRESS_OR_UNKNOWN');old.close();
 console.log('PASS '+n+' adversarial assertions; 20 processes 1 reserved, 19 pending; legacy and v2 tables coexist');
}finally{rmSync(dir,{recursive:true,force:true})}
