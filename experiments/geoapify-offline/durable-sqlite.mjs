import {DatabaseSync} from 'node:sqlite';
import {createHmac,timingSafeEqual} from 'node:crypto';
const mac=(key,s)=>createHmac('sha256',key).update(s).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
export const fixtureSession=(key,user,expires)=>({user,expires,signature:mac(key,user+'|'+expires)});
export class QuotaLab {
 constructor({file=':memory:',key='fixture-only',limit=3000,clock=()=>Date.now()}={}) {
  if(!Number.isSafeInteger(limit)||limit<1)throw Error('limit');
  this.db=new DatabaseSync(file);this.key=key;this.limit=limit;this.clock=clock;
  this.db.exec('CREATE TABLE IF NOT EXISTS credits(day TEXT PRIMARY KEY,used INTEGER NOT NULL,reserved INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS requests(nonce TEXT PRIMARY KEY,day TEXT NOT NULL,state TEXT NOT NULL,credits INTEGER NOT NULL)');
 }
 valid(s){return !!s&&typeof s.user==='string'&&s.user.length>0&&Number.isSafeInteger(s.expires)&&s.expires>this.clock()&&equal(s.signature,mac(this.key,s.user+'|'+s.expires))}
 reserve({session,nonce,credits=1}={}){
  if(!this.valid(session))return {status:'PENDIENTE',reason:'AUTH'};
  if(typeof nonce!=='string'||!/^[a-zA-Z0-9_-]{8,100}$/.test(nonce)||!Number.isSafeInteger(credits)||credits<1||credits>this.limit)return {status:'PENDIENTE',reason:'INVALID'};
  const day=new Date(this.clock()).toISOString().slice(0,10);
  try{
   this.db.exec('BEGIN IMMEDIATE');
   if(this.db.prepare('SELECT nonce FROM requests WHERE nonce=?').get(nonce)){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'REPLAY'}}
   this.db.prepare('INSERT OR IGNORE INTO credits VALUES(?,0,0)').run(day);
   const r=this.db.prepare('SELECT used,reserved FROM credits WHERE day=?').get(day);
   if(r.used+r.reserved+credits>this.limit){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'QUOTA'}}
   this.db.prepare('UPDATE credits SET reserved=reserved+? WHERE day=?').run(credits,day);
   this.db.prepare('INSERT INTO requests VALUES(?,?,?,?)').run(nonce,day,'RESERVED',credits);
   this.db.exec('COMMIT');return {status:'RESERVED',nonce};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 settle(nonce,{success=false}={}){
  try{
   this.db.exec('BEGIN IMMEDIATE');
   const r=this.db.prepare('SELECT day,state,credits FROM requests WHERE nonce=?').get(nonce);
   if(!r||r.state!=='RESERVED'){this.db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'REPLAY_OR_UNKNOWN'}}
   this.db.prepare('UPDATE credits SET reserved=reserved-?,used=used+? WHERE day=?').run(r.credits,r.credits,r.day);
   this.db.prepare('UPDATE requests SET state=? WHERE nonce=?').run(success?'CONSUMED':'UNKNOWN_CONSUMED',nonce);
   this.db.exec('COMMIT');return {status:success?'CONSUMED':'PENDIENTE'};
  }catch{try{this.db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 stats(day=new Date(this.clock()).toISOString().slice(0,10)){const r=this.db.prepare('SELECT used,reserved FROM credits WHERE day=?').get(day);return r?{used:r.used,reserved:r.reserved}:{used:0,reserved:0}}
 close(){this.db.close()}
}
