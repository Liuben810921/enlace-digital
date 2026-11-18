import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,lstatSync,statSync,chmodSync,unlinkSync,openSync,closeSync,fstatSync,fchmodSync,constants} from 'node:fs';
import {join,dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {startBroker,request} from './ipc-broker.mjs';
const NAME=/^ipc-[a-f0-9]{32}\.sock$/;
function dirCheck(dir,owner,group){const s=lstatSync(dir);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==owner||s.gid!==group||(s.mode&0o777)!==0o750)throw Error('UNSAFE_DIRECTORY')}
export async function startCrossRotation({directory,dbPath,owner=process.getuid(),group=process.getgid(),authorized={},limit=2}={}){
 dirCheck(directory,owner,group);
 const dbDir=dirname(dbPath), ds=lstatSync(dbDir);
 if(!ds.isDirectory()||ds.isSymbolicLink()||ds.uid!==owner||(ds.mode&0o777)!==0o700)throw Error('UNSAFE_DB_DIRECTORY');
 // Open with O_NOFOLLOW before SQLite sees the path. No chmod(path) on attacker input.
 const lockPath=join(dbDir,'broker-owner-lock.sqlite');
 let fd, lock, broker;
 try{
  fd=openSync(lockPath,constants.O_RDWR|constants.O_CREAT|constants.O_NOFOLLOW,0o600);
  const before=fstatSync(fd), pathInfo=lstatSync(lockPath);
  if(!before.isFile()||before.uid!==owner||(before.mode&0o077)!==0||
     !pathInfo.isFile()||pathInfo.isSymbolicLink()||
     before.dev!==pathInfo.dev||before.ino!==pathInfo.ino)throw Error('UNSAFE_LOCK_PATH');
  fchmodSync(fd,0o600);
  lock=new DatabaseSync(lockPath);
  const after=lstatSync(lockPath);
  if(!after.isFile()||after.isSymbolicLink()||after.dev!==before.dev||after.ino!==before.ino)throw Error('LOCK_PATH_CHANGED');
  lock.exec('PRAGMA busy_timeout=0');
  lock.exec('CREATE TABLE IF NOT EXISTS owner_lock(id INTEGER PRIMARY KEY)');
  try{lock.exec('BEGIN IMMEDIATE')}catch(e){throw Error('BROKER_ALREADY_RUNNING',{cause:e})}
  const name=`ipc-${randomBytes(16).toString('hex')}.sock`,socketPath=join(directory,name);
  broker=await startBroker({socketPath,dbPath,authorized,limit});
  chmodSync(socketPath,0o660);
  const temp=join(directory,`.current-${randomBytes(16).toString('hex')}`);
  try{writeFileSync(temp,JSON.stringify({version:1,socket:name}),{flag:'wx',mode:0o640});renameSync(temp,join(directory,'current.json'))}catch(e){try{unlinkSync(temp)}catch{}throw e}
  let closed=false;
  return Object.freeze({socketPath,async close(){if(closed)return;closed=true;try{await broker.close()}finally{try{lock.exec('ROLLBACK')}finally{lock.close();closeSync(fd)}}}});
 }catch(e){if(broker)await broker.close();if(lock){try{lock.exec('ROLLBACK')}catch{}lock.close()}if(fd!==undefined)closeSync(fd);throw e}
}
export function resolveCrossRotation(directory,{owner,group}={}){
 try{
  const ds=lstatSync(directory);if(!ds.isDirectory()||ds.isSymbolicLink()||(ds.mode&0o777)!==0o750||(owner!==undefined&&ds.uid!==owner)||(group!==undefined&&ds.gid!==group))return null;
  const path=join(directory,'current.json'),m=lstatSync(path);
  if(!m.isFile()||m.isSymbolicLink()||m.uid!==ds.uid||m.gid!==ds.gid||(m.mode&0o777)!==0o640||m.size>256)return null;
  const v=JSON.parse(readFileSync(path,'utf8'));if(v.version!==1||typeof v.socket!=='string'||!NAME.test(v.socket))return null;
  const socket=join(directory,v.socket),st=lstatSync(socket);
  if(!st.isSocket()||st.uid!==ds.uid||st.gid!==ds.gid||(st.mode&0o777)!==0o660)return null;
  return socket;
 }catch{return null}
}
export async function requestCrossRotation(directory,body,identity){const path=resolveCrossRotation(directory,identity);return path?request(path,body):{status:'PENDIENTE',reason:'IPC'}}
