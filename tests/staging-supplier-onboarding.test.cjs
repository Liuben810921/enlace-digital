'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../experiments/havana-delivery-quote/staging-supplier-onboarding.js');
const supplierId='supplier-11111111-1111-4111-8111-111111111111';
const warehouses=[
 {id:'warehouse-22222222-2222-4222-8222-222222222222',name:'Central',municipality:'Playa',address:'Calle 1'},
 {id:'warehouse-33333333-3333-4333-8333-333333333333',name:'Sucursal',municipality:'Centro Habana',address:'Calle 2'}
];
test('builds one atomic supplier plus multiple linked warehouse creations',()=>{
 const changes=build({supplierId,name:'Proveedor Uno',warehouses});
 assert.equal(changes.length,3);
 assert.deepEqual(changes[0],{kind:'supplier',id:supplierId,create:true,payload:{name:'Proveedor Uno',active:true},links:[]});
 assert.equal(changes[1].payload.defaultForSupplier,true);
 assert.equal(changes[2].payload.defaultForSupplier,false);
 assert.deepEqual(changes[1].links,[{target_kind:'supplier',target_id:supplierId}]);
 assert.equal(changes[2].payload.supplierId,supplierId);
});
test('allows creating a supplier before its warehouse details are known',()=>{
 const changes=build({supplierId,name:'Proveedor Uno'});
 assert.equal(changes.length,1);
 assert.equal(changes[0].kind,'supplier');
});
test('rejects partial address data before making any batch',()=>{
 assert.throws(()=>build({supplierId,name:'Proveedor Uno',warehouses:[{id:warehouses[0].id,name:'',municipality:'Playa',address:''}]}),/Completa nombre, municipio y dirección/);
});
test('rejects duplicate or invalid warehouse identifiers',()=>{
 assert.throws(()=>build({supplierId,name:'Proveedor Uno',warehouses:[warehouses[0],{...warehouses[1],id:warehouses[0].id}]}),/ID de almacén inválido o repetido/);
});
