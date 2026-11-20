'use strict';
const assert=require('node:assert/strict');const {handle}=require('./geoapify-edge-core.cjs');
const req={mode:'drive',contextRevision:1,destination:{lat:23.13,lon:-82.37},origins:[{id:'warehouse_1',lat:23.12,lon:-82.4}]};
const ok={authenticate:async()=>({authorized:true,role:'routing-tester',subject:'synthetic'}),reserveAtomic:async()=>({committed:true,reservationId:'synthetic-1'})};
(async()=>{let count=0;async function test(name,fn){await fn();count++;console.log('PASS',name)}
await test('no adapters fail closed',async()=>assert.equal((await handle(req)).reason,'GATEWAY_NOT_CONFIGURED'));
await test('no auth',async()=>assert.equal((await handle(req,{...ok,authenticate:async()=>null})).reason,'UNAUTHORIZED'));
await test('wrong role',async()=>assert.equal((await handle(req,{...ok,authenticate:async()=>({authorized:true,role:'customer'})})).reason,'UNAUTHORIZED'));
await test('outside Havana',async()=>assert.equal((await handle({...req,destination:{lat:25,lon:-82}},ok)).reason,'INVALID_ROUTE_SCOPE'));
await test('NaN coordinate',async()=>assert.equal((await handle({...req,destination:{lat:NaN,lon:-82}},ok)).reason,'INVALID_ROUTE_SCOPE'));
await test('duplicate origins',async()=>assert.equal((await handle({...req,origins:[req.origins[0],req.origins[0]]},ok)).reason,'INVALID_ROUTE_SCOPE'));
await test('unsupported mode',async()=>assert.equal((await handle({...req,mode:'walk'},ok)).reason,'INVALID_MODE'));
await test('invalid revision',async()=>assert.equal((await handle({...req,contextRevision:-1},ok)).reason,'INVALID_REVISION'));
await test('reservation rejected',async()=>assert.equal((await handle(req,{...ok,reserveAtomic:async()=>({committed:false})})).reason,'BUDGET_NOT_RESERVED'));
await test('reservation throws',async()=>assert.equal((await handle(req,{...ok,reserveAtomic:async()=>{throw Error('race')}})).reason,'GATEWAY_ERROR'));
await test('approved still pending',async()=>{const r=await handle(req,ok);assert.equal(r.reason,'PROVIDER_NOT_CONNECTED');assert.equal(r.status,'PENDIENTE');assert.equal(r.feeCup,null);assert.deepEqual(r.routes,[])});
await test('auth precedes reservation',async()=>{let calls=0;await handle(req,{...ok,authenticate:async()=>null,reserveAtomic:async()=>{calls++}});assert.equal(calls,0)});
console.log(count+' / 12 PASS')})().catch(e=>{console.error(e);process.exitCode=1});
