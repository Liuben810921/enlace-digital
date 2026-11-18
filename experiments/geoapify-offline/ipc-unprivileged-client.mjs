import {lstatSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import net from 'node:net';
const socketName=/^ipc-[a-f0-9]{32}\.sock$/;
export function discover(directory,{owner,group}){
 try{
  const d=lstatSync(directory);if(!d.isDirectory()||d.isSymbolicLink()||d.uid!==owner||d.gid!==group||(d.mode&0o777)!==0o750)return null;
  const m=lstatSync(join(directory,'current.json'));
  if(!m.isFile()||m.isSymbolicLink()||m.uid!==owner||m.gid!==group||(m.mode&0o777)!==0o640||m.size>256)return null;
  const manifest=JSON.parse(readFileSync(join(directory,'current.json'),'utf8'));
  if(manifest.version!==1||!socketName.test(manifest.socket))return null;
  const path=join(directory,manifest.socket),s=lstatSync(path);
  if(!s.isSocket()||s.uid!==owner||s.gid!==group||(s.mode&0o777)!==0o660)return null;
  return path;
 }catch{return null}
}
export async function call(directory,body,identity){const path=discover(directory,identity);if(!path)return {status:'PENDIENTE',reason:'IPC'};
 return new Promise(resolve=>{let done=false,output='';const finish=x=>{if(!done){done=true;resolve(x)}};
 const s=net.createConnection(path);s.setTimeout(3000,()=>s.destroy());s.on('connect',()=>s.end(JSON.stringify(body)+'\n'));
 s.on('data',b=>output+=b);s.on('end',()=>{try{finish(JSON.parse(output.trim()))}catch{finish({status:'PENDIENTE',reason:'IPC'})}});
 s.on('error',()=>finish({status:'PENDIENTE',reason:'IPC'}));s.on('close',()=>finish({status:'PENDIENTE',reason:'IPC'}));});}
