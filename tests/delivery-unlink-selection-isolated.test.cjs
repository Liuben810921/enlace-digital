'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function edDeliveryUnlinkWarehouseProducts(sourceId){');
const end=html.indexOf('\nfunction edDeliveryOriginDelete(',start);
assert.ok(start>=0&&end>start,'Exact unlink function must exist');
const source=html.slice(start,end);
const products=['p1','p2','p3'].map(id=>({id,origen_producto:'propio'}));
const origins=[{id:'w1',name:'Origen',type:'propio',active:true},{id:'w2',name:'Alterno',type:'propio',active:true}];
const original={p1:['w1','w2'],p2:['w1'],p3:['w2']};
for(const [label,before,after,expected] of [
 ['changed',['p1'],['p2'],false],
 ['reduced',['p1','p2'],['p1'],false],
 ['stable partial',['p1'],['p1'],true],
 ['stable multiproduct',['p1','p2'],['p1','p2'],true],
 ['reordered',['p1','p2'],['p2','p1'],false]
]){
 let checked=before.slice(),writes=0;
 const inventory=JSON.stringify(products);
 const values=new Map([['associations',JSON.stringify(original)],['origins',JSON.stringify(origins)],['suppliers','[]'],['enlace_demo_v1',JSON.stringify({products})]]);
 const context={
  edDeliveryIsQuarantined:()=>false,edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:inventory,state:{products},
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>[],
  ED_PRODUCT_ORIGINS_KEY:'associations',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',
  localStorage:{getItem:key=>values.get(key)??null},
  document:{getElementById:()=>({querySelectorAll:()=>checked.map(value=>({value}))})},
  alert:()=>{},confirm:()=>{checked=after.slice();return true},
  edDeliveryPersistAndInvalidate:(key,value)=>{writes++;values.set(key,JSON.stringify(value));return true},
  adminTab:()=>{}
 };
 vm.createContext(context);vm.runInContext(source,context);
 assert.equal(context.edDeliveryUnlinkWarehouseProducts('w1'),expected,label);
 assert.equal(writes,expected?1:0,label+' writes');
 const saved=JSON.parse(values.get('associations'));
 assert.deepEqual(saved.p3,original.p3,label+' unrelated product');
 if(!expected)assert.deepEqual(saved,original,label+' rollback/no change');
 else for(const key of before)assert.ok(!saved[key].includes('w1'),label+' selected product');
}
console.log('PASS exact unlink: changed/reduced/stable partial/stable multiproduct/reordered; unrelated associations preserved');
