import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,renameSync,lstatSync,statSync,unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {startBroker,request} from './ipc-broker.mjs';

// A new socket name is used on each restart. No stale socket is ever unlinked.
// All files are in a private, owner-controlled directory.
export async function startRotatingBroker({directory,dbPath,limit=2,authorized={},clock}={}){
 const parent=statSync(directory);
 if(!parent.isDirectory() || parent.uid!==process.getuid() || (parent.mode&0o077)!==0)throw Error('UNSAFE_DIRECTORY');
 const id=randomBytes(16).toString('hex');
 const socketPath=join(directory,`ipc-${id}.sock`);
 const manifest=join(directory,'current.json');
 const temp=join(directory,`.current-${id}.tmp`);
 const broker=await startBroker({socketPath,dbPath,limit,authorized,clock});
 try{
  writeFileSync(temp,JSON.stringify({version:1,socket:`ipc-${id}.sock`}),{flag:'wx',mode:0o600});
  renameSync(temp,manifest);
 }catch(e){try{unlinkSync(temp)}catch{}await broker.close();throw e}
 let closed=false;
 return Object.freeze({socketPath,async close(){if(closed)return;closed=true;await broker.close();
 // The manifest is not deleted here: consumers fail closed when socket is gone.
 }});
}
export function resolveSocket(directory){
 try{
  const parent=statSync(directory);if(!parent.isDirectory()||parent.uid!==process.getuid()||(parent.mode&0o077)!==0)throw Error('UNSAFE_DIRECTORY');
  const manifest=join(directory,'current.json');const info=lstatSync(manifest);
  if(!info.isFile()||info.isSymbolicLink()||info.uid!==process.getuid()||(info.mode&0o077)!==0||info.size>256)throw Error('INVALID_MANIFEST');
  const data=JSON.parse(readFileSync(manifest,'utf8'));
  if(data.version!==1||typeof data.socket!=='string'||!/^ipc-[0-9a-f]{32}\.sock$/.test(data.socket))throw Error('INVALID_MANIFEST');
  const path=join(directory,data.socket);const st=lstatSync(path);
  if(!st.isSocket()||st.uid!==process.getuid())throw Error('INVALID_SOCKET');
  return path;
 }catch{return null}
}
export async function requestCurrent(directory,body){const socket=resolveSocket(directory);return socket?request(socket,body):{status:'PENDIENTE',reason:'IPC'}}
