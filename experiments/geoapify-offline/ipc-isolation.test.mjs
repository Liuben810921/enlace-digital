import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,chmodSync,chownSync,statSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
const root=mkdtempSync(join(tmpdir(),'ed-isolated-'));let n=0;
const check=(a,b)=>{assert.deepEqual(a,b);n++};
const dbdir=join(root,'db'),ipcdir=join(root,'ipc'),db=join(dbdir,'state.sqlite'),sock=join(ipcdir,'broker.sock');
const owner=65533,client=65534;
const script=new URL('./ipc-isolation.owner.mjs',import.meta.url).pathname;
const clientScript=new URL('./ipc-isolation.client.mjs',import.meta.url).pathname;
let p;
function start(){return new Promise((resolve,reject)=>{
 p=spawn(process.execPath,[script,sock,db],{uid:owner,gid:client,stdio:['ignore','pipe','pipe']});let err='';
 p.stderr.on('data',d=>err+=d);p.stdout.on('data',d=>{if(d.toString().includes('READY'))resolve()});p.once('error',reject);p.once('exit',c=>reject(Error('owner exit '+c+' '+err)));
})}
function call(mode,id){const r=spawnSync(process.execPath,[clientScript,sock,db,mode,id],{uid:client,gid:client,encoding:'utf8',timeout:5000});if(r.status!==0)throw Error(r.stderr);return JSON.parse(r.stdout.trim())}
async function kill(){p.kill('SIGKILL');const signal=await new Promise(resolve=>p.once('exit',(_,s)=>resolve(s)));check(signal,'SIGKILL')}
try{
 if(process.getuid?.()!==0)throw Error('NEEDS_ROOT_FOR_NUMERIC_UID_TEST');
 chmodSync(root,0o711);mkdirSync(dbdir,{mode:0o700});chownSync(dbdir,owner,client);chmodSync(dbdir,0o700);mkdirSync(ipcdir,{mode:0o750});chownSync(ipcdir,owner,client);chmodSync(ipcdir,0o750);
 await start();check(statSync(dbdir).mode&0o777,0o700);check(statSync(sock).mode&0o777,0o660);
 const denied=call('direct');check(denied.readDenied,true);check(denied.writeDenied,true);
 check(call('legacy','operation-001').status,'RESERVED');check(call('NORM-v2','operation-002').status,'RESERVED');check(call('legacy','operation-003').reason,'QUOTA');
 await kill();await start();check(call('legacy','operation-001').reason,'ALREADY_TRACKED');check(call('NORM-v2','operation-004').reason,'QUOTA');
 const d=new DatabaseSync(db,{readOnly:true});const rows=d.prepare('SELECT used,reserved FROM credits').all();check(rows.length,1);check(Number(rows[0].reserved),2);check(d.prepare('PRAGMA integrity_check').get().integrity_check,'ok');d.close();
 const r=await Promise.all(Array.from({length:12},(_,i)=>new Promise((resolve,reject)=>{const x=spawn(process.execPath,[clientScript,sock,db,i%2?'legacy':'NORM-v2','operation-race-'+String(i).padStart(3,'0')],{uid:client,gid:client,stdio:['ignore','pipe','pipe']});let o='',e='';x.stdout.on('data',d=>o+=d);x.stderr.on('data',d=>e+=d);x.on('error',reject);x.on('close',c=>c?reject(Error(e)):resolve(JSON.parse(o.trim())))})));
 check(r.filter(x=>x.reason==='QUOTA').length,12);
 console.log('PASS '+n+' cross-UID IPC and SQLite isolation assertions; 12 concurrent clients');
}finally{if(p&&!p.killed)p.kill('SIGKILL');else if(p)p.kill('SIGKILL');rmSync(root,{recursive:true,force:true})}
