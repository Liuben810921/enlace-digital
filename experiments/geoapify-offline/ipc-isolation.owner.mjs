import {startBroker} from './ipc-broker.mjs';
import {chmodSync,lstatSync,statSync} from 'node:fs';
import {dirname} from 'node:path';
const [socketPath,dbPath]=process.argv.slice(2);
if(process.getuid?.()!==65533||process.getgid?.()!==65534)throw Error('OWNER_IDENTITY');
const parent=statSync(dirname(socketPath));
if(parent.uid!==65533||(parent.mode&0o022)!==0)throw Error('UNSAFE_SOCKET_DIRECTORY');
try{const old=lstatSync(socketPath);if(!old.isSocket()||old.uid!==65533)throw Error('UNSAFE_SOCKET_PATH')}catch(e){if(e.code!=='ENOENT')throw e}
const b=await startBroker({socketPath,dbPath,limit:2,authorized:{'offline-capability-A':'test-A'}});
if(!lstatSync(socketPath).isSocket())throw Error('SOCKET_TYPE');
chmodSync(socketPath,0o660);
console.log('READY');
process.on('SIGTERM',async()=>{await b.close();process.exit(0)});
