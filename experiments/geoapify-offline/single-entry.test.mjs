import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSingleEntry} from './single-entry.mjs';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};const dir=mkdtempSync(join(tmpdir(),'ed-entry-'));
try{
 const file=join(dir,'quota.sqlite');let day=Date.UTC(2026,10,18,23,59);let g=createSingleEntry(file,{limit:2,clock:()=>day});const t=g.issueSyntheticPrincipal('test-alice');const t2=g.issueSyntheticPrincipal('test-bob');const op={version:'legacy',id:'global-0001',payload:{a:1}};
 eq(g.start('wrong',op).reason,'UNAUTHORIZED');eq(g.start(t,op).status,'RESERVED');eq(g.start(t2,op).status,'CONFLICT');eq(g.finish(t2,{...op,known:true}).status,'CONFLICT');eq(g.stats(),{used:0,reserved:1});
 day+=120000;eq(g.start(t,{version:'NORM-v2',id:'global-0002',payload:{x:1}}).status,'RESERVED');eq(g.stats(),{used:0,reserved:1});eq(g.finish(t,{...op,known:true}).status,'CONSUMED');eq(g.stats(),{used:0,reserved:1});eq(g.finish(t,{version:'NORM-v2',id:'global-0002',payload:{x:1}}).reason,'UNKNOWN_CONSUMED');eq(g.stats(),{used:1,reserved:0});g.close();
 g=createSingleEntry(file,{limit:2,clock:()=>day});eq(g.start(t,{version:'legacy',id:'global-0003',payload:{a:1}}).reason,'UNAUTHORIZED');const t3=g.issueSyntheticPrincipal('test-alice');eq(g.start(t3,{version:'legacy',id:'global-0003',payload:{a:1}}).status,'RESERVED');eq(g.stats(),{used:1,reserved:1});g.close();
 const locked=join(dir,'locked.sqlite');let l=createSingleEntry(locked,{limit:1});l.close();
 const child=spawn(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';const db=new DatabaseSync(process.argv[1]);db.exec('BEGIN IMMEDIATE');console.log('LOCKED');setInterval(()=>{},1000)`,locked],{stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject)});
 l=createSingleEntry(locked,{limit:1});l.issueSyntheticPrincipal('test-lock');
 const lockedToken=l.issueSyntheticPrincipal('test-locked');eq(l.start(lockedToken,{version:'legacy',id:'global-locked',payload:{a:1}}).status,'PENDIENTE');l.close();child.kill('SIGKILL');await new Promise(r=>child.once('close',r));
 const corrupt=join(dir,'corrupt.sqlite');writeFileSync(corrupt,'not a sqlite database');let rejected=false;try{createSingleEntry(corrupt)}catch{rejected=true}eq(rejected,true);
 console.log('PASS '+n+' single-entry assertions');
}finally{rmSync(dir,{recursive:true,force:true})}
