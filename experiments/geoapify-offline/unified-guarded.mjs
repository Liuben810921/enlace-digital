import {SharedQuota} from './shared-quota.mjs';
import {operationHash} from './idempotency-norm-v2.mjs';
export class GuardedQuota {
 constructor(file,{limit=2,clock=()=>Date.now()}={}){this.quota=new SharedQuota(file,{limit,clock});this.db=this.quota.db;this.db.exec("CREATE TABLE IF NOT EXISTS global_ops(op_id TEXT PRIMARY KEY,version TEXT NOT NULL,principal TEXT NOT NULL,hash TEXT NOT NULL,day TEXT NOT NULL,state TEXT NOT NULL)")}
 start({version,id,principal,payload}){
  if(!['legacy','NORM-v2'].includes(version)||typeof id!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(id)||typeof principal!=='string'||!principal.trim())return {status:'PENDIENTE',reason:'INVALID'};
  let hash,day;try{hash=operationHash(principal,payload);day=new Date(this.quota.clock()).toISOString().slice(0,10)}catch{return {status:'PENDIENTE',reason:'INVALID'}}
  try{this.db.exec('BEGIN IMMEDIATE');
   const p=this.db.prepare('SELECT * FROM global_ops WHERE op_id=?').get(id);
   if(p){this.db.exec('COMMIT');return p.version===version&&p.principal===principal&&p.hash===hash?{status:'PENDIENTE',reason:'ALREADY_TRACKED'}:{status:'CONFLICT'}}
   this.db.prepare('INSERT OR IGNORE INTO shared_credits(day) VALUES(?)').run(day);
   const q=this.db.prepare('SELECT used,reserved FROM shared_credits WHERE day=?').get(day);
   if(q.used+q.reserved>=this.quota.limit){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'QUOTA'}}
   this.db.prepare('UPDATE shared_credits SET reserved=reserved+1 WHERE day=?').run(day);
   this.db.prepare("INSERT INTO global_ops VALUES(?,?,?,?,?,'RESERVED')").run(id,version,principal,hash,day);
   this.db.exec('COMMIT');return {status:'RESERVED'};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 finish({version,id,principal,payload,known=false}){
  let hash;try{hash=operationHash(principal,payload)}catch{return {status:'PENDIENTE',reason:'INVALID'}}
  try{this.db.exec('BEGIN IMMEDIATE');const p=this.db.prepare('SELECT * FROM global_ops WHERE op_id=?').get(id);
   if(!p||p.version!==version||p.principal!==principal||p.hash!==hash){this.db.exec('ROLLBACK');return {status:'CONFLICT'}}
   if(p.state!=='RESERVED'){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'REPLAY'}}
   this.db.prepare('UPDATE shared_credits SET used=used+1,reserved=reserved-1 WHERE day=?').run(p.day);
   this.db.prepare('UPDATE global_ops SET state=? WHERE op_id=?').run(known?'CONSUMED':'UNKNOWN_CONSUMED',id);
   this.db.exec('COMMIT');return known?{status:'CONSUMED'}:{status:'PENDIENTE',reason:'UNKNOWN_CONSUMED'};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 stats(){return this.quota.stats()}
 close(){this.quota.close()}
}
