// Offline focused test. Run: node experiments/havana-delivery-quote/test-product-warehouse-links.cjs
// Reads the exact local index.html; no network, browser, real orders or external services.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../../index.html'),'utf8');
const from=html.indexOf('function edDeliveryQuoteDemoEligible('),to=html.indexOf('function edDeliveryPrepareShipment()',from);
assert(from>=0&&to>from,'Missing exact delivery functions in index.html');
const products=[{id:'p1',origen_producto:'propio'},{id:'p2',origen_producto:'proveedor'}];
const origins=[{id:'w1',type:'propio',active:true},{id:'w2',type:'proveedor',supplierId:'s1',active:true}];
const suppliers=[{id:'s1',active:true}];
const store={'enlace_demo_v1':JSON.stringify({products}),links:JSON.stringify({p1:['w1'],p2:['w2']})};
const context={Set,Map,JSON,Object,String,Array,edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},ED_PRODUCT_ORIGINS_KEY:'links',localStorage:{getItem:k=>store[k]??null}};
vm.createContext(context);vm.runInContext(html.slice(from,to),context,{timeout:1000});
const eligible=context.edDeliveryQuoteDemoEligible,basket=context.edDeliveryQuoteDemoBasket;
assert.equal(basket(['p1','p2'],origins,suppliers).origins.length,2);
assert.equal(basket(['p1','p1'],origins,suppliers),null);
assert.equal(eligible('p2',origins,[{id:'s1',active:false}]),null);
assert.equal(eligible('p1',[origins[0],{...origins[0]}],suppliers),null);
assert.equal(eligible('missing',origins,suppliers),null);
assert.equal(eligible('p1',origins,suppliers).length,1);
console.log('PASS: 6 focused product/warehouse/supplier cases (exact index.html)');
