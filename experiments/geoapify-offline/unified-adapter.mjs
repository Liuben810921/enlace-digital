import {SharedQuota} from './shared-quota.mjs';
import {operationHash} from './idempotency-norm-v2.mjs';
import {createHash} from 'node:crypto';
export class UnifiedAdapter {
 constructor(file,{limit=2,clock=()=>Date.now()}={}){this.quota=new SharedQuota(file,{limit,clock});this.db=this.quota.db;this.db.exec('CREATE TABLE IF NOT EXISTS unified_identity(version TEXT NOT NULL,op_id TEXT NOT NULL,principal TEXT NOT NULL,hash TEXT NOT NULL,PRIMARY KEY(version,op_id))')}
 start({version,id,principal,payload}){
  if(!['legacy','NORM-v2'].includes(version)||typeof principal!=='string'||!principal.trim())return {status:'PENDIENTE',reason:'INVALID'};
  let hash;try{hash=version==='NORM-v2'?operationHash(principal,payload):createHash('sha256').update(JSON.stringify({principal,payload})).digest('hex')}catch{return {status:'PENDIENTE',reason:'INVALID'}}
  try{
   this.db.exec('BEGIN IMMEDIATE');
   const row=this.db.prepare('SELECT principal,hash FROM unified_identity WHERE version=? AND op_id=?').get(version,id);
   if(row){this.db.exec('COMMIT');return row.principal===principal&&row.hash===hash?{status:'PENDIENTE',reason:'ALREADY_TRACKED'}:{status:'CONFLICT'}}
   if(typeof id!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(id)){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'INVALID'}}
   const day=new Date(this.quota.clock()).toISOString().slice(0,10);
   const tracked=this.db.prepare('SELECT state FROM shared_operations WHERE version=? AND op_id=?').get(version,id);
   if(tracked){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'ORPHAN_REQUIRES_RECONCILIATION'}}
   this.db.prepare('INSERT OR IGNORE INTO shared_credits(day) VALUES(?)').run(day);
   const q=this.db.prepare('SELECT used,reserved FROM shared_credits WHERE day=?').get(day);
   if(q.used+q.reserved>=this.quota.limit){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'QUOTA'}}
   this.db.prepare('UPDATE shared_credits SET reserved=reserved+1 WHERE day=?').run(day);
   this.db.prepare("INSERT INTO shared_operations VALUES(?,?,?,'RESERVED')").run(version,id,day);
   this.db.prepare('INSERT INTO unified_identity VALUES(?,?,?,?)').run(version,id,principal,hash);
   this.db.exec('COMMIT');return {status:'RESERVED'};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 finish({version,id,known=false}){return this.quota.settle(version,id,{known})}
 stats(){return this.quota.stats()}
 close(){this.quota.close()}
}
