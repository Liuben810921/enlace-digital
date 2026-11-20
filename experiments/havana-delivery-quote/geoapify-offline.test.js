'use strict';
const assert=require('node:assert/strict');
const {adaptGeoapifyRoutes:f}=require('./geoapify-offline');
const response=(originId,distance=4500,time=500,httpStatus=200)=>({originId,httpStatus,body:{features:[{properties:{distance,time}}]}});
const base={originIds:['a'],destinationId:'d',contextRevision:1};
const tests=[
 ['valid fixture stays pending',()=>{const r=f({...base,responses:[response('a')]});assert.equal(r.status,'PENDIENTE');assert.equal(r.routes[0].km,4.5);assert.equal(r.routes[0].status,'unverified')}],
 ['two origins',()=>assert.equal(f({...base,originIds:['a','b'],responses:[response('a'),response('b')]}).routes.length,2)],
 ['missing origin',()=>assert.equal(f({...base,originIds:['a','b'],responses:[response('a')]}).reason,'INCOMPLETE_ROUTES')],
 ['duplicate origin',()=>assert.equal(f({...base,originIds:['a','b'],responses:[response('a'),response('a')]}).reason,'ROUTE_SCOPE_MISMATCH')],
 ['http 429',()=>assert.equal(f({...base,responses:[response('a',4500,500,429)]}).reason,'GEOAPIFY_RESPONSE_INVALID')],
 ['empty features',()=>assert.equal(f({...base,responses:[{originId:'a',httpStatus:200,body:{features:[]}}]}).reason,'GEOAPIFY_RESPONSE_INVALID')],
 ['negative distance',()=>assert.equal(f({...base,responses:[response('a',-1)]}).reason,'GEOAPIFY_METRICS_INVALID')],
 ['infinite distance',()=>assert.equal(f({...base,responses:[response('a',Infinity)]}).reason,'GEOAPIFY_METRICS_INVALID')],
 ['over range',()=>assert.equal(f({...base,responses:[response('a',300001)]}).reason,'GEOAPIFY_METRICS_INVALID')],
 ['invalid revision',()=>assert.equal(f({...base,contextRevision:-1,responses:[response('a')]}).reason,'INVALID_REVISION')],
 ['unknown origin',()=>assert.equal(f({...base,responses:[response('z')]}).reason,'ROUTE_SCOPE_MISMATCH')],
 ['no responses',()=>assert.equal(f({...base,responses:[]}).reason,'INCOMPLETE_ROUTES')],
 ['never quotes',()=>{const r=f({...base,responses:[response('a')]});assert.equal(r.feeCup,undefined);assert.notEqual(r.status,'COTIZACION_SIMULADA')}],
];
let n=0;for(const [name,fn] of tests){fn();n++;console.log('PASS',name)}console.log(n+'/'+tests.length,'PASS');
