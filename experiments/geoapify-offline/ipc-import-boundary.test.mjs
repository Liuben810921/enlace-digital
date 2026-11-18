import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,symlinkSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {checkBrokerImports} from './ipc-import-boundary.mjs';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++};
const root=mkdtempSync(join(tmpdir(),'ed-boundary-'));
const put=(name,source)=>writeFileSync(join(root,name),source);
try{
 put('ipc-broker.test.mjs',"import {startBroker} from './ipc-broker.mjs';\nstartBroker({});");
 put('ipc-cross-rotation.mjs',"import {startBroker} from './ipc-broker.mjs';\nstartBroker({});");
 put('authorized.mjs',"import {requestCrossRotation} from './ipc-cross-rotation.mjs';");
 put('rogue.mjs',"import {startBroker} from './ipc-broker.mjs';");
 put('dynamic.mjs',"const x = import('./ipc-broker.mjs');");
 put('alias.mjs',"import x from './sub/ipc-broker.mjs';");
 eq(checkBrokerImports({root,paths:['ipc-broker.test.mjs','ipc-cross-rotation.mjs']}).ok,true);
 eq(checkBrokerImports({root,paths:['authorized.mjs'],production:true}).ok,true);
 eq(checkBrokerImports({root,paths:['rogue.mjs'],production:true}).findings[0].reason,'DIRECT_BROKER_IMPORT');
 eq(checkBrokerImports({root,paths:['ipc-broker.test.mjs'],production:true}).ok,false);
 eq(checkBrokerImports({root,paths:['dynamic.mjs'],production:true}).ok,false);
 eq(checkBrokerImports({root,paths:['alias.mjs'],production:true}).ok,false);
 let rejected=false;try{checkBrokerImports({root,paths:['../rogue.mjs']})}catch{rejected=true}eq(rejected,true);
 symlinkSync(join(root,'rogue.mjs'),join(root,'symlink.mjs'));rejected=false;try{checkBrokerImports({root,paths:['symlink.mjs']})}catch{rejected=true}eq(rejected,true);
 eq(checkBrokerImports({root,paths:['authorized.mjs']}).filesChecked,1);
 console.log('PASS '+n+' bounded IPC import policy assertions');
}finally{rmSync(root,{recursive:true,force:true})}
