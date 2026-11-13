'use strict';
const assert=require('node:assert/strict');
const {policy,authorize,verifyRouteProvenance,changeSettings,verifyAuditEntry}=require('./delivery-manager-policy-route-audit-isolated.cjs');
const p=(role,active=true)=>({id:'user-1',role,active,assignedCustomerIds:['customer-1']});
const actions=['quote:preview','customer:assigned:read','delivery:settings:update','delivery:audit:read'];
for(const role of ['gestor','administrador_general','supervisor','cliente']){
 for(const action of actions){
  const result=authorize({principal:p(role),action,customerId:'customer-1'});
  assert.equal(result.ok,policy[role].includes(action),role+':'+action);
 }
}
assert.equal(authorize({principal:p('gestor'),action:'customer:assigned:read',customerId:'customer-2'}).reason,'customer_not_assigned');
assert.equal(authorize({principal:p('gestor',false),action:'quote:preview'}).reason,'invalid_principal');
assert.equal(authorize({principal:{...p('gestor'),role:'__proto__'},action:'quote:preview'}).reason,'forbidden_action');
const nowMs=1794600000000;
const expected={destinationId:'saved:addr-1',originIds:['warehouse-1','supplier-1'],cartId:'cart-1',settingsVersion:'v1'};
const route={routeId:'route-1',...expected,distancesKm:{'warehouse-1':3.4,'supplier-1':8},verifiedAtMs:nowMs-1000,source:'server_route_provider',trustedByServer:true};
assert.equal(verifyRouteProvenance({route,expected,nowMs}).ok,true);
const rejected=[
 [{...route,destinationId:'saved:addr-2'},expected,'route_binding_mismatch'],
 [{...route,cartId:'other'},expected,'route_binding_mismatch'],
 [{...route,settingsVersion:'v0'},expected,'route_binding_mismatch'],
 [{...route,source:'browser'},expected,'untrusted_route'],
 [{...route,trustedByServer:false},expected,'untrusted_route'],
 [{...route,verifiedAtMs:nowMs+1},expected,'stale_route'],
 [{...route,verifiedAtMs:nowMs-900001},expected,'stale_route'],
 [{...route,originIds:['warehouse-1','warehouse-1']},expected,'origin_mismatch'],
 [{...route,originIds:['warehouse-1']},expected,'origin_mismatch'],
 [{...route,distancesKm:{'warehouse-1':3.4}},expected,'invalid_distances'],
 [{...route,distancesKm:{'warehouse-1':3.4,'supplier-1':Infinity}},expected,'invalid_distances'],
 [{...route,distancesKm:{'warehouse-1':3.4,'supplier-1':-1}},expected,'invalid_distances'],
 [{...route,distancesKm:{'warehouse-1':3.4,'supplier-1':8,extra:0}},expected,'invalid_distances']
];
for(const [candidate,exp,reason] of rejected)assert.equal(verifyRouteProvenance({route:candidate,expected:exp,nowMs}).reason,reason);
const oldSettings={version:'v1',thresholdUsd:200,roundToCup:100};
const proposed={thresholdUsd:250,roundToCup:200};
const input={principal:p('administrador_general'),oldSettings,proposed,reason:'Ajuste comercial aprobado',atMs:nowMs};
const changed=changeSettings(input);
assert.equal(changed.ok,true);
assert.equal(changed.settings.version,'v1+1');
assert.equal(changed.auditEntry.actorId,'user-1');
assert.equal(changed.committed,false);
assert.equal(verifyAuditEntry(changed.auditEntry),true);
assert.equal(verifyAuditEntry({...changed.auditEntry,reason:'manipulado'}),false);
assert.equal(changeSettings({...input,principal:p('gestor')}).reason,'forbidden_action');
assert.equal(changeSettings({...input,principal:p('supervisor')}).reason,'forbidden_action');
assert.equal(changeSettings({...input,principal:p('administrador_general',false)}).reason,'invalid_principal');
assert.equal(changeSettings({...input,proposed:{...proposed,roundToCup:0}}).reason,'invalid_change');
assert.equal(changeSettings({...input,proposed:{...proposed,thresholdUsd:250.001}}).reason,'invalid_change');
assert.equal(changeSettings({...input,proposed:{thresholdUsd:200,roundToCup:100}}).reason,'no_change');
assert.equal(changeSettings({...input,previousAuditHash:'not-a-hash'}).reason,'invalid_change');
assert.equal(changeSettings({...input,reason:''}).reason,'invalid_change');
console.log('PASS role matrix 16 cases, route provenance 14 cases, tariff audit tampering and authorization');
