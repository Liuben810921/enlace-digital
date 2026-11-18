import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,chmodSync,chownSync,statSync,readFileSync,writeFileSync,symlinkSync,unlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
const root=mkdtempSync(join(tmpdir(),'ed-physical-')),ipc=join(root,'ipc'),privateDir=join(root,'private'),db=join(privateDir,'quota.sqlite');
const ownerScript=new URL('./ipc-cross-launch.sh',import.meta.url).pathname,clientScript=new URL('./ipc-unprivileged-probe.mjs',import.meta.url).pathname,ownerModule=new URL('./ipc-cross-rotation.mjs',import.meta.url).pathname;
let p,n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
function probe(mode,id){const r=spawnSync(process.execPath,[clientScript,ipc,db,ownerModule,mode,id],{uid:65534,gid:65534,encoding:'utf8',timeout:6000});if(r.status!==0)throw Error('probe '+r.status+' '+r.stderr);return JSON.parse(r.stdout)}
async function start(){return new Promise((resolve,reject)=>{p=spawn('sh',[ownerScript,ipc,db],{uid:65533,gid:65534,stdio:['ignore','pipe','pipe']});let err='';p.stderr.on('data',d=>err+=d);p.stdout.once('data',()=>resolve());p.once('error',reject);p.once('exit',c=>reject(Error('owner exited '+c+' '+err)))})}
async function kill(){const child=p;p=null;child.kill('SIGKILL');eq(await new Promise(resolve=>child.once('exit',(_,signal)=>resolve(signal))),'SIGKILL')}
try{
 eq(process.getuid(),0);chmodSync(root,0o711);mkdirSync(ipc);chownSync(ipc,65533,65534);chmodSync(ipc,0o750);mkdirSync(privateDir);chownSync(privateDir,65533,65534);chmodSync(privateDir,0o700);
 await start();eq(statSync(ipc).mode&0o777,0o750);eq(probe('read-db').denied,true);
 const outsider=spawnSync(process.execPath,['--input-type=module','-e',"import net from 'node:net';const s=net.createConnection(process.argv[1]);s.on('connect',()=>process.exit(7));s.on('error',()=>process.exit(0))",join(ipc,JSON.parse(readFileSync(join(ipc,'current.json'),'utf8')).socket),],{uid:65532,gid:65532,timeout:4000});eq(outsider.status,0);
 const attempt=probe('import-owner');eq(attempt.started,false);
 eq(probe('legacy','operation-0001').status,'RESERVED');
 const contender=spawnSync('sh',[ownerScript,ipc,db],{uid:65533,gid:65534,encoding:'utf8',timeout:4000});eq(contender.status!==0,true);
 const manifest=join(ipc,'current.json'),original=readFileSync(manifest);unlinkSync(manifest);symlinkSync('/etc/passwd',manifest);eq(probe('legacy','operation-0009').reason,'IPC');unlinkSync(manifest);writeFileSync(manifest,original,{mode:0o640});chownSync(manifest,65533,65534);
 eq(probe('legacy','operation-0001').reason,'ALREADY_TRACKED');await kill();eq(probe('legacy','operation-0001').reason,'IPC');
 await start();eq(probe('legacy','operation-0001').reason,'ALREADY_TRACKED');eq(probe('NORM-v2','operation-0002').status,'RESERVED');
 const jobs=await Promise.all(Array.from({length:12},(_,i)=>new Promise((resolve,reject)=>{const c=spawn(process.execPath,[clientScript,ipc,db,ownerModule,i%2?'legacy':'NORM-v2',`operation-race-${i}`],{uid:65534,gid:65534,stdio:['ignore','pipe','pipe']});let out='',err='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>err+=d);c.on('error',reject);c.on('close',code=>code?reject(Error(err)):resolve(JSON.parse(out)))})));
 eq(jobs.filter(x=>x.reason==='QUOTA').length,12);
 console.log(`PASS ${n} physical UID isolation assertions; 12 concurrent clients`);
}finally{if(p)p.kill('SIGKILL');rmSync(root,{recursive:true,force:true})}
