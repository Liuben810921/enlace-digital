'use strict';
const assert=require('node:assert/strict');
const {createSyntheticQuoteStore}=require('./delivery-manager-concurrency-idempotency-isolated.cjs');
const now=1794600000000;
const principal={id:'manager',role:'gestor',active:true,assignedCustomerIds:['customer']};
const cart={id:'cart',ownerId:'manager',province:'La Habana',subtotalUsd:150,
 lines:[{productId:'p',type:'propio',allowedOriginIds:['origin'],dispatchOriginId:'origin'}],
 origins:[{id:'origin',type:'propio',active:true}]};
const customer={id:'customer',assignedManagerId:'manager',
 addresses:[{id:'address',label:'Centro Habana, referencia',active:true,lastQuoteCup:600}]};
const settings={version:'v1',thresholdUsd:200,roundToCup:100,rateCupPerKm:200,minKm:3,minFeeCup:600};
const snapshot={serverContext:{carts:[cart],customers:[customer],settings}};
const request={customerKind:'habitual',customerId:'customer',addressId:'address',cartId:'cart'};
const route={routeId:'route',destinationId:'saved:address',originIds:['origin'],distancesKm:{origin:3.4},
 cartId:'cart',settingsVersion:'v1',verifiedAtMs:now-1000,source:'server_route_provider',trustedByServer:true};
const make=()=>createSyntheticQuoteStore({snapshot,nowMs:now});
let store=make();
const input={key:'op-1',request,principal,routeRecord:route};
const first=store.quote(input);
assert.equal(first.available,true);
assert.equal(first.customerFeeCup,700);
assert.equal(first.replayed,false);
assert.equal(store.recordsCount(),1);
const retry=store.quote(input);
assert.equal(retry.available,true);
assert.equal(retry.replayed,true);
assert.equal(retry.customerFeeCup,first.customerFeeCup);
assert.equal(store.recordsCount(),1);
assert.equal(store.quote({...input,request:{...request,addressId:'other'}}).reason,'idempotency_payload_conflict');
assert.equal(store.quote({...input,routeRecord:{...route,routeId:'other'}}).reason,'idempotency_payload_conflict');
assert.equal(store.quote({...input,key:'bad key'}).reason,'invalid_operation');
store.replaceSnapshot({serverContext:{...snapshot.serverContext,settings:{...settings,version:'v2',thresholdUsd:250}}});
assert.equal(store.quote(input).reason,'quote_snapshot_changed');
assert.equal(store.quote({...input,key:'op-2'}).reason,'route_binding_mismatch');
store=make();
store.replaceSnapshot({serverContext:{...snapshot.serverContext,carts:[{...cart,subtotalUsd:200}]}});
const free=store.quote(input);
assert.equal(free.customerFeeCup,0);
assert.equal(free.calculatedDeliveryValueCup,700);
assert.equal(free.promotionCoveredCup,700);
store=make();
store.advanceClock(now+300001);
assert.equal(store.quote(input).available,true); // first use of key after delay
store.advanceClock(now+600002);
assert.equal(store.quote(input).reason,'idempotency_key_expired');
store=make();
store.advanceClock(now+899001);
assert.equal(store.quote(input).reason,'stale_route'); // route was verified 1000 ms before initial now
store=createSyntheticQuoteStore({snapshot,nowMs:now,ttlMs:1000000});
const firstBeforeExpiry=store.quote(input);
assert.equal(firstBeforeExpiry.available,true);
store.advanceClock(now+899001);
assert.equal(store.quote(input).reason,'quote_expired');
store=make();
const a=store.quote({...input,key:'a'});
const b=store.quote({...input,key:'b'});
assert.equal(a.available,true);
assert.equal(b.available,true);
assert.equal(store.recordsCount(),2);
console.log('PASS synthetic quote concurrency model: replay, conflict, changed tariff/cart snapshot, expiry, free ledger, independent keys');
