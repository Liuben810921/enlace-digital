import {requestCrossRotation} from './ipc-cross-rotation.mjs';
import {openSync,closeSync} from 'node:fs';
const [dir,db,mode,id='operation-0001']=process.argv.slice(2);
if(process.getuid()!==65534||process.getgid()!==65534)throw Error('BAD_CLIENT');
if(mode==='direct'){let denied=false;try{closeSync(openSync(db,'r'))}catch(e){denied=e.code==='EACCES'}console.log(JSON.stringify({denied}));}
else console.log(JSON.stringify(await requestCrossRotation(dir,{op:'start',token:'synthetic',version:mode,id,payload:{x:1}},{owner:65533,group:65534})));
