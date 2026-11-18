import {DatabaseSync} from 'node:sqlite';
export class SharedQuota {
 constructor(file,{limit=2,clock=()=>Date.now()}={}){
  if(!Number.isSafeInteger(limit)||limit<1)throw Error('INVALID_LIMIT');
  this.db=new DatabaseSync(file);this.db.exec('PRAGMA busy_timeout=5000');this.limit=limit;this.clock=clock;
  this.db.exec(`CREATE TABLE IF NOT EXISTS shared_credits(day TEXT PRIMARY KEY, used INTEGER NOT NULL DEFAULT 0, reserved INTEGER NOT NULL DEFAULT 0, CHECK(used>=0 AND reserved>=0));CREATE TABLE IF NOT EXISTS shared_operations(version TEXT NOT NULL, op_id TEXT NOT NULL, day TEXT NOT NULL, state TEXT NOT NULL, PRIMARY KEY(version,op_id));`);
 }
 reserve(version,opId){
  if(!['legacy','NORM-v2'].includes(version)||typeof opId!=='string'||!/^[a-zA-Z0-9_-]{8,80}$/.test(opId))return {status:'PENDIENTE',reason:'INVALID'};
  let day;try{day=new Date(this.clock()).toISOString().slice(0,10)}catch{return {status:'PENDIENTE',reason:'CLOCK'}}
  try{
   this.db.exec('BEGIN IMMEDIATE');
   const prior=this.db.prepare('SELECT state FROM shared_operations WHERE version=? AND op_id=?').get(version,opId);
   if(prior){this.db.exec('COMMIT');return {status:'PENDIENTE',reason:'ALREADY_TRACKED',state:prior.state}}
   this.db.prepare('INSERT OR IGNORE INTO shared_credits(day) VALUES(?)').run(day);
   const row=this.db.prepare('SELECT used,reserved FROM shared_credits WHERE day=?').get(day);
   if(row.used+row.reserved>=this.limit){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'QUOTA'}}
   this.db.prepare('UPDATE shared_credits SET reserved=reserved+1 WHERE day=?').run(day);
   this.db.prepare("INSERT INTO shared_operations VALUES(?,?,?,'RESERVED')").run(version,opId,day);
   this.db.exec('COMMIT');return {status:'RESERVED'};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 settle(version,opId,{known=false}={}){
  try{
   this.db.exec('BEGIN IMMEDIATE');
   const row=this.db.prepare('SELECT day,state FROM shared_operations WHERE version=? AND op_id=?').get(version,opId);
   if(!row||row.state!=='RESERVED'){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'UNKNOWN_OR_REPLAY'}}
   this.db.prepare('UPDATE shared_credits SET reserved=reserved-1,used=used+1 WHERE day=?').run(row.day);
   this.db.prepare('UPDATE shared_operations SET state=? WHERE version=? AND op_id=?').run(known?'CONSUMED':'UNKNOWN_CONSUMED',version,opId);
   this.db.exec('COMMIT');return {status:known?'CONSUMED':'PENDIENTE',reason:known?undefined:'UNKNOWN_CONSUMED'};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 stats(){try{const day=new Date(this.clock()).toISOString().slice(0,10),row=this.db.prepare('SELECT used,reserved FROM shared_credits WHERE day=?').get(day);return row?{used:row.used,reserved:row.reserved}:{used:0,reserved:0}}catch{return null}}
 close(){this.db.close()}
}
