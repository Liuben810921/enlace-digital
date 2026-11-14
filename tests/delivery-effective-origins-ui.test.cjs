'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const source=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(m[1]);
const start=source.indexOf("const ED_DELIVERY_ORIGINS_KEY="),end=source.indexOf("function deliveryBarrios(){",start);
assert(start>=0&&end>start);
const data=new Map(),elements={};const el=id=>elements[id]||(elements[id]={value:'',style:{},querySelector(){return null},querySelectorAll(){return []}});
const ctx={localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},document:{getElementById:el},esc:String,municipios:['Playa'],Date,Math,Number,JSON,alert:()=>{},adminTab:()=>{}};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
function call(expr){return vm.runInContext(expr,ctx)}
data.set('ed_delivery_suppliers_demo_v1',JSON.stringify([{id:'supplier1',name:'Proveedor ficticio',active:true},{id:'supplier2',name:'Proveedor inactivo',active:false}]));
data.set('ed_delivery_origins_demo_v1',JSON.stringify([
 {id:'own',name:'Propio',type:'propio',active:true},
 {id:'own-off',name:'Propio inactivo',type:'propio',active:false},
 {id:'sup',name:'Proveedor',type:'proveedor',supplierId:'supplier1',active:true},
 {id:'sup-off',name:'Proveedor inactivo',type:'proveedor',supplierId:'supplier2',active:true},
 {id:'other',name:'No asociado',type:'propio',active:true}
]));
data.set('ed_product_origins_demo_v1',JSON.stringify({laptop:['own','own-off','sup','sup-off']}));
assert.deepEqual(Array.from(call("edDeliveryEffectiveOrigins('laptop','propio',null)"),x=>x.id),['own']);
assert.deepEqual(Array.from(call("edDeliveryEffectiveOrigins('laptop','proveedor','supplier1')"),x=>x.id),['sup']);
assert.equal(call("edDeliveryEffectiveOrigins('laptop','proveedor','supplier2').length"),0);
assert.equal(call("edDeliveryEffectiveOrigins('unassigned','propio',null).length"),0);
assert.equal(call("edDeliveryOriginEligible('other','propio',null)"),true);
el('porigin').value='propio';
assert.doesNotMatch(call("edProductOriginsPanel('new','laptop')"),/Propio inactivo/);
assert.doesNotMatch(call("edProductOriginsPanel('new','laptop')"),/Proveedor inactivo/);
el('porigin').value='proveedor';
assert.doesNotMatch(call("edDeliverySupplierOptions('')"),/Proveedor inactivo/);
console.log('PASS: product origin eligibility excludes inactive suppliers, inactive warehouses and unassigned dispatch origins');
