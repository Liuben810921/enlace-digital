import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawn} from 'node:child_process';import {Ledger} from './idempotency-ledger.mjs';
const dir=mkdtempSync(join(tmpdir(),'ed-idem-')),file=join(dir,'ledger.sqlite'),payload={from:'A',to:'B'},result={distanceMeters:4200};let count=0;
const check=(actual,expected)=>{assert.deepEqual(actual,expected);count++};
try{
 let q=new Ledger(file);check(q.begin('operation-001',payload).status,'RESERVED');check(q.begin('operation-001',payload).reason,'IN_PROGRESS_OR_UNKNOWN');check(q.begin('operation-001',{from:'A',to:'C'}).status,'CONFLICT');check(q.finish('operation-001',payload,result).status,'DONE');check(q.begin('operation-001',payload),{status:'REUSED',result});check(q.finish('operation-001',payload,result),{status:'REUSED',result});check(q.stats(),{used:1,reserved:0});q.close();
 q=new Ledger(file);check(q.begin('operation-001',payload),{status:'REUSED',result});check(q.begin('operation-002',payload).status,'RESERVED');q.close();
 q=new Ledger(file);check(q.begin('operation-002',payload).reason,'IN_PROGRESS_OR_UNKNOWN');check(q.uncertain('operation-002').reason,'UNKNOWN_CONSUMED');check(q.begin('operation-002',payload).reason,'IN_PROGRESS_OR_UNKNOWN');check(q.stats(),{used:2,reserved:0});check(q.begin('operation-003',payload).reason,'QUOTA');q.close();
 const concurrencyFile=join(dir,'race.sqlite');q=new Ledger(concurrencyFile,{limit:2});q.close();
 const spawnOne=()=>new Promise((resolve,reject)=>{const js=`import {Ledger} from ${JSON.stringify(new URL('./idempotency-ledger.mjs',import.meta.url).href)};const l=new Ledger(process.argv[1],{limit:2});console.log(JSON.stringify(l.begin('shared-operation',{from:'A',to:'B'})));l.close();`;const p=spawn(process.execPath,['--input-type=module','-e',js,concurrencyFile],{stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>c?reject(new Error(err)):resolve(JSON.parse(out.trim())));});
 const race=await Promise.all(Array.from({length:20},()=>spawnOne()));check(race.filter(x=>x.status==='RESERVED').length,1);check(race.filter(x=>x.reason==='IN_PROGRESS_OR_UNKNOWN').length,19);
 q=new Ledger(concurrencyFile,{limit:2});check(q.stats(),{used:0,reserved:1});check(q.finish('shared-operation',payload,result).status,'DONE');check(q.begin('shared-operation',payload),{status:'REUSED',result});q.close();
 q=new Ledger(join(dir,'closed.sqlite'));q.close();check(q.begin('operation-closed',payload).status,'PENDIENTE');
 console.log('PASS '+count+' idempotency assertions; 20 processes: 1 reserved, 19 joined/pending');
}finally{rmSync(dir,{recursive:true,force:true})}
