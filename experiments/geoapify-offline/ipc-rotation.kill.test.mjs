import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {spawn} from 'node:child_process';
import {requestCurrent,resolveSocket} from './ipc-rotation.mjs';
const dir=mkdtempSync(join(tmpdir(),'ed-rotate-kill-'));const db=join(dir,'quota.sqlite');const token='synthetic';let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++};
const script=`import {startRotatingBroker} from ${JSON.stringify(new URL('./ipc-rotation.mjs',import.meta.url).href)};await startRotatingBroker({directory:process.argv[1],dbPath:process.argv[2],limit:2,authorized:{synthetic:'test-A'}});console.log('READY')`;
async function start(){const p=spawn(process.execPath,['--input-type=module','-e',script,dir,db],{stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let e='';p.stderr.on('data',d=>e+=d);p.stdout.once('data',resolve);p.once('exit',c=>reject(Error('early '+c+' '+e)))});return p}
async function kill(p){p.kill('SIGKILL');const sig=await new Promise(resolve=>p.once('exit',(_,s)=>resolve(s)));eq(sig,'SIGKILL')}
let p;
try{
 p=await start();const first=resolveSocket(dir);eq(typeof first,'string');const op={op:'start',token,version:'legacy',id:'operation-0001',payload:{x:1}};eq((await requestCurrent(dir,op)).status,'RESERVED');await kill(p);eq((await requestCurrent(dir,op)).reason,'IPC');eq(statSync(first).isSocket(),true);
 p=await start();const second=resolveSocket(dir);eq(second!==first,true);eq(statSync(first).isSocket(),true);eq((await requestCurrent(dir,op)).reason,'ALREADY_TRACKED');
 const calls=Array.from({length:24},(_,i)=>requestCurrent(dir,{op:'start',token,version:i%2?'legacy':'NORM-v2',id:'operation-race-'+String(i).padStart(3,'0'),payload:{i}}));const r=await Promise.all(calls);eq(r.filter(x=>x.status==='RESERVED').length,1);eq(r.filter(x=>x.reason==='QUOTA').length,23);await kill(p);p=null;console.log('PASS '+count+' SIGKILL rotation and concurrency assertions; 24 requests');
}finally{if(p)p.kill('SIGKILL');rmSync(dir,{recursive:true,force:true})}
