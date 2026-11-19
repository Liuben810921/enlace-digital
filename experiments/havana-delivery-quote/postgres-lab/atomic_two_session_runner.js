'use strict';
// NOT EXECUTED. Node >=18, psql on PATH, pre-created disposable local DB ONLY.
// Required: LAB_ADMIN_URL and LAB_POOL_URL (separate local credentials).
// Usage: node atomic_two_session_runner.js approve commit
//        node atomic_two_session_runner.js revoke rollback
// EACH run requires a FRESH disposable CLUSTER and empty DB. Never use production.
const {spawn,spawnSync}=require('node:child_process');
const path=require('node:path');
const assert=require('node:assert/strict');
const dir=__dirname;
const active=new Set();
const cleanEnv={...process.env};
for(const key of Object.keys(cleanEnv)) if(key.startsWith('PG')) delete cleanEnv[key];
// Only explicit connection URLs may select a PostgreSQL target.
function track(p){active.add(p);p.once('close',()=>active.delete(p));return p;}
function terminate(){for(const p of active){if(p.exitCode===null && !p.killed) p.kill('SIGTERM');}}
function forceStopAfterGrace(){const t=setTimeout(()=>{for(const p of active){if(p.exitCode===null) p.kill('SIGKILL');}},1500);t.unref();}
process.once('SIGINT',()=>{terminate();forceStopAfterGrace();process.exitCode=130;});
process.once('SIGTERM',()=>{terminate();forceStopAfterGrace();process.exitCode=143;});
const [action,mode]=process.argv.slice(2);
assert.equal(process.argv.length,4,'exactly two arguments required');
assert.ok(['approve','revoke'].includes(action),'action must be approve/revoke');
assert.ok(['commit','rollback'].includes(mode),'mode must be commit/rollback');
assert.equal(process.env.LAB_DISPOSABLE_CLUSTER_ACK,'YES_DISCARD_WHOLE_CLUSTER','explicit disposable-cluster acknowledgment required');
const admin=process.env.LAB_ADMIN_URL,pool=process.env.LAB_POOL_URL;
assert.ok(admin&&pool,'LAB_ADMIN_URL and LAB_POOL_URL required');
for(const u of [admin,pool]) {
 const x=new URL(u);
 assert.equal(x.protocol,'postgresql:','PostgreSQL URI required');
 assert.ok(['localhost','127.0.0.1','[::1]'].includes(x.hostname),'only local disposable PostgreSQL permitted');
 assert.ok(x.pathname.length>1,'explicit disposable database name required');
}
const psqlArgs=(url,extra=[])=>['-X','-w','-v','ON_ERROR_STOP=1','-d',url,...extra];
function run(url,sql,extra=[],timeoutMs=30000) {
 const r=spawnSync('psql',psqlArgs(url,['-A','-t',...extra,'-c',sql]),{encoding:'utf8',timeout:timeoutMs,env:cleanEnv});
 if(r.error||r.status!==0)throw Error('psql query failed (status '+r.status+', timedOut='+Boolean(r.error)+')');
 return r.stdout.trim();
}
function file(url,name,extra=[]) {
 const r=spawnSync('psql',psqlArgs(url,[...extra,'-f',path.join(dir,name)]),{encoding:'utf8',timeout:30000,env:cleanEnv});
 if(r.error||r.status!==0)throw Error(name+': psql failed (status '+r.status+', timeout='+Boolean(r.error)+')');
}
function session(name,id,nonce) {
 return track(spawn('psql',psqlArgs(pool,['-A','-t','-v','intent_id='+id,'-v','nonce_hash='+nonce,'-f',path.join(dir,name)]),{stdio:['ignore','pipe','pipe'],env:cleanEnv}));
}
function done(p) {
 return new Promise((resolve,reject)=>{
  let out='',err='';
  const timer=setTimeout(()=>{p.kill('SIGTERM');forceStopAfterGrace();reject(Error('psql session exceeded 35s'));},35000);
  p.stdout.on('data',x=>out+=x);p.stderr.on('data',x=>err+=x);
  p.on('error',e=>{clearTimeout(timer);reject(e);});
  p.on('close',code=>{clearTimeout(timer);code===0?resolve(out):reject(Error('psql session exit '+code));});
 });
}
(async()=>{
 // Fail closed: schema must not exist. Only a disposable empty database is accepted.
 const db=run(admin,'SELECT current_database()');
 assert.ok(!['postgres','template0','template1'].includes(db),'system database forbidden');
 assert.equal(db,run(pool,'SELECT current_database()'),'admin/pool must use same database');
 assert.equal(run(pool,'SELECT session_user'),'ed_intent_test_pool','pool must use pre-provisioned test login');
 assert.notEqual(run(admin,'SELECT session_user'),run(pool,'SELECT session_user'),'admin and pool must use distinct login identities');
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
 aDone.catch(()=>{}); // keep early rejection observed until Promise.all
 // A is guaranteed to have entered pg_sleep only after the result row is emitted.
 // For stronger synchronization inspect pg_stat_activity or add an advisory handshake.
 await new Promise((resolve,reject)=>{
  let output='';const timeout=setTimeout(()=>reject(Error('A did not produce result')),5000);
  a.stdout.on('data',chunk=>{output+=chunk;if(output.includes('A_LOCK_HELD')){clearTimeout(timeout);resolve();}});
  a.on('close',()=>{clearTimeout(timeout);reject(Error('A exited before signal'));});
 });
 const b=session('atomic_session_B.sql',id,nonce);
 const bDone=done(b);bDone.catch(()=>{});
 // Observe a real PostgreSQL wait-for edge: B must be blocked by A.
 // DBA needs pg_stat_activity visibility on this disposable database.
 let blocked=false;
 const deadline=Date.now()+9000;
 while(Date.now()<deadline){
  const state=run(admin,`SELECT count(*) FROM pg_stat_activity b
    JOIN pg_stat_activity a ON a.datname=b.datname
    WHERE b.application_name='ed_atomic_lab_b'
      AND a.application_name='ed_atomic_lab_a'
      AND a.pid = ANY(pg_blocking_pids(b.pid))
      AND b.wait_event_type='Lock'`,[],2000);
  if(state==='1'){blocked=true;break;}
  if(b.exitCode!==null||a.exitCode!==null)break;
  await new Promise(resolve=>setTimeout(resolve,150));
 }
 assert.ok(blocked,'No PostgreSQL lock wait B<-A observed; result is inconclusive');
 const [ao,bo]=await Promise.all([aDone,bDone]);
 const exactResult=(output,expected,label)=> {
  const lines=output.split(/\r?\n/).map(x=>x.trim());
  assert.ok(lines.includes(expected),label+' expected exact '+expected);
  assert.ok(!lines.includes(expected==='PENDIENTE'?'LAB_APPLIED_ONLY':'PENDIENTE'),label+' contradictory result');
 };
 exactResult(ao,'LAB_APPLIED_ONLY','A');
 exactResult(bo,mode==='commit'?'PENDIENTE':'LAB_APPLIED_ONLY','B');
 file(admin,'atomic_postconditions_assert.sql',['-v','operation_id='+operation]);
 const replay=run(pool,"SET ROLE ed_intent_pool; SELECT ed_delivery_intent_lab.apply_intent("+id+",'"+nonce+"')");
 assert.equal(replay.split(/\r?\n/).map(x=>x.trim()).at(-1),'PENDIENTE','replay must be rejected');
 console.log('PASS synthetic '+action+' '+mode+' (PostgreSQL executed by operator)');
})().catch(e=>{terminate();forceStopAfterGrace();console.error('FAIL:',e.message);process.exitCode=1});
