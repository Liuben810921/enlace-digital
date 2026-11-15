'use strict';
const assert=require('node:assert/strict');
const {createRegistry}=require('./delivery-warehouse-registry-isolated.cjs');
const {prepareDelivery}=require('./delivery-end-to-end-readiness-isolated.cjs');
const registry=createRegistry();
registry.supplierAdd({id:'s1',name:'Proveedor ficticio'});
registry.warehouseAdd({id:'w1',type:'proveedor',supplierId:'s1',name:'Almacén sintético A',lat:23.1,lng:-82.4,address:'Referencia pública ficticia A',addressVerified:true});
registry.warehouseAdd({id:'w2',type:'propio',name:'Almacén sintético B',lat:23.11,lng:-82.41,address:'Referencia pública ficticia B',addressVerified:true});
registry.assignProduct('p1',['w1','w2']);
const destination={referenceLabel:'Referencia sintética destino',lat:23.12,lng:-82.42};
const routeResponses={
 w1:{originId:'w1',destinationLabel:destination.referenceLabel,verifiedByServer:true,data:{code:'Ok',routes:[{distance:1800}]}},
 w2:{originId:'w2',destinationLabel:destination.referenceLabel,verifiedByServer:true,data:{code:'Ok',routes:[{distance:4700}]}}
};
const quote=()=>prepareDelivery({registry,productIds:['p1'],destination,routeResponses});
assert.equal(quote().available,true);
assert.equal(quote().referenceWarehouseId,'w2');
assert.equal(quote().deliveryFeeCup,940);
assert.equal(quote().dispatchNotSelected,true);
assert.equal(prepareDelivery({registry,productIds:['p1'],destination,routeResponses:{w1:routeResponses.w1}}).reason,'route_unverified');
assert.equal(prepareDelivery({registry,productIds:['p1'],destination,routeResponses:{...routeResponses,w2:{...routeResponses.w2,verifiedByServer:false}}}).reason,'route_unverified');
assert.equal(prepareDelivery({registry,productIds:['p1'],destination:{...destination,referenceLabel:'Otro destino'},routeResponses}).reason,'route_unverified');
registry.warehouseEdit('w2',{address:'Nueva referencia ficticia'},1);
assert.equal(quote().reason,'warehouse_address_unverified');
registry.warehouseEdit('w2',{addressVerified:true},2);
assert.equal(quote().available,true);
registry.supplierEdit('s1',{active:false});
assert.equal(quote().referenceWarehouseId,'w2');
assert.equal(quote().deliveryFeeCup,940);
registry.assignProduct('p2',['w1']);
assert.equal(prepareDelivery({registry,productIds:['p2'],destination,routeResponses}).reason,'product_origin_missing');
assert.equal(prepareDelivery({registry,productIds:['p1'],destination,routeResponses,rateCupPerKm:-1}).reason,'invalid_settings');
console.log('PASS isolated supplier warehouse addresses, coordinates, reference routes, farthest eligible origin, fee, invalidation and fail-closed checkout preview');
