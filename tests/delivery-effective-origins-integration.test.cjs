'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
for(const s of scripts)new vm.Script(s);
const source=scripts.join('\n'),start=source.indexOf('const ED_DELIVERY_ORIGINS_KEY='),end=source.indexOf('function deliveryBarrios(){',start);
assert(start>=0&&end>start);
const storage=new Map(),nodes={};
const el=id=>nodes[id]||(nodes[id]={value:'',style:{},querySelector(){return null},querySelectorAll(){return []}});
const ctx={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{getElementById:el},esc:String,municipios:['Playa'],Date,Math,Number,JSON,alert:message=>{ctx.warning=message},adminTab:()=>{}};
vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);
const call=expr=>vm.runInContext(expr,ctx);
const set=(key,v)=>storage.set(key,JSON.stringify(v));
set('ed_delivery_suppliers_demo_v1',[{id:'s1',name:'Proveedor uno',active:true},{id:'s2',name:'Proveedor dos',active:false}]);
set('ed_delivery_origins_demo_v1',[
 {id:'a',name:'Almacén A',type:'propio',active:true},
 {id:'b',name:'Almacén B',type:'proveedor',supplierId:'s1',active:true},
 {id:'c',name:'Almacén C',type:'proveedor',supplierId:'s2',active:true},
 {id:'d',name:'Almacén D',type:'propio',active:false}
]);
set('ed_product_origins_demo_v1',{item:['c','b']});
el('porigin').value='proveedor';
assert.match(call("edProductOriginsPanel('new','item')"),/Almacén B/);
assert.doesNotMatch(call("edProductOriginsPanel('new','item')"),/Almacén C/);
const snap=call('edDeliveryQuoteSnapshot()');
assert.equal(call("edProductOriginsSave('item',['a','b'])"),true);
assert.equal(call('edDeliveryQuoteStillValid('+JSON.stringify(snap)+')'),false);
assert.equal(call("edProductOriginsSave('item',['a','a'])"),false);
assert.equal(call("edProductOriginsSave('item',['c'])"),false);
assert.equal(call("edProductOriginsSave('item',['d'])"),false);
assert.equal(call("edProductOriginsSave('item',['unknown'])"),false);
assert.deepEqual(JSON.parse(storage.get('ed_product_origins_demo_v1')).item,['a','b']);
const after=call('edDeliveryQuoteSnapshot()');
call("edDeliverySupplierToggle('s1')");
assert.equal(call('edDeliveryQuoteStillValid('+JSON.stringify(after)+')'),false);
assert.equal(call("edDeliveryEffectiveOrigins('item','proveedor','s1').length"),0);
assert.equal(call("edProductOriginsSave('item',['b'])"),false);
const activeSnap=call('edDeliveryQuoteSnapshot()');
call("edDeliveryOriginToggle('a')");
assert.equal(call('edDeliveryQuoteStillValid('+JSON.stringify(activeSnap)+')'),false);
assert.equal(call("edDeliveryEffectiveOrigins('item','propio',null).length"),0);
el('porigin').value='propio';
assert.doesNotMatch(call("edProductOriginsPanel('new','unassigned')"),/checked/);
console.log('PASS product association, inactive supplier/warehouse, stale quote invalidation, no automatic warehouse assignment');
