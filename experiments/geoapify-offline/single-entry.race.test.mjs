import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createSingleEntry} from './single-entry.mjs';
const dir=mkdtempSync(join(tmpdir(),'ed-entry-race-'));let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
try{const file=join(dir,'db.sqlite');let g=createSingleEntry(file,{limit:3});g.close();
 const run=i=>new Promise((resolve,reject)=>{const script=`import {createSingleEntry} from ${JSON.stringify(new URL('./single-entry.mjs',import.meta.url).href)};const g=createSingleEntry(process.argv[1],{limit:3});const t=g.issueSyntheticPrincipal('test-user');console.log(JSON.stringify(g.start(t,{version:Number(process.argv[2])%2?'legacy':'NORM-v2',id:'operation-'+String(process.argv[2]).padStart(4,'0'),payload:{x:1}})));g.close();`;const p=spawn(process.execPath,['--input-type=module','-e',script,file,String(i)],{stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',c=>c?reject(Error(err)):resolve(JSON.parse(out.trim())))});
 const r=await Promise.all(Array.from({length:24},(_,i)=>run(i)));eq(r.filter(x=>x.status==='RESERVED').length,3);eq(r.filter(x=>x.reason==='QUOTA').length,21);g=createSingleEntry(file,{limit:3});eq(g.stats(),{used:0,reserved:3});g.close();console.log('PASS '+n+' single-entry race assertions; 24 processes, 3 reserved, 21 quota')
}finally{rmSync(dir,{recursive:true,force:true})}
