import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
export const digest=p=>createHash('sha256').update(JSON.stringify(p)).digest('hex');
export class Ledger{
 constructor(file,{limit=2,now=()=>Date.now()}={}){this.db=new DatabaseSync(file);this.db.exec('PRAGMA busy_timeout=5000');this.now=now;this.limit=limit;this.db.exec("CREATE TABLE IF NOT EXISTS quotas(day TEXT PRIMARY KEY,used INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0);CREATE TABLE IF NOT EXISTS ops(id TEXT PRIMARY KEY,day TEXT NOT NULL,hash TEXT NOT NULL,state TEXT NOT NULL,result TEXT)")}
 begin(id,payload){if(typeof id!=='string'||! /^[a-zA-Z0-9_-]{8,80}$/.test(id)||!payload||typeof payload!=='object'||Array.isArray(payload))return {status:'PENDIENTE',reason:'INVALID'};const hash=digest(payload),day=new Date(this.now()).toISOString().slice(0,10);
 try{this.db.exec('BEGIN IMMEDIATE');const p=this.db.prepare('SELECT hash,state,result FROM ops WHERE id=?').get(id);if(p){this.db.exec('COMMIT');if(p.hash!==hash)return {status:'CONFLICT'};return p.state==='DONE'?{status:'REUSED',result:JSON.parse(p.result)}:{status:'PENDIENTE',reason:'IN_PROGRESS_OR_UNKNOWN'}}
 this.db.prepare('INSERT OR IGNORE INTO quotas(day) VALUES(?)').run(day);const q=this.db.prepare('SELECT used,reserved FROM quotas WHERE day=?').get(day);if(q.used+q.reserved>=this.limit){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'QUOTA'}}
 this.db.prepare('UPDATE quotas SET reserved=reserved+1 WHERE day=?').run(day);this.db.prepare("INSERT INTO ops(id,day,hash,state,result) VALUES(?,?,?,'RESERVED',NULL)").run(id,day,hash);this.db.exec('COMMIT');return {status:'RESERVED'}
 }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}}
 finish(id,payload,result){if(!result||typeof result!=='object'||!Number.isFinite(result.distanceMeters)||result.distanceMeters<=0)return {status:'PENDIENTE',reason:'INVALID_RESULT'};
 try{this.db.exec('BEGIN IMMEDIATE');const p=this.db.prepare('SELECT * FROM ops WHERE id=?').get(id);if(!p||p.hash!==digest(payload)){this.db.exec('ROLLBACK');return {status:'CONFLICT'}}if(p.state==='DONE'){this.db.exec('COMMIT');return {status:'REUSED',result:JSON.parse(p.result)}}if(p.state!=='RESERVED'){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'UNKNOWN'}}
 this.db.prepare('UPDATE quotas SET reserved=reserved-1,used=used+1 WHERE day=?').run(p.day);this.db.prepare("UPDATE ops SET state='DONE',result=? WHERE id=?").run(JSON.stringify(result),id);this.db.exec('COMMIT');return {status:'DONE',result}
 }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}}
 uncertain(id){try{this.db.exec('BEGIN IMMEDIATE');const p=this.db.prepare('SELECT day,state FROM ops WHERE id=?').get(id);if(!p||p.state!=='RESERVED'){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'UNKNOWN'}}this.db.prepare('UPDATE quotas SET reserved=reserved-1,used=used+1 WHERE day=?').run(p.day);this.db.prepare("UPDATE ops SET state='UNKNOWN_CONSUMED' WHERE id=?").run(id);this.db.exec('COMMIT');return {status:'PENDIENTE',reason:'UNKNOWN_CONSUMED'}}catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}}
 stats(day=new Date(this.now()).toISOString().slice(0,10)){const r=this.db.prepare('SELECT used,reserved FROM quotas WHERE day=?').get(day);return r?{used:r.used,reserved:r.reserved}:{used:0,reserved:0}}
 close(){this.db.close()}
}
