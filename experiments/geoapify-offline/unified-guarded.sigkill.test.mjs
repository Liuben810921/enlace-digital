import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GuardedQuota} from './unified-guarded.mjs';
let n=0;const check=(a,b)=>{assert.deepEqual(a,b);n++};
const dir=mkdtempSync(join(tmpdir(),'guarded-kill-'));
const op={version:'NORM-v2',id:'operation-kill-001',principal:'synthetic-A',payload:{a:1}};
const url=new URL('./unified-guarded.mjs',import.meta.url).href;
const killAt=(file,code)=>new Promise((resolve,reject)=>{
 const script='import {GuardedQuota} from '+JSON.stringify(url)+';const g=new GuardedQuota(process.argv[1],{limit:2});'+code+";console.log('READY');setInterval(()=>{},1000)";
 const p=spawn(process.execPath,['--input-type=module','-e',script,file],{stdio:['ignore','pipe','pipe']});let out='',err='',killed=false;
 p.stdout.on('data',d=>{out+=d;if(!killed&&out.includes('READY')){killed=true;p.kill('SIGKILL')}});
 p.stderr.on('data',d=>err+=d);p.on('error',reject);
 p.on('close',(c,s)=>s==='SIGKILL'?resolve():reject(Error(JSON.stringify({c,s,out,err}))));
});
function audit(g){const rows=g.db.prepare('SELECT day,used,reserved FROM shared_credits').all();for(const r of rows){const s=g.db.prepare('SELECT state,COUNT(*) AS n FROM global_ops WHERE day=? GROUP BY state').all(r.day);const count=k=>s.filter(x=>x.state===k).reduce((a,x)=>a+x.n,0);check(r.used,count('CONSUMED')+count('UNKNOWN_CONSUMED'));check(r.reserved,count('RESERVED'));assert.ok(r.used>=0&&r.reserved>=0&&r.used+r.reserved<=2);n++}check(g.db.prepare('PRAGMA integrity_check').get().integrity_check,'ok')}
try{
 const file=join(dir,'quota.sqlite');let g=new GuardedQuota(file,{limit:2});g.close();
 await killAt(file,"g.db.exec('BEGIN IMMEDIATE');g.db.prepare('INSERT INTO shared_credits(day,used,reserved) VALUES(?,0,1)').run('2099-01-01')");
 g=new GuardedQuota(file,{limit:2});check(g.db.prepare("SELECT COUNT(*) AS n FROM shared_credits WHERE day='2099-01-01'").get().n,0);check(g.start(op).status,'RESERVED');audit(g);g.close();
 await killAt(file,"g.db.exec('BEGIN IMMEDIATE');g.db.prepare('UPDATE shared_credits SET used=1,reserved=0').run();g.db.prepare(\"UPDATE global_ops SET state='CONSUMED'\").run()");
 g=new GuardedQuota(file,{limit:2});check(g.stats(),{used:0,reserved:1});audit(g);g.close();
 await killAt(file,"g.finish({version:'NORM-v2',id:'operation-kill-001',principal:'synthetic-A',payload:{a:1},known:true})");
 g=new GuardedQuota(file,{limit:2});check(g.stats(),{used:1,reserved:0});check(g.finish({...op,known:true}).reason,'REPLAY');audit(g);g.close();
 await killAt(file,"g.start({version:'legacy',id:'operation-kill-002',principal:'synthetic-B',payload:{x:2}})");
 g=new GuardedQuota(file,{limit:2});check(g.stats(),{used:1,reserved:1});check(g.start({version:'legacy',id:'operation-kill-002',principal:'synthetic-B',payload:{x:2}}).reason,'ALREADY_TRACKED');audit(g);g.close();
 console.log('PASS '+n+' SIGKILL and SQLite invariant assertions; 4 SIGKILL barriers');
}finally{rmSync(dir,{recursive:true,force:true})}
