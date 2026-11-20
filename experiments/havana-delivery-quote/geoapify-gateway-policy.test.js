'use strict';
const assert=require('node:assert/strict');
const {planRouteBatch:f}=require('./geoapify-gateway-policy');
const base={originIds:['almacen-a','almacen-b'],destinationId:'destino-prueba',contextRevision:4};
const usage={dailyCredits:0,minuteRequests:0};
const cases=[
 ['two origins remain pending',()=>{const r=f(base,usage);assert.equal(r.status,'PENDIENTE');assert.equal(r.estimatedCredits,2);assert.equal(r.requests.length,2);assert.equal(r.reason,'AWAITING_TRUSTED_GATEWAY')}],
 ['no usage data fail closed',()=>assert.equal(f(base).reason,'USAGE_UNKNOWN')],
 ['missing origin',()=>assert.equal(f({...base,originIds:[]},usage).reason,'INVALID_SCOPE')],
 ['duplicate origins',()=>assert.equal(f({...base,originIds:['a','a']},usage).reason,'INVALID_SCOPE')],
 ['more than 8 origins',()=>assert.equal(f({...base,originIds:Array.from({length:9},(_,i)=>'a'+i)},usage).reason,'INVALID_SCOPE')],
 ['destination is origin',()=>assert.equal(f({...base,destinationId:'almacen-a'},usage).reason,'INVALID_SCOPE')],
 ['invalid revision',()=>assert.equal(f({...base,contextRevision:-1},usage).reason,'INVALID_REVISION')],
 ['unsupported mode',()=>assert.equal(f({...base,mode:'truck'},usage).reason,'UNSUPPORTED_MODE')],
 ['daily budget',()=>assert.equal(f(base,{dailyCredits:2399,minuteRequests:0}).reason,'DAILY_BUDGET_EXCEEDED')],
 ['minute budget',()=>assert.equal(f(base,{dailyCredits:0,minuteRequests:29}).reason,'RATE_LIMIT_EXCEEDED')],
 ['unknown counters',()=>assert.equal(f(base,{dailyCredits:NaN,minuteRequests:0}).reason,'USAGE_UNKNOWN')],
 ['never generate fee',()=>assert.equal(f(base,usage).feeCup,undefined)]
];
for(const [name,fn] of cases){fn();console.log('PASS',name)}
console.log(cases.length+' focused checks passed');
