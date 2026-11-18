import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,lstatSync,statSync,chmodSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {startBroker,request} from './ipc-broker.mjs';
const NAME=/^ipc-[a-f0-9]{32}\.sock$/;
function dirCheck(dir,owner,group){const s=lstatSync(dir);if(!s.isDirectory()||s.isSymbolicLink()||s.uid!==owner||s.gid!==group||(s.mode&0o777)!==0o750)throw Error('UNSAFE_DIRECTORY')}
export async function startCrossRotation({directory,dbPath,owner=process.getuid(),group=process.getgid(),authorized={},limit=2}={}){
 dirCheck(directory,owner,group);
 const name=`ipc-${randomBytes(16).toString('hex')}.sock`,socketPath=join(directory,name);
 const broker=await startBroker({socketPath,dbPath,authorized,limit});
 try{
  chmodSync(socketPath,0o660);
  const temp=join(directory,`.current-${randomBytes(16).toString('hex')}`);
  try{writeFileSync(temp,JSON.stringify({version:1,socket:name}),{flag:'wx',mode:0o640});renameSync(temp,join(directory,'current.json'))}catch(e){try{unlinkSync(temp)}catch{}throw e}
 }catch(e){await broker.close();throw e}
 return Object.freeze({socketPath,close:()=>broker.close()});
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
