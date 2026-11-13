'use strict';
const assert=require('node:assert/strict');
const {cacheKey,makeRouteCache,buildOfflineRouteQuote}=require('./delivery-route-cache-isolated.cjs');
let time=1000;
const cache=makeRouteCache({ttlMs:1000,now:()=>time,maxEntries:2});
const p={lat:23.13,lng:-82.36},q={lat:23.12,lng:-82.35};
const key=cacheKey('osrm-compatible','driving',p,q);
assert.notEqual(key,cacheKey('osrm-compatible','driving',q,p));
assert.equal(cache.read(key).hit,false);
assert.equal(cache.write(key,4),true);
assert.equal(cache.read(key).roadDistanceKm,4);
time=2000;
assert.equal(cache.read(key).hit,false);
assert.equal(cache.write(key,-1),false);
const origins=[
 {id:'own1',type:'propio',active:true,lat:23.13,lng:-82.36},
 {id:'own2',type:'propio',active:true,lat:23.15,lng:-82.38},
 {id:'supplier1',type:'proveedor',supplierId:'s1',active:true,lat:23.14,lng:-82.37},
 {id:'supplier2',type:'proveedor',supplierId:'s2',active:true,lat:23.16,lng:-82.39}
];
const lines=[
 {productId:'laptop',type:'propio',allowedOriginIds:['own1','own2'],dispatchOriginId:'own1'},
 {productId:'speaker',type:'proveedor',supplierId:'s1',allowedOriginIds:['supplier1','supplier2'],dispatchOriginId:'supplier1'}
];
const routes={own1:{code:'Ok',routes:[{distance:2000}]},supplier1:{code:'Ok',routes:[{distance:7400}]}};
const args={province:'La Habana',lines,origins,destination:q,routeResponses:routes,cache};
let result=buildOfflineRouteQuote(args);
assert.equal(result.available,true);
assert.equal(result.farthestKm,7.4);
assert.equal(result.feeCup,1480);
assert.deepEqual(result.distinctOriginIds,['own1','supplier1']);
assert.equal(result.details.every(d=>!d.fromCache),true);
result=buildOfflineRouteQuote({...args,routeResponses:{}});
assert.equal(result.available,true);
assert.equal(result.details.every(d=>d.fromCache),true);
time=3000;
assert.equal(buildOfflineRouteQuote({...args,routeResponses:{}}).reason,'route_unavailable');
assert.equal(buildOfflineRouteQuote({...args,province:'Matanzas'}).reason,'outside_coverage');
assert.equal(buildOfflineRouteQuote({...args,lines:[{...lines[0],dispatchOriginId:undefined}]}).reason,'dispatch_selection_required');
assert.equal(buildOfflineRouteQuote({...args,lines:[{...lines[1],dispatchOriginId:'supplier2'}]}).reason,'dispatch_selection_required');
assert.equal(buildOfflineRouteQuote({...args,destination:{lat:999,lng:0}}).reason,'invalid_coordinates');
assert.equal(buildOfflineRouteQuote({...args,routeResponses:{own1:{code:'NoRoute',routes:[]}}}).reason,'route_unavailable');

const feeCache=makeRouteCache();
const feeArgs={...args,cache:feeCache};
assert.equal(buildOfflineRouteQuote({...feeArgs,settings:{specialFeeCup:2100}}).feeCup,2100);
assert.equal(buildOfflineRouteQuote({...feeArgs,routeResponses:{},settings:{freeShipping:true}}).feeCup,0);
assert.equal(buildOfflineRouteQuote({...feeArgs,routeResponses:{},settings:{specialFeeCup:2100,freeShipping:true}}).mode,'free');
assert.equal(buildOfflineRouteQuote({...feeArgs,routeResponses:{},settings:{specialFeeCup:-2}}).reason,'invalid_special_fee');
const emptyCache=makeRouteCache();
assert.equal(buildOfflineRouteQuote({...args,cache:emptyCache,routeResponses:{own1:{code:'Ok',routes:[{distance:2000}]},supplier1:{code:'NoRoute',routes:[]}}}).reason,'route_unavailable');
assert.equal(buildOfflineRouteQuote({...args,cache:makeRouteCache(),routeResponses:{own1:{code:'Ok',routes:[{distance:2000}]}}}).reason,'route_unavailable');
assert.equal(buildOfflineRouteQuote({...args,cache:makeRouteCache(),routeResponses:{own1:{code:'Ok',routes:[{distance:2000}]},supplier1:{code:'Ok',routes:[{distance:-1}]}}}).reason,'invalid_route_distance');

console.log('PASS offline routing: cache TTL, direction, effective origins, Havana, fail-closed, tariff');
