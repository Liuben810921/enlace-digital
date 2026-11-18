import {call} from './ipc-unprivileged-client.mjs';
import {openSync,closeSync,accessSync,constants} from 'node:fs';
import {pathToFileURL} from 'node:url';
const [dir,db,ownerModule,mode,id='operation-0001']=process.argv.slice(2);
if(process.getuid()!==65534||process.getgid()!==65534)throw Error('UNEXPECTED_UID');
if(mode==='read-db'){
 let denied=false;try{closeSync(openSync(db,'r'))}catch(e){denied=e.code==='EACCES'}
 console.log(JSON.stringify({denied}));
}else if(mode==='import-owner'){
 // Import is not a privilege escalation: code may load but cannot read owner-only SQLite.
 let imported=false,started=false,error='';
 try{const m=await import(pathToFileURL(ownerModule).href);imported=typeof m.startCrossRotation==='function';
 try{await m.startCrossRotation({directory:dir,dbPath:db,owner:65533,group:65534});started=true}catch(e){error=e.code||e.message}}
 catch(e){error=e.code||e.message}
 console.log(JSON.stringify({imported,started,error}));
}else{
 console.log(JSON.stringify(await call(dir,{op:'start',token:'synthetic',version:mode,id,payload:{x:1}},{owner:65533,group:65534})));
}
