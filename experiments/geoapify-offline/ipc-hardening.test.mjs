import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,lstatSync,unlinkSync,rmSync,chmodSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startBroker,request} from './ipc-broker.mjs';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};const root=mkdtempSync(join(tmpdir(),'ed-hardening-'));const dir=join(root,'safe');mkdirSync(dir,{mode:0o700});const socket=join(dir,'broker.sock'),db=join(dir,'state.sqlite');
async function denied(){let failed=false;try{const b=await startBroker({socketPath:socket,dbPath:db,authorized:{t:'test-A'}});await b.close()}catch{failed=true}eq(failed,true)}
try{
 const victim=join(root,'victim');writeFileSync(victim,'SENTINEL');symlinkSync(victim,socket);await denied();eq(readFileSync(victim,'utf8'),'SENTINEL');eq(lstatSync(socket).isSymbolicLink(),true);unlinkSync(socket);
 writeFileSync(socket,'SENTINEL');await denied();eq(readFileSync(socket,'utf8'),'SENTINEL');unlinkSync(socket);
 chmodSync(dir,0o777);await denied();chmodSync(dir,0o700);
 const broker=await startBroker({socketPath:socket,dbPath:db,authorized:{t:'test-A'}});eq('db' in broker,false);eq('audit' in broker,false);eq(Object.isFrozen(broker),true);eq((await request(socket,{op:'start',token:'t',version:'legacy',id:'operation-0001',payload:{a:1}})).status,'RESERVED');await broker.close();eq(lstatSync(dir).isDirectory(),true);
 const reopened=await startBroker({socketPath:socket,dbPath:db,authorized:{t:'test-A'}});eq((await request(socket,{op:'start',token:'t',version:'legacy',id:'operation-0001',payload:{a:1}})).reason,'ALREADY_TRACKED');await reopened.close();
 console.log('PASS '+n+' socket hardening assertions');
}finally{rmSync(root,{recursive:true,force:true})}
