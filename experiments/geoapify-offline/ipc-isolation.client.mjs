import {request} from './ipc-broker.mjs';
import {DatabaseSync} from 'node:sqlite';
import {openSync,closeSync} from 'node:fs';
const [socketPath,dbPath,mode,id='operation-001']=process.argv.slice(2);
if(process.getuid?.()!==65534||process.getgid?.()!==65534)throw Error('CLIENT_IDENTITY');
if(mode==='direct'){
 let readDenied=false,writeDenied=false;
 try{const fd=openSync(dbPath,'r');closeSync(fd)}catch(e){readDenied=e.code==='EACCES'}
 try{const db=new DatabaseSync(dbPath);db.exec("UPDATE credits SET used=999");db.close()}catch(e){writeDenied=true}
 console.log(JSON.stringify({readDenied,writeDenied}));
}else{
 const op={op:'start',token:'offline-capability-A',version:mode==='legacy'?'legacy':'NORM-v2',id,payload:{x:1}};
 console.log(JSON.stringify(await request(socketPath,op)));
}
