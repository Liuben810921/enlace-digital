'use strict';
const assert=require('node:assert/strict');
const {createQuoteContext}=require('./delivery-quote-context-isolated.cjs');
const fixture=()=>({
 cart:{lines:[{productId:'laptop',type:'propio',dispatchOriginId:'own1'},{productId:'speaker',type:'proveedor',supplierId:'supplierA',dispatchOriginId:'sup1'}]},
 destination:{province:'La Habana',id:'public-test-destination'},
 route:{roadDistancesKm:{own1:2,sup1:5,own2:99}},
 warehouses:[{id:'own1',type:'propio',active:true},{id:'own2',type:'propio',active:true},{id:'sup1',type:'proveedor',supplierId:'supplierA',active:true}],
 assignments:{laptop:['own1','own2'],speaker:['sup1']},
 tariff:{rateCupPerKm:200,minKm:3,minFeeCup:600}
});
const c=createQuoteContext();
let q=c.quote(fixture());
assert.equal(q.available,true);assert.equal(q.feeCup,1000);assert.equal(q.farthestKm,5);
assert.deepEqual(q.distinctOriginIds,['own1','sup1']);
assert.equal(c.validateQuote(q).valid,true);
for(const field of ['cart','destination','route','warehouses','assignments','tariff']){
 c.bump(field);assert.deepEqual(c.validateQuote(q),{valid:false,reason:'stale_'+field});
 q=c.quote(fixture());assert.equal(c.validateQuote(q).valid,true);
}
q.snapshot.payload.cart.lines[0].dispatchOriginId='own2';
assert.equal(c.validateQuote(q).reason,'tampered_payload');
let input=fixture();input.cart.lines[0].dispatchOriginId='own2';
q=c.quote(input);assert.equal(q.available,true);assert.equal(q.farthestKm,99);
input=fixture();input.cart.lines[0].dispatchOriginId=null;
assert.equal(c.quote(input).reason,'dispatch_selection_required');
input=fixture();delete input.route.roadDistancesKm.sup1;
assert.equal(c.quote(input).reason,'missing_verified_road_distance');
assert.throws(()=>c.bump('unknown'),/unknown_context_field/);
assert.equal(c.getAudit().length,6);
console.log('PASS: cart/destination/route/warehouse/assignment/tariff invalidation, selected effective origins, tamper and fail-closed routes');
