'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function edDeliveryReassignWarehouse(sourceId){');
const end=html.indexOf('\nfunction edDeliveryUnlinkWarehouseProducts(',start);
assert.ok(start>=0&&end>start,'Exact warehouse reassignment function must exist');
const source=html.slice(start,end);
const products=['p1','p2','p3'].map(id=>({id,origen_producto:'propio'}));
const origins=[{id:'w1',name:'A',type:'propio',active:true},{id:'w2',name:'B',type:'propio',active:true},{id:'w3',name:'C',type:'propio',active:true}];
const original={p1:['w1'],p2:['w1','w3'],p3:['w3']};
for(const [label,from,to,expected] of [
 ['changed destination','w2','w3',false],
 ['stable destination','w2','w2',true],
 ['changed to source','w2','w1',false]
]){
 let target=from,writes=0;
 const inventory=JSON.stringify(products);
 const values=new Map([['associations',JSON.stringify(original)],['origins',JSON.stringify(origins)],['suppliers','[]'],['enlace_demo_v1',JSON.stringify({products})]]);
 const context={
  edDeliveryIsQuarantined:()=>false,edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:inventory,state:{products},
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>[],
  ED_PRODUCT_ORIGINS_KEY:'associations',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',
  localStorage:{getItem:key=>values.get(key)??null},
  document:{getElementById:id=>id.startsWith('edReassignTarget-')?{get value(){return target}}:{querySelectorAll:()=>[{value:'p1'}]}},
  alert:()=>{},confirm:()=>{target=to;return true},
  edDeliveryPersistAndInvalidate:(key,value)=>{writes++;values.set(key,JSON.stringify(value));return true},
  adminTab:()=>{}
 };
 vm.createContext(context);vm.runInContext(source,context);
 assert.equal(context.edDeliveryReassignWarehouse('w1'),expected,label);
 assert.equal(writes,expected?1:0,label+' writes');
 const saved=JSON.parse(values.get('associations'));
 assert.deepEqual(saved.p2,original.p2,label+' unselected source-linked product');
 assert.deepEqual(saved.p3,original.p3,label+' unrelated product');
 if(expected)assert.deepEqual(saved.p1,['w2'],label+' selected product');
 else assert.deepEqual(saved,original,label+' no changes');
}
console.log('PASS exact reassignment: destination changes rejected, stable accepted, other products preserved');
