import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,chmodSync,writeFileSync,readFileSync,symlinkSync,linkSync,unlinkSync,rmSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {startCrossRotation} from './ipc-cross-rotation.mjs';
let count=0;const eq=(a,b)=>{assert.deepEqual(a,b);count++};
const root=mkdtempSync(join(tmpdir(),'ed-lock-')),dir=join(root,'ipc'),privateDir=join(root,'private'),db=join(privateDir,'quota.sqlite'),lock=join(privateDir,'broker-owner-lock.sqlite');
const opts={directory:dir,dbPath:db,owner:process.getuid(),group:process.getgid(),authorized:{synthetic:'test-A'}};
async function rejected(){let fail=false;try{const b=await startCrossRotation(opts);await b.close()}catch{fail=true}eq(fail,true)}
try{
 mkdirSync(dir,{mode:0o750});mkdirSync(privateDir,{mode:0o700});
 const victim=join(root,'victim');writeFileSync(victim,'DO NOT CHANGE');symlinkSync(victim,lock);await rejected();eq(readFileSync(victim,'utf8'),'DO NOT CHANGE');eq(lstatSync(lock).isSymbolicLink(),true);unlinkSync(lock);
 mkdirSync(lock);await rejected();eq(lstatSync(lock).isDirectory(),true);rmSync(lock,{recursive:true});
 writeFileSync(lock,'not sqlite',{mode:0o666});chmodSync(lock,0o666);await rejected();eq(lstatSync(lock).mode&0o777,0o666);unlinkSync(lock);
 const first=await startCrossRotation(opts);eq(lstatSync(lock).mode&0o777,0o600);await rejected();await first.close();
 const second=await startCrossRotation(opts);eq(typeof second.socketPath,'string');await second.close();
 console.log('PASS '+count+' lock-path adversarial assertions');
}finally{rmSync(root,{recursive:true,force:true})}
