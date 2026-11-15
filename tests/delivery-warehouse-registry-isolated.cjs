'use strict';
// Isolated pure domain model. In-memory fixtures only; no network, storage or real orders.
const ALLOWED_TYPES=new Set(['propio','proveedor']);
const assertId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(v);
const coordinates=(lat,lng)=>{
 if(typeof lat!=='number'||typeof lng!=='number'||!Number.isFinite(lat)||!Number.isFinite(lng)||lat < -90||lat > 90||lng < -180||lng > 180)throw Error('invalid_coordinates');
 return {lat,lng};
};
const clone=x=>structuredClone(x);
function createRegistry(){
 const suppliers=new Map(),warehouses=new Map(),productOrigins=new Map(),audit=[];
 let revision=0;
 function change(kind,id,action){revision++;audit.push({revision,kind,id,action});}
 function supplierAdd({id,name}){
  if(!assertId(id)||suppliers.has(id)||typeof name!=='string'||!name.trim())throw Error('invalid_supplier');
  suppliers.set(id,{id,name:name.trim(),active:true,version:1});change('supplier',id,'create');
 }
 function supplierEdit(id,patch){
  const s=suppliers.get(id);if(!s)throw Error('supplier_not_found');
  if(patch.name!==undefined){if(typeof patch.name!=='string'||!patch.name.trim())throw Error('invalid_name');s.name=patch.name.trim()}
  if(patch.active!==undefined){if(typeof patch.active!=='boolean')throw Error('invalid_active');s.active=patch.active}
  s.version++;change('supplier',id,'update');
 }
 function warehouseAdd({id,type,supplierId=null,name,lat,lng,active=true,address=null,addressVerified=false}){
  if(!assertId(id)||warehouses.has(id)||!ALLOWED_TYPES.has(type)||typeof name!=='string'||!name.trim()||typeof active!=='boolean')throw Error('invalid_warehouse');
  if(type==='proveedor'&&(!suppliers.has(supplierId)||!suppliers.get(supplierId).active))throw Error('supplier_required');
  if(type==='propio'&&supplierId!==null)throw Error('own_supplier_conflict');
  if(address!==null&&(typeof address!=='string'||!address.trim()||address.length>240))throw Error('invalid_address');
  if(typeof addressVerified!=='boolean'||(addressVerified&&!address))throw Error('invalid_address_verification');
  warehouses.set(id,{id,type,supplierId,name:name.trim(),...coordinates(lat,lng),active,address,addressVerified,version:1});change('warehouse',id,'create');
 }
 function warehouseEdit(id,patch,expectedVersion){
  const w=warehouses.get(id);if(!w)throw Error('warehouse_not_found');
  if(w.version!==expectedVersion)throw Error('version_conflict');
  const next={...w,...patch};
  if(!ALLOWED_TYPES.has(next.type)||typeof next.name!=='string'||!next.name.trim()||typeof next.active!=='boolean')throw Error('invalid_warehouse');
  if(next.type==='proveedor'&&(!suppliers.has(next.supplierId)||!suppliers.get(next.supplierId).active))throw Error('supplier_required');
  if(next.type==='propio'&&next.supplierId!==null)throw Error('own_supplier_conflict');
  coordinates(next.lat,next.lng);
  if(next.address!==null&&next.address!==undefined&&(typeof next.address!=='string'||!next.address.trim()||next.address.length>240))throw Error('invalid_address');
  if(typeof next.addressVerified!=='boolean'||(next.addressVerified&&!next.address))throw Error('invalid_address_verification');
  if((next.lat!==w.lat||next.lng!==w.lng||next.address!==w.address)&&patch.addressVerified!==true)next.addressVerified=false;
  const changed=next.lat!==w.lat||next.lng!==w.lng||next.active!==w.active||next.supplierId!==w.supplierId||next.type!==w.type;
  warehouses.set(id,{...next,name:next.name.trim(),version:w.version+1});change('warehouse',id,changed?'routing_change':'update');
 }
 function assignProduct(productId,originIds){
  if(!assertId(productId)||!Array.isArray(originIds)||!originIds.length||new Set(originIds).size!==originIds.length||originIds.some(id=>!warehouses.has(id)))throw Error('invalid_assignment');
  productOrigins.set(productId,[...originIds]);change('product',productId,'assign');
 }
 function resolve(productId){
  const ids=productOrigins.get(productId)||[];
  return ids.map(id=>warehouses.get(id)).filter(w=>w.active&&(w.type!=='proveedor'||suppliers.get(w.supplierId)?.active)).map(clone);
 }
 function snapshot(){return clone({revision,suppliers:[...suppliers.values()],warehouses:[...warehouses.values()],assignments:[...productOrigins.entries()],audit})}
 return {supplierAdd,supplierEdit,warehouseAdd,warehouseEdit,assignProduct,resolve,snapshot};
}
module.exports={createRegistry};
