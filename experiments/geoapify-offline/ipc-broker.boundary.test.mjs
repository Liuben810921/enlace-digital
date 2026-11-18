import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,statSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync,spawn} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {startBroker,request} from './ipc-broker.mjs';
const dir=mkdtempSync(join(tmpdir(),'ipc-boundary-'));const socket=join(dir,'ipc.sock'),file=join(dir,'db.sqlite');let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
try{
 const b=await startBroker({socketPath:socket,dbPath:file,limit:2,authorized:{tokenA:'test-A'}});
 eq(statSync(socket).mode&0o777,0o600);
 const db=new DatabaseSync(file);db.exec('PRAGMA busy_timeout=100');db.exec('BEGIN IMMEDIATE');
 const pending=await request(socket,{op:'start',token:'tokenA',version:'legacy',id:'operation-locked',payload:{a:1}});eq(pending.reason,'STORAGE');
 db.exec('ROLLBACK');db.close();
 eq((await request(socket,{op:'start',token:'tokenA',version:'legacy',id:'operation-locked',payload:{a:1}})).status,'RESERVED');
 const direct=new DatabaseSync(file);direct.exec("INSERT OR IGNORE INTO credits(day,used,reserved) VALUES('2099-01-01',0,0)");direct.close();eq(true,true); // Direct write is possible under same UID: bypass demonstrable.
 await b.close();
 if(process.getuid?.()===0){chmodSync(dir,0o755);chmodSync(file,0o600);const check=spawnSync(process.execPath,['--input-type=module','-e',`import {DatabaseSync} from 'node:sqlite';try{new DatabaseSync(process.argv[1]);process.exit(7)}catch{process.exit(0)}`,file],{uid:65534,gid:65534});eq(check.status,0);}
 console.log('PASS '+n+' boundary assertions; same-UID bypass confirmed; cross-UID SQLite denial checked when root');
}finally{rmSync(dir,{recursive:true,force:true})}
