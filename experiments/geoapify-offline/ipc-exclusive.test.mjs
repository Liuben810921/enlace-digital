import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,chmodSync,chownSync,readFileSync,writeFileSync,symlinkSync,unlinkSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startCrossRotation,resolveCrossRotation,requestCrossRotation} from './ipc-cross-rotation.mjs';
const root=mkdtempSync(join(tmpdir(),'ed-excl-')),dir=join(root,'ipc'),dbDir=join(root,'db'),db=join(dbDir,'quota.sqlite');let n=0,p;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const worker=new URL('./ipc-cross-rotation.mjs',import.meta.url).href;
const source=`import {startCrossRotation} from ${JSON.stringify(worker)};await startCrossRotation({directory:process.argv[1],dbPath:process.argv[2],owner:65533,group:65534,limit:2,authorized:{synthetic:'test-A'}});console.log('READY')`;
async function start(){return new Promise((resolve,reject)=>{p=spawn(process.execPath,['--input-type=module','-e',source,dir,db],{uid:65533,gid:65534,stdio:['ignore','pipe','pipe']});let err='';p.stderr.on('data',x=>err+=x);p.stdout.once('data',resolve);p.once('error',reject);p.once('exit',c=>reject(Error('early '+c+' '+err)))})}
function contender(){return spawnSync(process.execPath,['--input-type=module','-e',source,dir,db],{uid:65533,gid:65534,encoding:'utf8',timeout:5000})}
async function kill(){const child=p;p=null;child.kill('SIGKILL');const s=await new Promise(resolve=>child.once('exit',(_,signal)=>resolve(signal)));eq(s,'SIGKILL')}
async function client(op,id){return requestCrossRotation(dir,{op,token:'synthetic',version:'legacy',id,payload:{x:1}},{owner:65533,group:65534})}
try{
 eq(process.getuid(),0);chmodSync(root,0o711);mkdirSync(dir);chownSync(dir,65533,65534);chmodSync(dir,0o750);mkdirSync(dbDir);chownSync(dbDir,65533,65534);chmodSync(dbDir,0o700);
 await start();const first=resolveCrossRotation(dir,{owner:65533,group:65534});eq(typeof first,'string');eq(statSync(first).mode&0o777,0o660);
 const second=contender();eq(second.status!==0,true);eq(second.stderr.includes('BROKER_ALREADY_RUNNING'),true);eq(resolveCrossRotation(dir,{owner:65533,group:65534}),first);
 eq((await client('start','operation-0001')).status,'RESERVED');
 const denied=spawnSync(process.execPath,['--input-type=module','-e',`import {openSync} from 'node:fs';try{openSync(process.argv[1],'r');process.exit(7)}catch(e){process.exit(e.code==='EACCES'?0:8)}`,db],{uid:65534,gid:65534});eq(denied.status,0);
 const outsider=spawnSync(process.execPath,['--input-type=module','-e',`import net from 'node:net';const s=net.createConnection(process.argv[1]);s.on('connect',()=>process.exit(7));s.on('error',()=>process.exit(0))`,first],{uid:65532,gid:65532});eq(outsider.status,0);
 const manifest=join(dir,'current.json'),original=readFileSync(manifest);unlinkSync(manifest);symlinkSync('/etc/passwd',manifest);eq(resolveCrossRotation(dir,{owner:65533,group:65534}),null);unlinkSync(manifest);writeFileSync(manifest,original,{mode:0o640});chownSync(manifest,65533,65534);eq(resolveCrossRotation(dir,{owner:65533,group:65534}),first);
 await kill();eq((await client('start','operation-0001')).reason,'IPC');await start();const rotated=resolveCrossRotation(dir,{owner:65533,group:65534});eq(rotated!==first,true);eq((await client('start','operation-0001')).reason,'ALREADY_TRACKED');eq((await client('start','operation-0002')).status,'RESERVED');
 const jobs=await Promise.all(Array.from({length:12},(_,i)=>client('start','operation-race-'+String(i).padStart(3,'0'))));eq(jobs.filter(x=>x.reason==='QUOTA').length,12);
 console.log('PASS '+n+' mandatory SQLite owner lock assertions; 12 concurrent IPC calls');
}finally{if(p)p.kill('SIGKILL');rmSync(root,{recursive:true,force:true})}
