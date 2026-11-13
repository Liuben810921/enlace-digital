'use strict';
const assert=require('node:assert/strict');
const {planDelivery}=require('./delivery-dispatch-isolated.cjs');
const origins=[
 {id:'own1',type:'propio',active:true},{id:'own2',type:'propio',active:true},
 {id:'sup1',type:'proveedor',supplierId:'supplierA',active:true},
 {id:'sup2',type:'proveedor',supplierId:'supplierA',active:true},
 {id:'other',type:'proveedor',supplierId:'supplierB',active:true},
 {id:'inactive',type:'propio',active:false}
];
const roadDistancesKm={own1:2,own2:12,sup1:5,sup2:9,other:20,inactive:100};
const own=(dispatchOriginId)=>({productId:'laptop',type:'propio',allowedOriginIds:['own1','own2'],dispatchOriginId});
const sup=(dispatchOriginId)=>({productId:'speaker',type:'proveedor',supplierId:'supplierA',allowedOriginIds:['sup1','sup2','other'],dispatchOriginId});
const run=(lines,rest={})=>planDelivery({province:'La Habana',lines,origins,roadDistancesKm,...rest});
let r=run([own('own1'),sup('sup1')]);
assert.equal(r.available,true);
assert.equal(r.farthestKm,5);
assert.equal(r.feeCup,1000);
assert.deepEqual(r.distinctOriginIds,['own1','sup1']);
assert.equal(r.selectedOrigins.length,2);
assert.equal(run([own('own2'),sup('sup2')]).farthestKm,12);
assert.equal(run([own('own1')]).feeCup,600);
assert.equal(run([own()]).reason,'dispatch_selection_required');
assert.equal(run([sup()]).reason,'dispatch_selection_required');
assert.equal(run([own('inactive')]).reason,'dispatch_selection_required');
assert.equal(run([sup('other')]).reason,'dispatch_selection_required');
assert.equal(run([{productId:'x',type:'propio',allowedOriginIds:['inactive']}]).reason,'no_active_compatible_origin');
assert.equal(run([{productId:'x',type:'propio',allowedOriginIds:[]}]).reason,'missing_product_origin');
assert.equal(run([own('own1')],{province:'Matanzas'}).reason,'outside_coverage');
assert.equal(run([own('own1')],{roadDistancesKm:{}}).reason,'missing_verified_road_distance');
assert.equal(run([own('own1')],{roadDistancesKm:{own1:NaN}}).reason,'missing_verified_road_distance');
assert.equal(run([own('own1')],{rateCupPerKm:250}).feeCup,750);
assert.equal(run([own('own1'),own('own1')]).distinctOriginIds.length,1);
assert.equal(run([own('own1')],{minFeeCup:900}).feeCup,900);

assert.equal(run([own('own1'),sup('sup1')],{specialFeeCup:2500}).feeCup,2500);
assert.equal(run([own('own1'),sup('sup1')],{specialFeeCup:2500}).mode,'special');
assert.equal(run([own('own1'),sup('sup1')],{freeShipping:true}).feeCup,0);
assert.equal(run([own('own1'),sup('sup1')],{freeShipping:true,specialFeeCup:2500}).mode,'free');
assert.equal(run([own('own1')],{specialFeeCup:-1}).reason,'invalid_special_fee');
assert.equal(run([own('own1'),sup('sup1')],{roadDistancesKm:{own1:2}}).reason,'missing_verified_road_distance');
assert.equal(run([own('own1'),sup('sup1')],{roadDistancesKm:{own1:2,sup1:0}}).feeCup,600);
assert.equal(run([own('own1'),sup('sup1')],{roadDistancesKm:{own1:2.99,sup1:3.01}}).feeCup,602);
assert.equal(run([own('own1'),sup('sup1')],{roadDistancesKm:{own1:2,sup1:5,own2:99,other:100}}).farthestKm,5);

console.log('PASS synthetic dispatch: own/supplier compatibility, explicit origin, farthest USED, missing road distance, Havana, minimum');
