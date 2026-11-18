import {startBroker} from './ipc-broker.mjs';
import {chmodSync,lstatSync} from 'node:fs';
const [socketPath,dbPath]=process.argv.slice(2);
if(process.getuid?.()!==65533||process.getgid?.()!==65534)throw Error('OWNER_IDENTITY');
const b=await startBroker({socketPath,dbPath,limit:2,authorized:{'offline-capability-A':'test-A'}});
if(!lstatSync(socketPath).isSocket())throw Error('SOCKET_TYPE');
chmodSync(socketPath,0o660);
console.log('READY');
process.on('SIGTERM',async()=>{await b.close();process.exit(0)});
