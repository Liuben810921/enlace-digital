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


function testBulkProductAssignment(duplicate,conflict){
 const products=[{id:'p1',origen_producto:'propio'},{id:'p2',origen_producto:'propio'}],origins=[{id:'w1',name:'Almacen',type:'propio',active:true}];
 if(duplicate)origins.push({...origins[0]});
 const store={links:'{}',origins:JSON.stringify(origins),suppliers:'[]','enlace_demo_v1':JSON.stringify({products})};
 let persisted=null;const alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},
  document:{getElementById:id=>id==='edQuoteDemoProduct'?{selectedOptions:[{value:'p1'},{value:'p2'}]}:id==='edAssignWarehouse'?{value:'w1'}:id==='edAssignOperation'?{value:'add'}:null},
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>[],ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',
  localStorage:{getItem:k=>store[k]??null},alert:m=>alerts.push(m),confirm:()=>{if(conflict)store.links='changed';return true},
  edDeliveryPersistAndInvalidate:(k,v)=>{persisted=v;return true},adminTab:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryBulkAssignSelectedProducts'),ctx,{timeout:1000});
 const result=ctx.edDeliveryBulkAssignSelectedProducts();
 if(duplicate||conflict){assert.equal(result,false);assert.equal(persisted,null);assert(alerts.length>0);}
 else{assert.equal(result,true);assert.equal(JSON.stringify(persisted),JSON.stringify({p1:['w1'],p2:['w1']}));}
}
testBulkProductAssignment(false,false);testBulkProductAssignment(true,false);testBulkProductAssignment(false,true);
function testBulkArchiveDestinations(conflict){
 const draft={id:'a',version:1,status:'PENDIENTE',productIds:['p1'],destinationId:'old',warehouseIds:['w1']};
 const store={archive:JSON.stringify([draft]),links:'l',origins:'o',suppliers:'s',destinations:'d'};
 const output={textContent:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDemoDestination'?{value:'new'}:null},
  edDeliveryIsQuarantined:()=>false,edDeliveryDestinationsRead:()=>[{id:'new',name:'Centro'}],edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],
  edDeliveryQuoteDemoBasket:()=>({origins:[{id:'w1'}]}),localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryContextRevision:()=>1,confirm:()=>{if(conflict)store.origins='changed';return true}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryBulkReassignArchivedDestinations'),ctx,{timeout:1000});
 const result=ctx.edDeliveryBulkReassignArchivedDestinations();
 assert.equal(result,!conflict);assert.equal(JSON.parse(store.archive)[0].destinationId,conflict?'old':'new');
}
testBulkArchiveDestinations(false);testBulkArchiveDestinations(true);
console.log('PASS: 5 multiproduct and archive bulk operation cases');


function testBulkSupplierTransfer(mode){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const suppliers=[{id:'s1',active:true},{id:'s2',active:true}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s1',active:true,version:1},{id:'w2',type:'proveedor',supplierId:'s1',active:true,version:1}];
 if(mode==='duplicate')origins.push({...origins[0]});
 const links={p1:['w1','w2'],p2:['w2']};
 const store={origins:JSON.stringify(origins),suppliers:JSON.stringify(suppliers),links:JSON.stringify(links),'enlace_demo_v1':JSON.stringify({products})};
 let saved=null;const alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,
  document:{getElementById:id=>id==='edOriginBulkSelection'?{disabled:false,querySelectorAll:()=>mode==='partial'?[{value:'w1'}]:[{value:'w1'},{value:'w2'}]}:id==='edOriginBulkSupplier'?{value:'s2'}:null},
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>suppliers,
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_PRODUCT_ORIGINS_KEY:'links',
  localStorage:{getItem:k=>store[k]??null},
  edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},
  alert:m=>alerts.push(m),confirm:()=>{if(mode==='conflict')store.links='changed';return true},
  edDeliveryPersistAndInvalidate:(k,v)=>{saved=v;return true},adminTab:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryOriginsTransferSelectedSupplier'),ctx,{timeout:1000});
 const result=ctx.edDeliveryOriginsTransferSelectedSupplier();
 if(mode==='success'){
  assert.equal(result,true);assert.equal(saved.length,2);
  assert(saved.every(o=>o.supplierId==='s2'&&o.version===2));
  assert.equal(store.links,JSON.stringify(links));
 }else{
  assert.equal(result,false);assert.equal(saved,null);assert(alerts.length>0);
  if(mode!=='conflict')assert.equal(store.links,JSON.stringify(links));
 }
}
for(const mode of ['success','partial','duplicate','conflict'])testBulkSupplierTransfer(mode);
console.log('PASS: 4 bulk supplier transfer cases with two products and preserved associations');


function testArchivedSingleEdit(name,conflict){
 const draft={id:'a',name:'Version',version:1,status:'PENDIENTE',productIds:['p1'],destinationId:'old',warehouseIds:['w1']};
 const store={archive:JSON.stringify([draft]),'enlace_demo_v1':'inventory',links:'{}',origins:'[]',suppliers:'[]',destinations:'[]'};
 const output={textContent:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDraftArchive'?{value:'a'}:id==='edQuoteDemoDestination'?{value:'new'}:id==='edQuoteDemoProduct'?{selectedOptions:[{value:'p1'},{value:'p2'}]}:null},
  edDeliveryIsQuarantined:()=>false,edDeliveryDestinationsRead:()=>[{id:'old'},{id:'new',name:'Nuevo'}],
  edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],edDeliveryQuoteDemoBasket:()=>({origins:[{id:'w1'}]}),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryContextRevision:()=>1,confirm:()=>{if(conflict)store.links='changed';return true}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction(name),ctx,{timeout:1000});
 const result=ctx[name](),updated=JSON.parse(store.archive)[0];
 assert.equal(result,!conflict);
 if(conflict){assert.equal(updated.destinationId,'old');assert.equal(JSON.stringify(updated.productIds),JSON.stringify(['p1']));}
 else if(name==='edDeliveryReplaceArchivedDraftProducts'){assert.equal(updated.destinationId,'old');assert.equal(JSON.stringify(updated.productIds),JSON.stringify(['p1','p2']));}
 else{assert.equal(updated.destinationId,'new');assert.equal(JSON.stringify(updated.productIds),JSON.stringify(['p1']));}
}
for(const name of ['edDeliveryReplaceArchivedDraftProducts','edDeliveryReassignArchivedDraftDestination']){
 testArchivedSingleEdit(name,false);testArchivedSingleEdit(name,true);
}
console.log('PASS: 4 archived single-edit cases (success and confirmation-time dependency conflict)');


function testBulkArchivedProductReconciliation(mode){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const archive=[{id:'a',version:1,status:'PENDIENTE',productIds:['p1'],destinationId:'d',warehouseIds:mode==='stale'?['old']:['w1']},{id:'b',version:1,status:'PENDIENTE',productIds:['p2'],destinationId:'d',warehouseIds:['w2']}];
 const store={archive:JSON.stringify(archive),'enlace_demo_v1':JSON.stringify({products}),links:JSON.stringify({p1:['w1'],p2:['w2']}),origins:'o',suppliers:'s',destinations:'d'};
 const output={textContent:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDemoProduct'?{selectedOptions:[{value:mode==='stale'?'p1':'p2'}]}:id==='edQuoteArchiveProductOperation'?{value:'add'}:null},
  edDeliveryIsQuarantined:()=>false,edInventoryLoaded:true,edInventoryPendingSaves:0,state:{products},edInventorySnapshot:JSON.stringify(products),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryContextRevision:()=>1,edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],edDeliveryDestinationsRead:()=>[{id:'d'}],
  edDeliveryQuoteDemoBasket:ids=>({origins:ids.map(id=>({id:id==='p1'?'w1':'w2'}))}),
  confirm:()=>{if(mode==='conflict')store.origins='changed';return true}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryBulkEditArchivedProducts'),ctx,{timeout:1000});
 const result=ctx.edDeliveryBulkEditArchivedProducts(),updated=JSON.parse(store.archive);
 if(mode==='conflict'){assert.equal(result,false);assert.equal(JSON.stringify(updated),JSON.stringify(archive));}
 else if(mode==='stale'){
  assert.equal(result,true);assert.equal(JSON.stringify(updated[0].productIds),JSON.stringify(['p1']));
  assert.equal(JSON.stringify(updated[0].warehouseIds),JSON.stringify(['w1']));
  assert.equal(JSON.stringify(updated[1].productIds),JSON.stringify(['p2','p1']));
 }else{
  assert.equal(result,true);assert.equal(JSON.stringify(updated[0].productIds),JSON.stringify(['p1','p2']));
  assert.equal(JSON.stringify(updated[1]),JSON.stringify(archive[1]));
 }
}
for(const mode of ['success','stale','conflict'])testBulkArchivedProductReconciliation(mode);
console.log('PASS: 3 bulk archived multiproduct edit cases including stale warehouse reconciliation');


function testBulkArchivedDestinationReconciliation(mode){
 const drafts=[
  {id:'a',version:1,status:'PENDIENTE',productIds:['p1','p2'],destinationId:'old',warehouseIds:['w1','w2']},
  {id:'b',version:1,status:'PENDIENTE',productIds:['p2'],destinationId:'new',warehouseIds:['w2']},
  {id:'c',version:1,status:'PENDIENTE',productIds:['p1'],destinationId:'new',warehouseIds:['stale']}
 ];
 const store={archive:JSON.stringify(drafts),links:'links',origins:'origins',suppliers:'suppliers',destinations:'destinations','enlace_demo_v1':'inventory'};
 const output={textContent:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDemoDestination'?{value:'new'}:null},
  edDeliveryIsQuarantined:()=>false,edDeliveryDestinationsRead:()=>[{id:'new',name:'Nuevo'}],
  edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],
  edDeliveryQuoteDemoBasket:ids=>({origins:ids.map(id=>({id:id==='p1'?'w1':'w2'}))}),
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryContextRevision:()=>1,confirm:()=>{if(mode==='conflict')store.links='changed';return true}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryBulkReassignArchivedDestinations'),ctx,{timeout:1000});
 const result=ctx.edDeliveryBulkReassignArchivedDestinations(),updated=JSON.parse(store.archive);
 if(mode==='conflict'){
  assert.equal(result,false);assert.equal(JSON.stringify(updated),JSON.stringify(drafts));
 }else{
  assert.equal(result,true);
  assert.equal(updated[0].destinationId,'new');assert.equal(JSON.stringify(updated[0].warehouseIds),JSON.stringify(['w1','w2']));
  assert.equal(JSON.stringify(updated[1]),JSON.stringify(drafts[1]));
  assert.equal(JSON.stringify(updated[2].warehouseIds),JSON.stringify(['w1']));
  assert(updated[0].snapshot&&updated[2].snapshot);
 }
}
testBulkArchivedDestinationReconciliation('success');
testBulkArchivedDestinationReconciliation('conflict');
console.log('PASS: 2 bulk archived destination scenarios with multiproduct preservation and stale warehouse reconciliation');


function testBulkSupplierMixedOwnershipRepair(mode){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s1',active:true},{id:'w2',type:'proveedor',supplierId:'s2',active:true}];
 const suppliers=[{id:'s1',active:true},{id:'s2',active:true}],links={p1:['w1','w2'],p2:['w1']};
 const store={origins:JSON.stringify(origins),suppliers:JSON.stringify(suppliers),links:JSON.stringify(links),'enlace_demo_v1':JSON.stringify({products})};
 let saved=null;const alerts=[];
 const ctx={
  edDeliveryIsQuarantined:()=>false,
  document:{getElementById:id=>id==='edOriginBulkSelection'?{disabled:false,querySelectorAll:()=>[{value:mode==='reject'?'w2':'w1'}]}:id==='edOriginBulkSupplier'?{value:'s2'}:null},
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>suppliers,
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_PRODUCT_ORIGINS_KEY:'links',
  localStorage:{getItem:k=>store[k]??null},
  edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},
  alert:m=>alerts.push(m),confirm:()=>{if(mode==='conflict')store.links='changed';return true},
  edDeliveryPersistAndInvalidate:(k,v)=>{saved=v;return true},adminTab:()=>{}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryOriginsTransferSelectedSupplier'),ctx,{timeout:1000});
 const result=ctx.edDeliveryOriginsTransferSelectedSupplier();
 if(mode==='success'){
  assert.equal(result,true);assert.equal(saved[0].supplierId,'s2');assert.equal(saved[1].supplierId,'s2');
  assert.equal(store.links,JSON.stringify(links));
 }else{assert.equal(result,false);assert.equal(saved,null);assert(alerts.length>0);}
}
for(const mode of ['success','conflict','reject'])testBulkSupplierMixedOwnershipRepair(mode);
console.log('PASS: 3 mixed supplier ownership repair cases');


function testReconcileAllArchivedAfterWarehouseTransfer(mode){
 const archive=[
  {id:'a',version:1,status:'PENDIENTE',productIds:['p1','p2'],destinationId:'d',warehouseIds:['old']},
  {id:'b',version:1,status:'PENDIENTE',productIds:['p2'],destinationId:'d',warehouseIds:['w2']}
 ];
 const store={archive:JSON.stringify(archive),'enlace_demo_v1':'i',links:'l',origins:'o',suppliers:'s',destinations:'d'};
 const output={textContent:''};
 const ctx={
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:null},edDeliveryIsQuarantined:()=>false,
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}},
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryDestinationsRead:()=>[{id:'d'}],edDeliveryOriginsRead:()=>[],edDeliverySuppliersRead:()=>[],
  edDeliveryQuoteDemoBasket:ids=>({origins:ids.map(id=>({id:id==='p1'?'w1':'w2'}))}),
  edDeliveryContextRevision:()=>1,confirm:()=>{if(mode==='conflict')store.origins='changed';return true}
 };
 vm.createContext(ctx);vm.runInContext(extractDeliveryFunction('edDeliveryReconcileAllArchivedDrafts'),ctx,{timeout:1000});
 const result=ctx.edDeliveryReconcileAllArchivedDrafts(),updated=JSON.parse(store.archive);
 if(mode==='conflict'){assert.equal(result,false);assert.equal(JSON.stringify(updated),JSON.stringify(archive));}
 else{
  assert.equal(result,true);assert.equal(JSON.stringify(updated[0].warehouseIds),JSON.stringify(['w1','w2']));
  assert(updated[0].snapshot);assert.equal(JSON.stringify(updated[1]),JSON.stringify(archive[1]));
 }
}
testReconcileAllArchivedAfterWarehouseTransfer('success');
testReconcileAllArchivedAfterWarehouseTransfer('conflict');
console.log('PASS: 2 archived multiproduct reconciliation cases with unchanged draft preservation');


function testSupplierTransferArchivedChain(mode){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s1',active:true,version:1},{id:'w2',type:'proveedor',supplierId:'s1',active:true,version:1}];
 const suppliers=[{id:'s1',active:true},{id:'s2',active:true}],links={p1:['w1','w2'],p2:['w2']};
 const drafts=[{id:'a',version:1,status:'PENDIENTE',productIds:['p1','p2'],destinationId:'old',warehouseIds:['obsolete']},{id:'b',version:1,status:'PENDIENTE',productIds:['p2'],destinationId:'new',warehouseIds:['w2']}];
 const store={origins:JSON.stringify(origins),suppliers:JSON.stringify(suppliers),links:JSON.stringify(links),archive:JSON.stringify(drafts),destinations:'d','enlace_demo_v1':JSON.stringify({products})};
 const output={textContent:''};let currentOrigins=origins,writes=0;
 const ctx={
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},edDeliveryIsQuarantined:()=>false,
  edDeliveryOriginsRead:()=>currentOrigins,edDeliverySuppliersRead:()=>suppliers,edDeliveryDestinationsRead:()=>[{id:'old'},{id:'new',name:'Nuevo'}],
  edDeliveryQuoteDemoBasket:ids=>({origins:ids.map(id=>({id:id==='p1'?'w1':'w2'}))}),edDeliveryContextRevision:()=>1,
  document:{getElementById:id=>id==='edOriginBulkSelection'?{disabled:false,querySelectorAll:()=>[{value:'w1'},{value:'w2'}]}:id==='edOriginBulkSupplier'?{value:'s2'}:id==='edQuoteDemoResult'?output:id==='edQuoteDemoDestination'?{value:'new'}:null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;writes++}},
  confirm:()=>{if(mode==='conflict')store.links='changed';return mode!=='reject'},
  alert:()=>{},adminTab:()=>{},edDeliveryPersistAndInvalidate:(k,v)=>{store[k]=JSON.stringify(v);currentOrigins=v;writes++;return true}
 };
 vm.createContext(ctx);
 for(const name of ['edDeliveryOriginsTransferSelectedSupplier','edDeliveryReconcileAllArchivedDrafts','edDeliveryBulkReassignArchivedDestinations'])
  vm.runInContext(extractDeliveryFunction(name),ctx,{timeout:1000});
 const transferred=ctx.edDeliveryOriginsTransferSelectedSupplier();
 if(mode!=='success'){
  assert.equal(transferred,false);assert.equal(writes,0);
  assert.equal(store.origins,JSON.stringify(origins));assert.equal(store.archive,JSON.stringify(drafts));
  return;
 }
 assert.equal(transferred,true);
 assert.equal(JSON.stringify(JSON.parse(store.origins).map(o=>o.supplierId)),JSON.stringify(['s2','s2']));
 assert.equal(store.links,JSON.stringify(links));
 assert.equal(ctx.edDeliveryReconcileAllArchivedDrafts(),true);
 const afterReconcile=JSON.parse(store.archive);
 assert.equal(JSON.stringify(afterReconcile[0].warehouseIds),JSON.stringify(['w1','w2']));
 assert.equal(JSON.stringify(afterReconcile[1]),JSON.stringify(drafts[1]));
 assert.equal(ctx.edDeliveryBulkReassignArchivedDestinations(),true);
 const afterDestination=JSON.parse(store.archive);
 assert.equal(afterDestination[0].destinationId,'new');
 assert.equal(JSON.stringify(afterDestination[0].warehouseIds),JSON.stringify(['w1','w2']));
 assert.equal(JSON.stringify(afterDestination[1]),JSON.stringify(drafts[1]));
 assert.equal(store.links,JSON.stringify(links));assert.equal(writes,3);
}
for(const mode of ['success','reject','conflict'])testSupplierTransferArchivedChain(mode);
console.log('PASS: 3 chained supplier/warehouse/multiproduct/archive scenarios (success, rejection, conflict)');


function testArchivedDependencyConflictMatrix(action,mode){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s2',active:true},{id:'w2',type:'proveedor',supplierId:'s2',active:true}];
 const links={p1:['w1','w2'],p2:['w2']};
 const archive=[
  {id:'a',version:1,status:'PENDIENTE',productIds:['p1','p2'],destinationId:'old',warehouseIds:['obsolete']},
  {id:'b',version:1,status:'PENDIENTE',productIds:['p2'],destinationId:'new',warehouseIds:['w2']}
 ];
 const store={archive:JSON.stringify(archive),links:JSON.stringify(links),origins:JSON.stringify(origins),suppliers:JSON.stringify([{id:'s2',active:true}]),destinations:'d','enlace_demo_v1':JSON.stringify({products})};
 let writes=0;const output={textContent:''};
 const ctx={
  ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edDeliveryIsQuarantined:()=>false,
  edDeliveryDestinationsRead:()=>mode==='invalid-destination'?[{id:'old'}]:[{id:'old'},{id:'new',name:'Nuevo'}],
  edDeliveryOriginsRead:()=>origins,edDeliverySuppliersRead:()=>[{id:'s2',active:true}],
  edDeliveryQuoteDemoBasket:ids=>({origins:ids.map(id=>({id:id==='p1'?'w1':'w2'}))}),
  edDeliveryContextRevision:()=>1,
  document:{getElementById:id=>id==='edQuoteDemoResult'?output:id==='edQuoteDemoDestination'?{value:'new'}:null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;writes++}},
  confirm:()=>{
   if(mode==='conflict-links')store.links='changed';
   if(mode==='conflict-inventory')store.enlace_demo_v1='changed';
   if(mode==='conflict-archive')store.archive=JSON.stringify([...archive,{id:'external'}]);
   return mode!=='cancel';
  }
 };
 vm.createContext(ctx);
 const name=action==='reconcile'?'edDeliveryReconcileAllArchivedDrafts':'edDeliveryBulkReassignArchivedDestinations';
 vm.runInContext(extractDeliveryFunction(name),ctx,{timeout:1000});
 const result=ctx[name](),updated=JSON.parse(store.archive);
 const success=mode==='success'||(action==='reconcile'&&mode==='invalid-destination');
 assert.equal(result,success,action+' '+mode+' return');
 assert.equal(writes,success?1:0,action+' '+mode+' writes');
 assert.equal(JSON.stringify(updated[1]),JSON.stringify(archive[1]),action+' '+mode+' unaffected draft');
 if(success){
  assert.equal(JSON.stringify(updated[0].warehouseIds),JSON.stringify(['w1','w2']));
  assert.equal(updated[0].destinationId,action==='reassign'?'new':'old');
  assert(updated[0].snapshot&&updated[0].reconciledAt);
 }else{
  assert.equal(JSON.stringify(updated[0]),JSON.stringify(archive[0]));
  if(mode==='conflict-archive')assert.equal(updated.length,3);
  else assert.equal(store.archive,JSON.stringify(archive));
 }
}
for(const action of ['reconcile','reassign'])
 for(const mode of ['success','cancel','conflict-links','conflict-inventory','conflict-archive','invalid-destination'])
  testArchivedDependencyConflictMatrix(action,mode);
console.log('PASS: 12 archived dependency scenarios: success, cancellation, inventory/association/archive conflicts, destination validation');


function testInventoryTransferAndMultiproductAssociations(mode){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const origins=[{id:'w1',type:'proveedor',supplierId:'s1',active:true,name:'Uno'},{id:'w2',type:'proveedor',supplierId:'s1',active:true,name:'Dos'},{id:'w3',type:'proveedor',supplierId:'s2',active:true,name:'Tres'}];
 const links={p1:['w1','w2'],p2:['w2']};
 const store={origins:JSON.stringify(origins),suppliers:JSON.stringify([{id:'s1',active:true},{id:'s2',active:true}]),links:JSON.stringify(links),'enlace_demo_v1':JSON.stringify({products})};
 let writes=0;const alerts=[];
 const ctx={
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_PRODUCT_ORIGINS_KEY:'links',
  edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},
  edDeliveryIsQuarantined:()=>false,edDeliveryOriginsRead:()=>JSON.parse(store.origins),edDeliverySuppliersRead:()=>JSON.parse(store.suppliers),
  document:{getElementById:id=>id==='edOriginBulkSelection'?{disabled:false,querySelectorAll:()=>mode==='partial-reject'?[{value:'w1'}]:[{value:'w1'},{value:'w2'}]}:
   id==='edOriginBulkSupplier'?{value:'s2'}:id==='edQuoteDemoProduct'?{selectedOptions:[{value:'p1'},{value:'p2'}]}:
   id==='edAssignWarehouse'?{value:'w3'}:id==='edAssignOperation'?{value:'replace'}:null},
  localStorage:{getItem:k=>store[k]??null},
  confirm:()=>{
   if(mode==='inventory-race'||mode==='assign-race')store.enlace_demo_v1='modified';
   if(mode==='association-race')store.links='modified';
   return true;
  },
  alert:msg=>alerts.push(msg),adminTab:()=>{},
  edDeliveryPersistAndInvalidate:(k,v)=>{store[k]=JSON.stringify(v);writes++;return true}
 };
 if(mode==='inventory-stale')store.enlace_demo_v1=JSON.stringify({products:[]});
 vm.createContext(ctx);
 const name=mode.startsWith('assign')?'edDeliveryBulkAssignSelectedProducts':'edDeliveryOriginsTransferSelectedSupplier';
 vm.runInContext(extractDeliveryFunction(name),ctx,{timeout:1000});
 const result=ctx[name](),success=mode==='full-success'||mode==='assign-success';
 assert.equal(result,success,mode+' result');
 assert.equal(writes,success?1:0,mode+' writes');
 if(!success)assert(alerts.length>0,mode+' rejection message');
 if(mode==='full-success'){
  assert.equal(JSON.stringify(JSON.parse(store.origins).map(o=>o.supplierId)),JSON.stringify(['s2','s2','s2']));
  assert.equal(store.links,JSON.stringify(links),'transfer preserves multiproduct links');
 }else if(mode==='assign-success'){
  assert.equal(JSON.stringify(JSON.parse(store.links)),JSON.stringify({p1:['w3'],p2:['w3']}));
  assert.equal(store.origins,JSON.stringify(origins),'assignment preserves warehouse records');
 }else{
  assert.equal(store.origins,JSON.stringify(origins),'rejection preserves warehouses');
  if(mode!=='association-race')assert.equal(store.links,JSON.stringify(links),'rejection preserves associations');
 }
}
for(const mode of ['partial-reject','full-success','inventory-stale','inventory-race','association-race','assign-success','assign-race'])
 testInventoryTransferAndMultiproductAssociations(mode);
console.log('PASS: 7 focused supplier transfer, inventory integrity, multiproduct association and conflict cases');


function testPartialTransferRecoveryWithArchivedReconciliation(){
 const products=[{id:'p1',origen_producto:'proveedor'},{id:'p2',origen_producto:'proveedor'}];
 const origins=[{id:'w1',name:'Uno',type:'proveedor',supplierId:'s1',active:true},{id:'w2',name:'Dos',type:'proveedor',supplierId:'s1',active:true},{id:'w3',name:'Tres',type:'proveedor',supplierId:'s2',active:true}];
 const archived=[{id:'a',version:1,status:'PENDIENTE',productIds:['p1','p2'],destinationId:'d',warehouseIds:['w1','w2']}];
 const store={origins:JSON.stringify(origins),suppliers:JSON.stringify([{id:'s1',active:true},{id:'s2',active:true}]),links:JSON.stringify({p1:['w1','w2'],p2:['w2']}),archive:JSON.stringify(archived),destinations:'d','enlace_demo_v1':JSON.stringify({products})};
 let writes=0;const alerts=[];
 const ctx={
  ED_DELIVERY_ORIGINS_KEY:'origins',ED_DELIVERY_SUPPLIERS_KEY:'suppliers',ED_PRODUCT_ORIGINS_KEY:'links',ED_DELIVERY_DRAFT_COLLECTION_KEY:'archive',ED_DELIVERY_DESTINATIONS_KEY:'destinations',
  edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),state:{products},edDeliveryIsQuarantined:()=>false,
  edDeliveryOriginsRead:()=>JSON.parse(store.origins),edDeliverySuppliersRead:()=>JSON.parse(store.suppliers),edDeliveryDestinationsRead:()=>[{id:'d'}],edDeliveryContextRevision:()=>1,
  edDeliveryQuoteDemoBasket:ids=>({origins:ids.flatMap(id=>(JSON.parse(store.links)[id]||[]).map(id=>({id})))}),
  document:{getElementById:id=>id==='edOriginBulkSelection'?{disabled:false,querySelectorAll:()=>[{value:'w2'}]}:
   id==='edOriginBulkSupplier'?{value:'s2'}:id==='edQuoteDemoProduct'?{selectedOptions:[{value:'p1'}]}:
   id==='edAssignWarehouse'?{value:'w3'}:id==='edAssignOperation'?{value:'replace'}:
   id==='edQuoteDemoResult'?{textContent:''}:null},
  localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v;writes++}},
  edDeliveryPersistAndInvalidate:(k,v)=>{store[k]=JSON.stringify(v);writes++;return true},
  confirm:()=>true,alert:m=>alerts.push(m),adminTab:()=>{}
 };
 vm.createContext(ctx);
 for(const name of ['edDeliveryOriginsTransferSelectedSupplier','edDeliveryBulkAssignSelectedProducts','edDeliveryReconcileAllArchivedDrafts'])
  vm.runInContext(extractDeliveryFunction(name),ctx,{timeout:1000});
 assert.equal(ctx.edDeliveryOriginsTransferSelectedSupplier(),false,'reject partial transfer with incompatible multiproduct links');
 assert.equal(writes,0);assert.equal(store.archive,JSON.stringify(archived));
 assert.equal(ctx.edDeliveryBulkAssignSelectedProducts(),true,'reassign incompatible product first');
 assert.equal(JSON.stringify(JSON.parse(store.links)),JSON.stringify({p1:['w3'],p2:['w2']}));
 assert.equal(ctx.edDeliveryOriginsTransferSelectedSupplier(),true,'transfer remaining warehouse after reassociation');
 assert.equal(JSON.stringify(JSON.parse(store.origins).map(o=>o.supplierId)),JSON.stringify(['s1','s2','s2']));
 assert.equal(ctx.edDeliveryReconcileAllArchivedDrafts(),true,'reconcile archived multiproduct draft');
 const updated=JSON.parse(store.archive)[0];
 assert.equal(JSON.stringify(updated.productIds),JSON.stringify(['p1','p2']));
 assert.equal(JSON.stringify(updated.warehouseIds),JSON.stringify(['w3','w2']));
 assert.equal(updated.destinationId,'d');assert.equal(writes,3);
 assert.equal(JSON.stringify(JSON.parse(store['enlace_demo_v1']).products),JSON.stringify(products));
 assert(alerts.length>0,'partial rejection must explain conflict');
}
testPartialTransferRecoveryWithArchivedReconciliation();
console.log('PASS: partial supplier transfer rejection, multiproduct reassociation, retry and archived reconciliation chain');
