'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {build}=require('../experiments/havana-delivery-quote/staging-checkout-context.js');
const products=[{id:7,name:'Equipo',price:100}];
const inventorySnapshot=JSON.stringify({products});
const entities=[
 {kind:'supplier',id:'s1',payload:{name:'Proveedor Uno',active:true},revision:1},
 {kind:'warehouse',id:'w1',payload:{name:'Almacén Uno',type:'proveedor',municipality:'Playa',address:'Calle 1',supplierId:'s1',active:true},revision:2},
 {kind:'warehouse',id:'w2',payload:{name:'Almacén Propio',type:'propio',municipality:'Playa',address:'Calle 2',supplierId:null,active:true},revision:1},
 {kind:'product_origin',id:'7',payload:{productId:'7',warehouseIds:['w1','w2']},revision:3},
 {kind:'destination',id:'d1',payload:{name:'Destino Uno',municipality:'Playa',address:'Calle 3'},revision:1}
];
const links=[
 {source_kind:'warehouse',source_id:'w1',target_kind:'supplier',target_id:'s1'},
 {source_kind:'product_origin',source_id:'7',target_kind:'warehouse',target_id:'w1'},
 {source_kind:'product_origin',source_id:'7',target_kind:'warehouse',target_id:'w2'}
];
const input=()=>({entities,links,products,inventorySnapshot,baseRevision:4});
test('maps a consistent staging graph without reading local associations',()=>{
 const r=build(input());
 assert.equal(r.ok,true);
 assert.equal(r.snapshot.source,'supabase-staging');
 assert.deepEqual(JSON.parse(r.snapshot.associations),{'7':['w1','w2']});
 assert.deepEqual(JSON.parse(r.snapshot.origins).map(x=>x.id),['w1','w2']);
 assert.deepEqual(JSON.parse(r.snapshot.suppliers).map(x=>x.id),['s1']);
 assert.deepEqual(JSON.parse(r.snapshot.destinations).map(x=>x.id),['d1']);
 assert.equal(r.snapshot.inventory,inventorySnapshot);
});
test('rejects staging association payload/link disagreement',()=>{
 const bad=input();bad.links=links.filter(x=>x.target_id!=='w2');
 assert.equal(build(bad).reason,'STAGING_ASSOCIATION_LINK_MISMATCH');
});
test('rejects dangling or stale warehouse links',()=>{
 const bad=input();bad.links=[...links,{source_kind:'product_origin',source_id:'7',target_kind:'warehouse',target_id:'gone'}];
 assert.equal(build(bad).reason,'STAGING_LINK_INVALID');
});
test('rejects an inventory snapshot that differs from live product state',()=>{
 const bad=input();bad.inventorySnapshot=JSON.stringify({products:[{id:7,name:'Otro',price:100}]});
 assert.equal(build(bad).reason,'LOCAL_INVENTORY_MISMATCH');
});
test('rejects duplicate warehouse associations before exposing a snapshot',()=>{
 const bad=input();bad.entities=entities.map(x=>x.kind==='product_origin'?{...x,payload:{...x.payload,warehouseIds:['w1','w1']}}:x);
 assert.equal(build(bad).reason,'STAGING_ASSOCIATION_INVALID');
});
