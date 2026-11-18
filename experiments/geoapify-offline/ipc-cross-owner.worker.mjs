import {startCrossRotation} from './ipc-cross-rotation.mjs';
const [dir,db]=process.argv.slice(2);
if(process.getuid()!==65533||process.getgid()!==65534)throw Error('BAD_OWNER');
await startCrossRotation({directory:dir,dbPath:db,owner:65533,group:65534,authorized:{synthetic:'test-A'},limit:2});
console.log('READY');
