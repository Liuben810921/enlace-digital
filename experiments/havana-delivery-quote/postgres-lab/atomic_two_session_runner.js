'use strict';
// NOT EXECUTED. Node >=18, psql on PATH, pre-created disposable local DB ONLY.
// Required: LAB_ADMIN_URL and LAB_POOL_URL (separate local credentials).
// Usage: node atomic_two_session_runner.js approve commit
//        node atomic_two_session_runner.js revoke rollback
// EACH run requires a FRESH empty disposable DB. Never use production.
const {spawn,spawnSync}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const dir=__dirname;
const [action,mode]=process.argv.slice(2);
assert.ok(['approve','revoke'].includes(action),'action must be approve/revoke');
assert.ok(['commit','rollback'].includes(mode),'mode must be commit/rollback');
const admin=process.env.LAB_ADMIN_URL,pool=process.env.LAB_POOL_URL;
assert.ok(admin&&pool,'LAB_ADMIN_URL and LAB_POOL_URL required');
for(const u of [admin,pool]) {
 const x=new URL(u);
 assert.ok(['localhost','127.0.0.1','::1'].includes(x.hostname),'only local disposable PostgreSQL permitted');
}
const psqlArgs=(url,extra=[])=>['-X','-w','-v','ON_ERROR_STOP=1','-d',url,...extra];
function run(url,sql,extra=[]) {
 const r=spawnSync('psql',psqlArgs(url,['-A','-t',...extra,'-c',sql]),{encoding:'utf8',timeout:30000});
 if(r.error||r.status!==0)throw Error('psql failed: '+(r.stderr||r.error));
 return r.stdout.trim();
}
function file(url,name,extra=[]) {
 const r=spawnSync('psql',psqlArgs(url,[...extra,'-f',path.join(dir,name)]),{encoding:'utf8',timeout:30000});
 if(r.error||r.status!==0)throw Error(name+': '+(r.stderr||r.error));
}
function session(name,id,nonce) {
 return spawn('psql',psqlArgs(pool,['-A','-t','-v','intent_id='+id,'-v','nonce_hash='+nonce,'-f',path.join(dir,name)]),{stdio:['ignore','pipe','pipe']});
}
function done(p) {
 return new Promise((resolve,reject)=>{
  let out='',err='';
  p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);
  p.on('error',reject);
  p.on('close',code=>code===0?resolve(out):reject(Error(err||'psql exit '+code)));
 });
}
(async()=>{
 // Fail closed: schema must not exist. Only a disposable empty database is accepted.
 const exists=run(admin,"SELECT count(*) FROM pg_namespace WHERE nspname IN ('ed_delivery_lab','ed_delivery_intent_lab')");
 assert.equal(exists,'0','database not empty: use a fresh disposable DB');
 for(const n of ['manual_approval.sql','shared_pool_intents.sql','shared_pool_atomic_lab.sql','atomic_disposable_roles.sql','atomic_two_connections_setup.sql'])file(admin,n);
 if(action==='revoke')file(admin,'atomic_revocation_fixture.sql');
 file(admin,'atomic_permission_assertions.sql');
 const operation=action==='approve'?'synthetic-op-1':'synthetic-revoke-1';
 const rows=run(admin,"SELECT intent_id||'|'||nonce_hash FROM ed_delivery_intent_lab.intents WHERE operation_id='"+operation+"'");
 assert.match(rows,/^\d+\|[0-9a-f]{64}$/,'one fixture intent required');
 const [id,nonce]=rows.split('|');
 const a=session(mode==='commit'?'atomic_session_A_commit.sql':'atomic_session_A_rollback.sql',id,nonce);
 const aDone=done(a);
 // A is guaranteed to have entered pg_sleep only after the result row is emitted.
 // For stronger synchronization inspect pg_stat_activity or add an advisory handshake.
 await new Promise((resolve,reject)=>{
  let output='';const timeout=setTimeout(()=>reject(Error('A did not produce result')),5000);
  a.stdout.on('data',chunk=>{output+=chunk;if(output.includes('LAB_APPLIED_ONLY')){clearTimeout(timeout);resolve();}});
  a.on('close',()=>{clearTimeout(timeout);reject(Error('A exited before signal'));});
 });
 const b=session('atomic_session_B.sql',id,nonce);
 const [ao,bo]=await Promise.all([aDone,done(b)]);
 assert.match(ao,/LAB_APPLIED_ONLY/,'A must apply in transaction');
 assert.match(bo,new RegExp(mode==='commit'?'PENDIENTE':'LAB_APPLIED_ONLY'),'B outcome mismatch');
 file(admin,'atomic_postconditions_assert.sql',['-v','operation_id='+operation]);
 const replay=run(pool,"SET ROLE ed_intent_pool; SELECT ed_delivery_intent_lab.apply_intent("+id+",'"+nonce+"')");
 assert.match(replay,/PENDIENTE/,'replay must be rejected');
 console.log('PASS synthetic '+action+' '+mode+' (PostgreSQL executed by operator)');
})().catch(e=>{console.error('FAIL:',e.message);process.exitCode=1});
