import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync,symlinkSync,unlinkSync,chmodSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startRotatingBroker,resolveSocket,requestCurrent} from './ipc-rotation.mjs';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};const dir=mkdtempSync(join(tmpdir(),'ed-rotation-'));const db=join(dir,'quota.sqlite');const token='synthetic';const args={directory:dir,dbPath:db,limit:2,authorized:{[token]:'test-A'}};
try{
 let a=await startRotatingBroker(args);const first=a.socketPath;eq(resolveSocket(dir),first);eq((await requestCurrent(dir,{op:'start',token,version:'legacy',id:'operation-0001',payload:{a:1}})).status,'RESERVED');await a.close();eq((await requestCurrent(dir,{op:'stats',token})).reason,'IPC');eq(resolveSocket(dir),null);
 const b=await startRotatingBroker(args);eq(b.socketPath!==first,true);eq(resolveSocket(dir),b.socketPath);eq((await requestCurrent(dir,{op:'start',token,version:'legacy',id:'operation-0001',payload:{a:1}})).reason,'ALREADY_TRACKED');eq((await requestCurrent(dir,{op:'start',token,version:'NORM-v2',id:'operation-0002',payload:{a:2}})).status,'RESERVED');eq((await requestCurrent(dir,{op:'start',token,version:'legacy',id:'operation-0003',payload:{a:3}})).reason,'QUOTA');
 const manifest=join(dir,'current.json');unlinkSync(manifest);symlinkSync(first,manifest);eq(resolveSocket(dir),null);eq((await requestCurrent(dir,{op:'stats',token})).reason,'IPC');unlinkSync(manifest);writeFileSync(manifest,JSON.stringify({version:1,socket:'../victim'}));eq(resolveSocket(dir),null);unlinkSync(manifest);
 await b.close();chmodSync(dir,0o777);let refused=false;try{await startRotatingBroker(args)}catch{refused=true}eq(refused,true);chmodSync(dir,0o700);
 const c=await startRotatingBroker(args);eq(c.socketPath!==first,true);eq(resolveSocket(dir),c.socketPath);await c.close();console.log('PASS '+n+' rotation assertions; no stale socket unlinked');
}finally{rmSync(dir,{recursive:true,force:true})}
