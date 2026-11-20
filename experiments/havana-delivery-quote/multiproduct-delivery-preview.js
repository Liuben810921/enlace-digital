'use strict';
// Offline delivery orchestration. Provider routes must be authenticated upstream;
// this function NEVER promotes synthetic or untrusted measurements to a live quote.
function calculateDeliveryPreview({items,origins,suppliers=[],destinationId,routes,rateCupPerKm,minKm=3,contextRevision,trustProvider=false}={}){
 const pending=(reason)=>({status:'PENDIENTE',reason,feeCup:null,lines:[],contextRevision:contextRevision??null});
 if(!Array.isArray(items)||!items.length||!Array.isArray(origins)||!Array.isArray(routes)||typeof destinationId!=='string'||!destinationId)return pending('INVALID_INPUT');
 if(!Number.isSafeInteger(contextRevision)||contextRevision<0||!Number.isFinite(rateCupPerKm)||rateCupPerKm<=0||!Number.isFinite(minKm)||minKm<3)return pending('INVALID_TARIFF_OR_REVISION');
 const byOrigin=new Map(origins.map(o=>[o?.id,o]));
 if(byOrigin.size!==origins.length)return pending('DUPLICATE_ORIGIN');
 const activeSuppliers=new Set(suppliers.filter(s=>s?.active!==false).map(s=>s.id));
 let total=0;const lines=[];
 for(const item of items){
  if(!item||typeof item.productId!=='string'||!item.productId||!Number.isSafeInteger(item.quantity)||item.quantity<1||!Array.isArray(item.originIds)||!item.originIds.length||new Set(item.originIds).size!==item.originIds.length)return pending('INVALID_ITEM');
  if(lines.some(x=>x.productId===item.productId))return pending('DUPLICATE_PRODUCT');
  if(item.specialFeeCup!==null&&item.specialFeeCup!==undefined&&(!Number.isSafeInteger(item.specialFeeCup)||item.specialFeeCup<0))return pending('INVALID_SPECIAL_FEE');
  const distances=[];
  for(const originId of item.originIds){
   const o=byOrigin.get(originId);
   if(!o||o.active===false||!['propio','proveedor'].includes(o.type)||(o.type==='proveedor'&&!activeSuppliers.has(o.supplierId)))return pending('INACTIVE_OR_MISSING_ORIGIN');
   const matches=routes.filter(r=>r?.originId===originId&&r.destinationId===destinationId);
   if(matches.length!==1)return pending('ROAD_DISTANCE_MISSING');
   const r=matches[0];
   if(r.contextRevision!==contextRevision||r.status!=='verified'||!Number.isFinite(r.km)||r.km<0||r.km>300)return pending('ROAD_DISTANCE_UNVERIFIED');
   if(!trustProvider||r.provenance?.source!=='geoapify'||r.provenance?.verified!==true||typeof r.provenance?.requestId!=='string'||!r.provenance.requestId)return pending('ROAD_PROVENANCE_UNTRUSTED');
   distances.push({originId,km:r.km});
  }
  distances.sort((a,b)=>b.km-a.km||a.originId.localeCompare(b.originId));
  const farthest=distances[0],billableKm=Math.max(minKm,farthest.km);
  const unitFee=item.specialFeeCup??Math.ceil(billableKm*rateCupPerKm);
  const lineFee=unitFee*item.quantity;
  if(!Number.isSafeInteger(lineFee)||!Number.isSafeInteger(total+lineFee))return pending('FEE_OVERFLOW');
  total+=lineFee;
  lines.push({productId:item.productId,quantity:item.quantity,originId:farthest.originId,roadKm:farthest.km,billableKm,unitFeeCup:unitFee,lineFeeCup:lineFee});
 }
 // A preview is NOT a payable quote; trusted authorization, current inventory,
 // cart revision and tariff revision must be checked again at checkout.
 return {status:'VISTA_PREVIA',feeCup:total,lines,contextRevision};
}
if(typeof module!=='undefined'&&module.exports)module.exports={calculateDeliveryPreview};
if(typeof window!=='undefined')window.EDDeliveryPreview=Object.freeze({calculateDeliveryPreview});
