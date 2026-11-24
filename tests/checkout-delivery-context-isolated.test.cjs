'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(const script of scripts)new vm.Script(script);
const script=scripts.find(s=>s.includes('function edCheckoutDeliveryContextRead('));
assert(script,'checkout context guard exists');
const start=script.indexOf('function edCheckoutDeliveryContextRead(');
const end=script.indexOf('function edDeliveryCheckoutPreview(',start);
assert(end>start,'context guard is adjacent to checkout preview');
const products=[{id:'p1',name:'Producto',qty:4,origen_producto:'propio'}];
const values={
 'enlace_demo_v1':JSON.stringify({products}),
 'ed_product_origins_demo_v1':JSON.stringify({p1:['w1']}),
 'ed_delivery_origins_demo_v1':JSON.stringify([{id:'w1',type:'propio',active:true}]),
 'ed_delivery_suppliers_demo_v1':'[]',
 'ed_delivery_destinations_demo_v1':'[]'
};
function makeContext(overrides={}){
 const localValues={...values};
 const state={products:JSON.parse(JSON.stringify(products))};
 const ctx={
  ED_PRODUCT_ORIGINS_KEY:'ed_product_origins_demo_v1',
  ED_DELIVERY_ORIGINS_KEY:'ed_delivery_origins_demo_v1',
  ED_DELIVERY_SUPPLIERS_KEY:'ed_delivery_suppliers_demo_v1',
  ED_DELIVERY_DESTINATIONS_KEY:'ed_delivery_destinations_demo_v1',
  edInventoryLoaded:true,edInventoryPendingSaves:0,
  edInventorySnapshot:JSON.stringify(state.products),state,
  edDeliveryIsQuarantined:()=>false,
  edDeliveryContextRevision:()=>1,window:{},
  localStorage:{
   getItem:key=>Object.prototype.hasOwnProperty.call(localValues,key)?localValues[key]:null,
   setItem:(key,value)=>{localValues[key]=String(value);}
  },
  ...overrides
 };
 vm.createContext(ctx);
 vm.runInContext(script.slice(start,end),ctx);
 return ctx;
}
const out=makeContext();
const read=()=>vm.runInContext('edCheckoutDeliveryContextRead()',out);
assert.equal(read().ok,true,'matching remote inventory mirror and local delivery data pass');
const stale=makeContext({state:{products:[{id:'p1',name:'Remote newer',qty:3,origen_producto:'propio'}]}});
assert.equal(vm.runInContext('edCheckoutDeliveryContextRead()',stale).reason,'INVENTORY_SOURCE_MISMATCH');
const pending=makeContext({edInventoryPendingSaves:1});
assert.equal(vm.runInContext('edCheckoutDeliveryContextRead()',pending).reason,'INVENTORY_SOURCE_MISMATCH');
const remote=makeContext({window:{EDDeliveryStagingBridge:{isConnected:()=>true}}});
assert.equal(vm.runInContext('edCheckoutDeliveryContextRead()',remote).reason,'REMOTE_DELIVERY_CONTEXT_NOT_JOINED_TO_INVENTORY');
const malformed=makeContext();
malformed.localStorage.setItem('ed_product_origins_demo_v1','[]');
assert.equal(vm.runInContext('edCheckoutDeliveryContextRead()',malformed).reason,'DELIVERY_CONTEXT_INVALID');
let revisionCalls=0,raceContext;
const raced=makeContext({edDeliveryContextRevision:()=>{
 revisionCalls++;
 if(revisionCalls===2){raceContext.localStorage.setItem('ed_product_origins_demo_v1',JSON.stringify({p1:['w2']}));return 2}
 return 1;
}});
raceContext=raced;
assert.equal(vm.runInContext('edCheckoutDeliveryContextRead()',raced).reason,'DELIVERY_CONTEXT_CHANGED');
console.log('PASS checkout delivery context: coherent snapshot, stale inventory, pending writes, invalid shape, mid-read change');
