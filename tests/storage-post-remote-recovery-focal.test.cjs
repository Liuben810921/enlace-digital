'use strict';
// Offline model: recovery protocol after a confirmed remote operation.
// This is NOT an integration of the real HTML and does not claim atomicity.
const assert=require('node:assert/strict');
const clone=x=>JSON.parse(JSON.stringify(x));
function recoveryGate(){let pending=null;return {
 canWrite:()=>pending===null,
 mark:(operation,remoteConfirmed,reason)=>{if(remoteConfirmed)pending={operation,reason};return !remoteConfirmed},
 reconcile:({remoteSnapshot,localSnapshot,expectedRemote})=>{
  if(!pending)return false;
  if(!Array.isArray(remoteSnapshot)||!Array.isArray(localSnapshot))return false;
  if(JSON.stringify(remoteSnapshot)!==JSON.stringify(expectedRemote))return false;
  if(JSON.stringify(localSnapshot)!==JSON.stringify(remoteSnapshot))return false;
  pending=null;return true;
 },
 pending:()=>pending
}}
let n=0;function test(name,fn){fn();console.log('PASS',name);n++}
test('queue remote confirmed and local conflict blocks next write',()=>{
 const g=recoveryGate();assert(g.canWrite());g.mark('queue',true,'foreign change');assert(!g.canWrite());assert.equal(g.pending().operation,'queue')
});
test('queue failed remote call does not imply confirmed remote',()=>{
 const g=recoveryGate();g.mark('queue',false,'network');assert(g.canWrite())
});
test('delete remote confirmed and local quota error blocks next write',()=>{
 const g=recoveryGate();g.mark('delete',true,'quota');assert(!g.canWrite())
});
test('no blind retry while recovery pending',()=>{
 const g=recoveryGate();g.mark('delete',true,'quota');let remoteCalls=1;if(g.canWrite())remoteCalls++;assert.equal(remoteCalls,1)
});
test('reconcile refuses stale local products',()=>{
 const g=recoveryGate();g.mark('queue',true,'conflict');assert.equal(g.reconcile({remoteSnapshot:[{id:2}],localSnapshot:[{id:1}],expectedRemote:[{id:2}]}),false);assert(!g.canWrite())
});
test('reconcile refuses unexpected remote products',()=>{
 const g=recoveryGate();g.mark('queue',true,'conflict');assert.equal(g.reconcile({remoteSnapshot:[{id:3}],localSnapshot:[{id:3}],expectedRemote:[{id:2}]}),false);assert(!g.canWrite())
});
test('reconcile releases only matching confirmed snapshots',()=>{
 const g=recoveryGate();g.mark('delete',true,'quota');assert(g.reconcile({remoteSnapshot:[{id:2}],localSnapshot:[{id:2}],expectedRemote:[{id:2}]}));assert(g.canWrite())
});
test('field patch preserves independent external edits',()=>{
 const shared={products:[{id:2}],fees:{delivery:99}},patch={products:[]};const merged={...clone(shared),...patch};assert.equal(merged.fees.delivery,99)
});
test('field patch cannot guarantee atomicity with uncooperative writer',()=>{
 let shared={products:[{id:1}],fees:{delivery:1}};const read=clone(shared);shared.fees.delivery=99;shared={...read,products:[]};assert.equal(shared.fees.delivery,1)
});
console.log(n+'/'+n+' PASS');
