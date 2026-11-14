'use strict';
// Synthetic isolated transaction laboratory. Not imported by the operational shop.
(function(root){
 const KEY='ed_synthetic_product_bundle_v1', QUARANTINE='ed_synthetic_bundle_quarantine_v1';
 function create(store){
  let sessionQuarantine=false;
  const read=()=>{const raw=store.getItem(KEY);if(raw===null)return {revision:0,operations:{},products:{}};const v=JSON.parse(raw);if(!v||!Number.isSafeInteger(v.revision)||v.revision<0||!v.operations||!v.products)throw Error('corrupt bundle');return v};
  const blocked=()=>sessionQuarantine||store.getItem(QUARANTINE)!==null;
  const quarantine=()=>{sessionQuarantine=true;try{store.setItem(QUARANTINE,'1')}catch(_){}};
  function commit(request,context){
   if(blocked())return {ok:false,reason:'quarantine'};
   let before;
   try{
    before=store.getItem(KEY);
    const data=read(),suppliers=context.suppliers||[],warehouses=context.warehouses||[];
    if(!request||typeof request.operationId!=='string'||!request.operationId.trim()||typeof request.productId!=='string'||!request.productId.trim()||!['proveedor','propio'].includes(request.type)||!Array.isArray(request.warehouseIds)||request.warehouseIds.length===0||new Set(request.warehouseIds).size!==request.warehouseIds.length)return {ok:false,reason:'invalid_request'};
    const canonical=JSON.stringify({productId:request.productId,type:request.type,supplierId:request.type==='proveedor'?request.supplierId:null,warehouseIds:[...request.warehouseIds].sort()});
    const existing=data.operations[request.operationId];
    if(existing)return existing.canonical===canonical?{ok:true,replayed:true,record:existing.record}:{ok:false,reason:'idempotency_conflict'};
    if(context.quarantined||!Number.isSafeInteger(context.revision)||context.revision<0||context.revision!==data.revision)return {ok:false,reason:'stale_revision'};
    if(data.products[request.productId])return {ok:false,reason:'product_conflict'};
    const supplier=request.type==='proveedor'?suppliers.find(s=>s.id===request.supplierId&&s.active!==false):null;
    if(request.type==='proveedor'&&!supplier)return {ok:false,reason:'inactive_supplier'};
    if(request.warehouseIds.some(id=>!warehouses.some(w=>w.id===id&&w.active!==false&&w.type===request.type&&(request.type==='propio'||w.supplierId===supplier.id))))return {ok:false,reason:'invalid_warehouse'};
    const record={id:request.productId,type:request.type,supplierId:supplier?.id||null,warehouseIds:[...request.warehouseIds],published:false,status:'draft',revision:data.revision+1};
    data.products[request.productId]=record;
    data.operations[request.operationId]={canonical,record};
    data.revision++;
    try{store.setItem(KEY,JSON.stringify(data))}
    catch(e){
     try{if(store.getItem(KEY)!==before){if(before===null)store.removeItem(KEY);else store.setItem(KEY,before)}}
     catch(rollbackError){quarantine();return {ok:false,reason:'rollback_failed'}}
     if(store.getItem(KEY)!==before){quarantine();return {ok:false,reason:'rollback_failed'}}
     return {ok:false,reason:'write_failed'};
    }
    return {ok:true,replayed:false,record};
   }catch(e){quarantine();return {ok:false,reason:'storage_unreadable'}}
  }
  return {commit,read,blocked};
 }
 const api={create,KEY,QUARANTINE};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.EDSyntheticProductBundle=api;
})(typeof window!=='undefined'?window:globalThis);
