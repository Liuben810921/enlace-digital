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


const prepareFrom=html.indexOf('function edDeliveryPrepareShipment(){');
const prepareTo=html.indexOf('const ED_DELIVERY_DRAFT_KEY=',prepareFrom);
assert(prepareFrom>=0&&prepareTo>prepareFrom,'Missing shipment preparation');
const output={textContent:''},shipmentStore={origins:'v1',suppliers:'v1',destinations:'v1',links:'v1','enlace_demo_v1':'v1'};
let mutateDuringBasket=false;
const preparationContext={
 document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDemoProduct'?{selectedOptions:[{value:'p1'}]}:id==='edQuoteDemoDestination'?{value:'d1'}:null},
 localStorage:{getItem:k=>shipmentStore[k]??null},
 ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',ED_PRODUCT_ORIGINS_KEY:'links',
 edDeliveryContextRevision:()=>1,edDeliveryIsQuarantined:()=>false,
 edDeliveryDestinationsRead:()=>[{id:'d1',name:'Habana',municipality:'Plaza'}],
 edDeliveryOriginsRead:()=>[{id:'w1',name:'Central'}],edDeliverySuppliersRead:()=>[],
 edDeliveryQuoteDemoBasket:()=>{if(mutateDuringBasket)shipmentStore.origins='v2';return {groups:[{productId:'p1',origins:[{id:'w1',name:'Central'}]}],origins:[{id:'w1',name:'Central'}]};},
 state:{products:[{id:'p1',name:'Laptop'}]}
};
vm.createContext(preparationContext);
vm.runInContext(html.slice(prepareFrom,prepareTo),preparationContext,{timeout:1000});
assert.equal(preparationContext.edDeliveryPrepareShipment(),true);
mutateDuringBasket=true;
assert.equal(preparationContext.edDeliveryPrepareShipment(),false);
assert.match(output.textContent,/dependencias cambiaron/);
console.log('PASS: 2 focused shipment preparation cases (normal and changed dependencies)');


const reconcileFrom=html.indexOf('function edDeliveryReconcileShipmentDraft(){');
const reconcileTo=html.indexOf('function edDeliveryDeleteShipmentDraft(){',reconcileFrom);
assert(reconcileFrom>=0&&reconcileTo>reconcileFrom,'Missing draft reconciliation');
function testReconcile(changeDuringConfirmation){
 const draft={version:1,status:'PENDIENTE',productIds:['p1'],destinationId:'d1',warehouseIds:['old']};
 const store={draft:JSON.stringify(draft),inventory:'v1',associations:'v1',origins:'v1',suppliers:'v1',destinations:'v1'};
 const output={textContent:''},products={options:[{value:'p1',selected:false}]},destinations={options:[{value:'d1'}],value:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDemoProduct'?products:id==='edQuoteDemoDestination'?destinations:null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_KEY:'draft',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',ED_PRODUCT_ORIGINS_KEY:'associations',
  edDeliveryContextRevision:()=>1,edDeliveryIsQuarantined:()=>false,edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],
  edDeliveryQuoteDemoBasket:()=>({origins:[{id:'new'}]}),
  confirm:()=>{if(changeDuringConfirmation)store.origins='v2';return true},
  edQuoteDemoSelectionRemember:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(html.slice(reconcileFrom,reconcileTo),ctx,{timeout:1000});
 const result=ctx.edDeliveryReconcileShipmentDraft();
 return {result,stored:JSON.parse(store.draft).warehouseIds[0],message:output.textContent};
}
const normalReconcile=testReconcile(false),conflictedReconcile=testReconcile(true);
assert.equal(normalReconcile.result,true);
assert.equal(normalReconcile.stored,'new');
assert.equal(conflictedReconcile.result,false);
assert.equal(conflictedReconcile.stored,'old');
assert.match(conflictedReconcile.message,/dependencias cambiaron/);
console.log('PASS: 2 focused reconciliation cases (normal and changed during confirmation)');


const restoreFrom=html.indexOf('function edDeliveryRestoreArchivedDraft(){');
const restoreTo=html.indexOf('function edDeliveryDeleteArchivedDraft(){',restoreFrom);
assert(restoreFrom>=0&&restoreTo>restoreFrom,'Missing archive restoration');
function testArchiveRestore(stale,changeOnConfirm){
 const snapshot={inventory:'i',associations:'a',origins:'o',suppliers:'s',destinations:'d',revision:1};
 const item={id:'arch',name:'test',version:1,status:'PENDIENTE',productIds:['p'],destinationId:'d1',warehouseIds:['w'],snapshot:{...snapshot}};
 if(stale)item.snapshot.origins='OLD';
 const store={archive:JSON.stringify([item]),draft:'OLD','enlace_demo_v1':'i',links:'a',origins:'o',suppliers:'s',destinations:'d'};
 const output={textContent:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDraftArchive'?{value:'arch'}:null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_DELIVERY_DRAFT_KEY:'draft',ED_PRODUCT_ORIGINS_KEY:'links',
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryContextRevision:()=>1,edDeliveryIsQuarantined:()=>false,edDeliveryDestinationsRead:()=>[{id:'d1'}],
  edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],edDeliveryQuoteDemoBasket:()=>({origins:[{id:'w'}]}),
  confirm:()=>{if(changeOnConfirm)store.origins='CHANGED';return true},edDeliveryLoadShipmentDraft:()=>true
 };
 vm.createContext(ctx);vm.runInContext(html.slice(restoreFrom,restoreTo),ctx,{timeout:1000});
 return {result:ctx.edDeliveryRestoreArchivedDraft(),draft:store.draft};
}
const restored=testArchiveRestore(false,false),staleArchive=testArchiveRestore(true,false),changedArchive=testArchiveRestore(false,true);
assert.equal(restored.result,true);
assert.notEqual(restored.draft,'OLD');
assert.equal(staleArchive.result,false);assert.equal(staleArchive.draft,'OLD');
assert.equal(changedArchive.result,false);assert.equal(changedArchive.draft,'OLD');
console.log('PASS: 3 focused archive restore cases (valid, stale, changed during confirmation)');


const assignFrom=html.indexOf('function edDeliveryAssignProductWarehouse(){');
const assignTo=html.indexOf('function ',assignFrom+12);
assert(assignFrom>=0&&assignTo>assignFrom,'Missing product warehouse assignment');
function testAssignmentDuplicate(duplicate){
 const products=[{id:'p1',origen_producto:'propio'}];
 const origins=[{id:'w1',type:'propio',active:true,name:'Principal'}];
 if(duplicate)origins.push({...origins[0]});
 const store={links:'{}',origins:JSON.stringify(origins),suppliers:'[]','enlace_demo_v1':JSON.stringify({products})};
 const alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,edInventoryLoaded:true,edInventoryPendingSaves:0,
  edInventorySnapshot:JSON.stringify(products),state:{products},
  document:{getElementById:id=>({edAssignProduct:{value:'p1'},edAssignWarehouse:{value:'w1'},edAssignOperation:{value:'add'}})[id]},
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>[],
  localStorage:{getItem:k=>store[k]??null},
  ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',
  alert:m=>alerts.push(m),confirm:()=>false
 };
 vm.createContext(ctx);vm.runInContext(html.slice(assignFrom,assignTo),ctx,{timeout:1000});
 ctx.edDeliveryAssignProductWarehouse();
 return alerts;
}
assert.match(testAssignmentDuplicate(true).join(' '),/identificadores duplicados/);
assert.equal(testAssignmentDuplicate(false).length,0);
console.log('PASS: 2 focused assignment cases (duplicate IDs rejected; valid IDs reach confirmation)');


const transferFrom=html.indexOf('function edDeliverySupplierTransferWarehouses(');
const transferTo=html.indexOf('\nfunction ',transferFrom+12);
assert(transferFrom>=0&&transferTo>transferFrom,'Missing supplier transfer');
function testSupplierTransferIds(duplicate){
 const suppliers=[{id:'s1',name:'Origen',active:true},{id:'s2',name:'Destino',active:true}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s1',active:true,name:'Almacen'}];
 if(duplicate)origins.push({...origins[0]});
 const store={links:'{}',origins:JSON.stringify(origins),suppliers:JSON.stringify(suppliers)},alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,edDeliverySuppliersRead:()=>suppliers,edDeliveryOriginsRead:()=>origins,
  edInventoryLoadGeneration:0,edInventorySnapshot:'[]',
  ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',
  localStorage:{getItem:k=>store[k]??null},
  document:{getElementById:id=>id==='edTransferWarehouses-s1'?{querySelectorAll:()=>[{value:'w1'}]}:id==='edTransferSupplier-s1'?{value:'s2'}:id==='edTransferMakeDefault-s1'?{checked:false}:null},
  alert:m=>alerts.push(m),confirm:()=>false
 };
 vm.createContext(ctx);vm.runInContext(html.slice(transferFrom,transferTo),ctx,{timeout:1000});
 ctx.edDeliverySupplierTransferWarehouses('s1');
 return alerts;
}
assert.match(testSupplierTransferIds(true).join(' '),/Identificadores duplicados/);
assert.equal(testSupplierTransferIds(false).length,0);
console.log('PASS: 2 supplier transfer checks (duplicate records blocked; valid IDs reach confirmation)');


function extractDeliveryFunction(name){
 const start=html.indexOf('function '+name+'('),end=html.indexOf('\nfunction ',start+12);
 assert(start>=0&&end>start,'Missing '+name);
 return html.slice(start,end);
}
function testBulkMunicipality(name,conflict){
 const warehouse=name==='edDeliveryOriginsMoveSelected',key=warehouse?'origins':'destinations';
 const item={id:'x',name:'X',municipality:'Plaza',lat:23.1,lng:-82.4,version:1};
 const store={[key]:JSON.stringify([item])};let persisted=null;const alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,
  document:{getElementById:id=>id===(warehouse?'edOriginBulkSelection':'edDestinationBulkSelection')?{disabled:false,querySelectorAll:()=>[{value:'x'}]}:id===(warehouse?'edOriginBulkMunicipality':'edDestinationBulkMunicipality')?{value:'Centro Habana'}:null},
  municipios:['Plaza','Centro Habana'],localStorage:{getItem:k=>store[k]??null},
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryOriginsRead:()=>[item],edDeliveryDestinationsRead:()=>[item],
  alert:m=>alerts.push(m),confirm:()=>{if(conflict)store[key]='changed';return true},
  edDeliveryPersistAndInvalidate:(k,v)=>{persisted=v;return true},adminTab:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction(name),ctx,{timeout:1000});
 const result=ctx[name]();
 if(conflict){assert.equal(result,false);assert.equal(persisted,null);assert(alerts.length>0);}
 else{assert.equal(result,true);assert.equal(persisted[0].municipality,'Centro Habana');assert.equal(persisted[0].lat,null);assert.equal(persisted[0].lng,null);}
}
for(const name of ['edDeliveryOriginsMoveSelected','edDeliveryDestinationsMoveSelected']){
 testBulkMunicipality(name,false);testBulkMunicipality(name,true);
}
function testSupplierTransferExecution(conflict){
 const suppliers=[{id:'s1',name:'Origen',active:true},{id:'s2',name:'Destino',active:true}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s1',active:true,name:'Almacen',version:1}];
 const products=[{id:'p1',origen_producto:'proveedor'}];
 const store={links:JSON.stringify({p1:['w1']}),origins:JSON.stringify(origins),suppliers:JSON.stringify(suppliers),'enlace_demo_v1':JSON.stringify({products})};
 let saved=null;const alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,edDeliverySuppliersRead:()=>suppliers,edDeliveryOriginsRead:()=>origins,
  edInventoryLoaded:true,edInventoryPendingSaves:0,edInventoryLoadGeneration:1,
  edInventorySnapshot:JSON.stringify(products),state:{products},
  ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',
  localStorage:{getItem:k=>store[k]??null},
  document:{getElementById:id=>id==='edTransferWarehouses-s1'?{querySelectorAll:()=>[{value:'w1'}]}:id==='edTransferSupplier-s1'?{value:'s2'}:id==='edTransferMakeDefault-s1'?{checked:false}:null},
  alert:m=>alerts.push(m),confirm:()=>{if(conflict)store.links='changed';return true},
  edDeliveryPersistAndInvalidate:(k,v)=>{saved=v;return true},adminTab:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliverySupplierTransferWarehouses'),ctx,{timeout:1000});
 const result=ctx.edDeliverySupplierTransferWarehouses('s1');
 if(conflict){assert.equal(result,false);assert.equal(saved,null);assert(alerts.length>0);}
 else{assert.equal(result,true);assert.equal(saved[0].supplierId,'s2');assert.equal(saved[0].id,'w1');assert.deepEqual(JSON.parse(store.links),{p1:['w1']});}
}
testSupplierTransferExecution(false);testSupplierTransferExecution(true);
console.log('PASS: 6 execution cases (supplier transfer, warehouse and destination bulk moves; success and conflict)');
