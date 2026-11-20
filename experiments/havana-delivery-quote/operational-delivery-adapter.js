'use strict';
// Offline integration between operational records and the multiproduct preview.
// Never calls Geoapify, Supabase or checkout; rejects incomplete associations.
function assembleDeliveryContext({cart,products,warehouses,suppliers,inventory,destination,routes,rateCupPerKm,contextRevision}={}){
 const fail=reason=>({status:'PENDIENTE',reason});
 if(!Array.isArray(cart)||!cart.length||!Array.isArray(products)||!Array.isArray(warehouses)||!Array.isArray(inventory)||!Array.isArray(routes))return fail('INCOMPLETE_OPERATIONAL_DATA');
 if(!destination||typeof destination.id!=='string'||!destination.id||destination.active===false)return fail('DESTINATION_UNAVAILABLE');
 if(!Number.isSafeInteger(contextRevision)||contextRevision<0)return fail('INVALID_REVISION');
 const productById=new Map(products.map(p=>[p.id,p]));
 const warehouseById=new Map(warehouses.map(w=>[w.id,w]));
 if(productById.size!==products.length||warehouseById.size!==warehouses.length)return fail('DUPLICATE_MASTER_DATA');
 const items=[],originIds=new Set();
 for(const entry of cart){
  const p=productById.get(entry?.productId);
  if(!p||p.published===false||!Number.isSafeInteger(entry.quantity)||entry.quantity<1)return fail('INVALID_CART_PRODUCT');
  const stocks=inventory.filter(s=>s.productId===entry.productId&&s.active!==false);
  const eligible=[];
  for(const stock of stocks){
   const w=warehouseById.get(stock.warehouseId);
   if(!w||w.active===false)continue;
   if(w.type==='propio'&&(!Number.isSafeInteger(stock.quantity)||stock.quantity<entry.quantity))continue;
   if(w.type==='proveedor'&&(!Array.isArray(suppliers)||!suppliers.some(s=>s.id===w.supplierId&&s.active!==false)))continue;
   if(!eligible.includes(w.id))eligible.push(w.id);
  }
  if(!eligible.length)return fail('NO_ELIGIBLE_WAREHOUSE');
  for(const id of eligible)originIds.add(id);
  items.push({productId:p.id,quantity:entry.quantity,originIds:eligible,specialFeeCup:p.deliveryType==='especial'?p.specialFeeCup:null});
 }
 const origins=[...originIds].map(id=>warehouseById.get(id));
 const neededRoutes=routes.filter(r=>originIds.has(r.originId)&&r.destinationId===destination.id);
 return {status:'READY_FOR_PREVIEW',items,origins,suppliers:suppliers||[],destinationId:destination.id,routes:neededRoutes,rateCupPerKm,contextRevision};
}
function previewOperationalDelivery(data){
 const context=assembleDeliveryContext(data);
 if(context.status!=='READY_FOR_PREVIEW')return context;
 const engine=(typeof require==='function'?require('./multiproduct-delivery-preview.js'):globalThis.EDDeliveryPreview);
 if(!engine?.calculateDeliveryPreview)return {status:'PENDIENTE',reason:'PREVIEW_ENGINE_UNAVAILABLE'};
 return engine.calculateDeliveryPreview({...context,trustProvider:false});
}
if(typeof module!=='undefined'&&module.exports)module.exports={assembleDeliveryContext,previewOperationalDelivery};
if(typeof window!=='undefined')window.EDOperationalDelivery=Object.freeze({assembleDeliveryContext,previewOperationalDelivery});
