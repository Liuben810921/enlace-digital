import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,chmodSync,writeFileSync,readFileSync,symlinkSync,unlinkSync,rmSync,lstatSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startCrossRotation,resolveCrossRotation} from './ipc-cross-rotation.mjs';
const root=mkdtempSync(join(tmpdir(),'ed-manifest-'));
const directory=join(root,'ipc'), privateDir=join(root,'private'), dbPath=join(privateDir,'quota.sqlite');
const manifest=join(directory,'current.json');
const identity={owner:process.getuid(),group:process.getgid()};
let n=0;
const eq=(a,b)=>{assert.deepEqual(a,b);n++};
try {
 mkdirSync(directory,{mode:0o750});mkdirSync(privateDir,{mode:0o700});
 const broker=await startCrossRotation({directory,dbPath,...identity,authorized:{synthetic:'test-A'}});
 const original=readFileSync(manifest);
 eq(resolveCrossRotation(directory,identity),broker.socketPath);
 const victim=join(root,'victim');writeFileSync(victim,'SENTINEL');
 unlinkSync(manifest);symlinkSync(victim,manifest);
 eq(resolveCrossRotation(directory,identity),null);
 eq(readFileSync(victim,'utf8'),'SENTINEL');
 unlinkSync(manifest);
 for(const payload of ['not-json',JSON.stringify({version:1,socket:'../victim'}),JSON.stringify({version:2,socket:'ipc-'+ 'a'.repeat(32)+'.sock'})]){
  writeFileSync(manifest,payload,{mode:0o640});eq(resolveCrossRotation(directory,identity),null);unlinkSync(manifest);
 }
 writeFileSync(manifest,original,{mode:0o640});chmodSync(manifest,0o666);
 eq(resolveCrossRotation(directory,identity),null);
 chmodSync(manifest,0o640);eq(resolveCrossRotation(directory,identity),broker.socketPath);
 chmodSync(directory,0o770);eq(resolveCrossRotation(directory,identity),null);
 chmodSync(directory,0o750);eq(resolveCrossRotation(directory,identity),broker.socketPath);
 await broker.close();
 console.log(`PASS ${n} manifest adversarial assertions`);
} finally {rmSync(root,{recursive:true,force:true})}
