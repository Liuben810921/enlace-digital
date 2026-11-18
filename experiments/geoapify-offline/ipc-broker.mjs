import net from 'node:net';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {chmodSync,unlinkSync} from 'node:fs';
const MAX=8192;
function canonical(v){if(v===null)return 'null';if(typeof v==='string')return JSON.stringify(v.normalize('NFC'));if(typeof v==='boolean')return String(v);if(typeof v==='number'&&Number.isFinite(v))return JSON.stringify(Object.is(v,-0)?0:v);if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v&&typeof v==='object'&&Object.getPrototypeOf(v)===Object.prototype){const m=new Map();for(const k of Object.keys(v)){const n=k.normalize('NFC');if(m.has(n)||['__proto__','constructor','prototype'].includes(n))throw Error('INVALID');m.set(n,v[k])}return '{'+[...m.keys()].sort().map(k=>JSON.stringify(k)+':'+canonical(m.get(k))).join(',')+'}'}throw Error('INVALID')}
function hash(principal,payload){return createHash('sha256').update('NORM-v2:'+canonical({identity:principal,payload})).digest('hex')}
export async function startBroker({socketPath,dbPath,limit=2,clock=()=>Date.now(),authorized={}}){
 if(!Number.isSafeInteger(limit)||limit<1)throw Error('INVALID_LIMIT');
 const db=new DatabaseSync(dbPath);db.exec('PRAGMA busy_timeout=100');db.exec('CREATE TABLE IF NOT EXISTS credits(day TEXT PRIMARY KEY,used INTEGER NOT NULL DEFAULT 0,reserved INTEGER NOT NULL DEFAULT 0,CHECK(used>=0 AND reserved>=0));CREATE TABLE IF NOT EXISTS ops(id TEXT PRIMARY KEY,version TEXT NOT NULL,principal TEXT NOT NULL,hash TEXT NOT NULL,day TEXT NOT NULL,state TEXT NOT NULL)');
 const credentials=new Map(Object.entries(authorized));
 function audit(){const days=db.prepare('SELECT day,used,reserved FROM credits').all();for(const d of days){const x=db.prepare("SELECT SUM(CASE WHEN state='RESERVED' THEN 1 ELSE 0 END) AS r,SUM(CASE WHEN state IN ('CONSUMED','UNKNOWN_CONSUMED') THEN 1 ELSE 0 END) AS u FROM ops WHERE day=?").get(d.day);if(d.reserved!==Number(x.r??0)||d.used!==Number(x.u??0)||d.used+d.reserved>limit)throw Error('INVARIANT')}if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('CORRUPT')}
 try{audit()}catch(e){db.close();throw e}
 function run(req){if(!req||typeof req!=='object'||Array.isArray(req)||!['start','finish','stats'].includes(req.op))return {status:'PENDIENTE',reason:'INVALID'};
  if(typeof req.token!=='string'||!credentials.has(req.token))return {status:'PENDIENTE',reason:'UNAUTHORIZED'};
  const principal=credentials.get(req.token);if(req.op==='stats'){try{audit();const day=new Date(clock()).toISOString().slice(0,10);const r=db.prepare('SELECT used,reserved FROM credits WHERE day=?').get(day);return {status:'OK',used:r?.used??0,reserved:r?.reserved??0}}catch{return {status:'PENDIENTE',reason:'STORAGE'}}}
  if(!['legacy','NORM-v2'].includes(req.version)||typeof req.id!=='string'||!/^[A-Za-z0-9_-]{8,80}$/.test(req.id)||typeof req.known!=='undefined'&&typeof req.known!=='boolean')return {status:'PENDIENTE',reason:'INVALID'};
  let digest,day;try{digest=hash(principal,req.payload);day=new Date(clock()).toISOString().slice(0,10)}catch{return {status:'PENDIENTE',reason:'INVALID'}}
  try{db.exec('BEGIN IMMEDIATE');const row=db.prepare('SELECT * FROM ops WHERE id=?').get(req.id);
   if(req.op==='start'){
    if(row){db.exec('COMMIT');return row.version===req.version&&row.principal===principal&&row.hash===digest?{status:'PENDIENTE',reason:'ALREADY_TRACKED'}:{status:'CONFLICT'}}
    db.prepare('INSERT OR IGNORE INTO credits(day) VALUES(?)').run(day);const q=db.prepare('SELECT used,reserved FROM credits WHERE day=?').get(day);if(q.used+q.reserved>=limit){db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'QUOTA'}}
    db.prepare('UPDATE credits SET reserved=reserved+1 WHERE day=?').run(day);db.prepare("INSERT INTO ops VALUES(?,?,?,?,?,'RESERVED')").run(req.id,req.version,principal,digest,day);db.exec('COMMIT');return {status:'RESERVED'};
   }
   if(!row||row.version!==req.version||row.principal!==principal||row.hash!==digest){db.exec('ROLLBACK');return {status:'CONFLICT'}}
   if(row.state!=='RESERVED'){db.exec('ROLLBACK');return {status:'PENDIENTE',reason:'REPLAY'}}
   db.prepare('UPDATE credits SET used=used+1,reserved=reserved-1 WHERE day=?').run(row.day);db.prepare('UPDATE ops SET state=? WHERE id=?').run(req.known?'CONSUMED':'UNKNOWN_CONSUMED',req.id);db.exec('COMMIT');return req.known?{status:'CONSUMED'}:{status:'PENDIENTE',reason:'UNKNOWN_CONSUMED'};
  }catch{try{db.exec('ROLLBACK')}catch{}return {status:'PENDIENTE',reason:'STORAGE'}}
 }
 try{unlinkSync(socketPath)}catch(e){if(e.code!=='ENOENT'){db.close();throw e}}
 const server=net.createServer(socket=>{let buf='';socket.setTimeout(2000,()=>socket.destroy());socket.on('data',data=>{buf+=data.toString('utf8');if(Buffer.byteLength(buf)>MAX){socket.end(JSON.stringify({status:'PENDIENTE',reason:'TOO_LARGE'})+'\n');return}if(buf.includes('\n')){const [line,...rest]=buf.split('\n');if(rest.join('').trim()){socket.end(JSON.stringify({status:'PENDIENTE',reason:'INVALID'})+'\n');return}let result;try{result=run(JSON.parse(line))}catch{result={status:'PENDIENTE',reason:'INVALID'}}socket.end(JSON.stringify(result)+'\n')}})});
 try{await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socketPath,resolve)});chmodSync(socketPath,0o600)}catch(e){db.close();throw e}
 return {close:()=>new Promise(resolve=>server.close(()=>{db.close();try{unlinkSync(socketPath)}catch{}resolve()})),audit,db};
}
export function request(socketPath,body,{timeout=3000}={}){return new Promise(resolve=>{let settled=false;const finish=x=>{if(!settled){settled=true;resolve(x)}};const s=net.createConnection(socketPath);s.setTimeout(timeout,()=>s.destroy());let data='';s.on('connect',()=>s.end(JSON.stringify(body)+'\n'));s.on('data',b=>data+=b);s.on('end',()=>{try{finish(JSON.parse(data.trim()))}catch{finish({status:'PENDIENTE',reason:'IPC'})}});s.on('error',()=>finish({status:'PENDIENTE',reason:'IPC'}));s.on('close',()=>finish({status:'PENDIENTE',reason:'IPC'}))})}
