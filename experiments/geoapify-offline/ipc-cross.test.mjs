import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,chmodSync,chownSync,statSync,readFileSync,writeFileSync,symlinkSync,unlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {resolveCrossRotation} from './ipc-cross-rotation.mjs';
const root=mkdtempSync(join(tmpdir(),'ed-cross-')),ipc=join(root,'ipc'),privateDir=join(root,'private'),db=join(privateDir,'db.sqlite'),lock=join(privateDir,'owner.lock');let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};let p;
const ownerScript=new URL('./ipc-cross-owner.mjs',import.meta.url).pathname,clientScript=new URL('./ipc-cross-client.mjs',import.meta.url).pathname;
function client(mode,id){const r=spawnSync(process.execPath,[clientScript,ipc,db,mode,id],{uid:65534,gid:65534,encoding:'utf8',timeout:5000});if(r.status!==0)throw Error(r.stderr);return JSON.parse(r.stdout)}
async function start(){return new Promise((resolve,reject)=>{p=spawn('flock',['-n','-F',lock,process.execPath,ownerScript,ipc,db],{uid:65533,gid:65534,stdio:['ignore','pipe','pipe']});let err='';p.stderr.on('data',d=>err+=d);p.stdout.on('data',d=>{if(d.toString().includes('READY'))resolve()});p.once('error',reject);p.once('exit',c=>reject(Error('early exit '+c+' '+err)))})}
async function kill(){const child=p;p=null;child.kill('SIGKILL');const signal=await new Promise(r=>child.once('exit',(_,s)=>r(s)));eq(signal,'SIGKILL')}
try{
 if(process.getuid()!==0)throw Error('REQUIRES_ROOT_TEST_RUNNER');chmodSync(root,0o711);mkdirSync(ipc);chownSync(ipc,65533,65534);chmodSync(ipc,0o750);mkdirSync(privateDir);chownSync(privateDir,65533,65534);chmodSync(privateDir,0o700);
 await start();eq(statSync(ipc).mode&0o777,0o750);const first=resolveCrossRotation(ipc,{owner:65533,group:65534});eq(typeof first,'string');eq(statSync(first).mode&0o777,0o660);eq(client('direct').denied,true);eq(client('legacy','operation-0001').status,'RESERVED');
 const contender=spawnSync('flock',['-n','-F',lock,process.execPath,ownerScript,ipc,db],{uid:65533,gid:65534,encoding:'utf8',timeout:3000});eq(contender.status!==0,true);eq(resolveCrossRotation(ipc,{owner:65533,group:65534}),first);
 const manifest=join(ipc,'current.json');const original=readFileSync(manifest);unlinkSync(manifest);symlinkSync('/etc/passwd',manifest);eq(resolveCrossRotation(ipc,{owner:65533,group:65534}),null);unlinkSync(manifest);writeFileSync(manifest,original,{mode:0o640});chownSync(manifest,65533,65534);eq(resolveCrossRotation(ipc,{owner:65533,group:65534}),first);
 await kill();eq(client('legacy','operation-0001').reason,'IPC');await start();const second=resolveCrossRotation(ipc,{owner:65533,group:65534});eq(second!==first,true);eq(client('legacy','operation-0001').reason,'ALREADY_TRACKED');eq(client('NORM-v2','operation-0002').status,'RESERVED');eq(client('legacy','operation-0003').reason,'QUOTA');
 const runs=await Promise.all(Array.from({length:12},(_,i)=>new Promise((resolve,reject)=>{const c=spawn(process.execPath,[clientScript,ipc,db,i%2?'legacy':'NORM-v2',`operation-race-${i}`],{uid:65534,gid:65534,stdio:['ignore','pipe','pipe']});let out='',err='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>err+=d);c.on('error',reject);c.on('close',code=>code?reject(Error(err)):resolve(JSON.parse(out)))})));eq(runs.filter(x=>x.reason==='QUOTA').length,12);
 console.log(`PASS ${n} cross-UID rotation assertions; 12 concurrent processes`);
}finally{if(p)p.kill('SIGKILL');rmSync(root,{recursive:true,force:true})}
