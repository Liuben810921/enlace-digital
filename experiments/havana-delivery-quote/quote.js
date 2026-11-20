'use strict';
// Isolated, network-free contract. Not connected to checkout or production.
function quoteDelivery({origins, suppliers=[], routes, destinationId, rateCupPerKm, minKm=3, specialFeeCup=null, contextRevision, quarantined=false}={}) {
  const pending=(reason)=>({status:'PENDIENTE',reason,feeCup:null,originId:null,billableKm:null,contextRevision:contextRevision??null});
  if(quarantined) return pending('QUARANTINE');
  if(!Number.isSafeInteger(contextRevision)||contextRevision<0) return pending('INVALID_REVISION');
  if(!Array.isArray(origins)||!Array.isArray(suppliers)||!Array.isArray(routes)||typeof destinationId!=='string'||!destinationId) return pending('INVALID_INPUT');
  if(!Number.isFinite(rateCupPerKm)||rateCupPerKm<=0||!Number.isFinite(minKm)||minKm<3) return pending('INVALID_TARIFF');
  if(specialFeeCup!==null&&(!Number.isSafeInteger(specialFeeCup)||specialFeeCup<0)) return pending('INVALID_SPECIAL_FEE');
  const activeSuppliers=new Set(suppliers.filter(s=>s&&typeof s.id==='string'&&s.active!==false).map(s=>s.id));
  const eligible=origins.filter(o=>o&&typeof o.id==='string'&&o.id&&o.active!==false&&(o.type==='propio'||(o.type==='proveedor'&&activeSuppliers.has(o.supplierId))));
  if(!eligible.length) return pending('NO_ACTIVE_ORIGINS');
  if(new Set(eligible.map(o=>o.id)).size!==eligible.length) return pending('DUPLICATE_ORIGIN');
  const distances=[];
  for(const o of eligible){
    const matching=routes.filter(r=>r&&r.originId===o.id&&r.destinationId===destinationId);
    if(matching.length!==1) return pending('ROAD_DISTANCE_MISSING');
    const r=matching[0];
    if(r.status!=='verified'||r.contextRevision!==contextRevision||!Number.isFinite(r.km)||r.km<0||r.km>300) return pending('ROAD_DISTANCE_UNVERIFIED');
    // A caller-supplied 'verified' flag alone cannot prove a road measurement.
    // Synthetic fixtures remain usable only in this explicitly simulated contract.
    if(r.provenance!==undefined&&(!r.provenance||typeof r.provenance!=='object'||r.provenance.source!=='osrm'||typeof r.provenance.datasetId!=='string'||!r.provenance.datasetId.trim()||typeof r.provenance.routeId!=='string'||!r.provenance.routeId.trim()))return pending('ROAD_PROVENANCE_INVALID');
    distances.push({originId:o.id,km:r.km});
  }
  distances.sort((a,b)=>b.km-a.km||a.originId.localeCompare(b.originId));
  const farthest=distances[0], billableKm=Math.max(minKm,farthest.km);
  const feeCup=specialFeeCup===null?Math.ceil(billableKm*rateCupPerKm):specialFeeCup;
  if(!Number.isSafeInteger(feeCup))return pending('FEE_OVERFLOW');
  return {status:'COTIZACION_SIMULADA',reason:null,feeCup,originId:farthest.originId,billableKm,roadKm:farthest.km,contextRevision};
}
// Strict boundary for any future non-synthetic route: require independently
// supplied provenance, while never treating it as independently verified.
function quoteVerifiedRoadDelivery(input={}) {
 const pending=reason=>({status:'PENDIENTE',reason,feeCup:null,originId:null,billableKm:null,contextRevision:input.contextRevision??null});
 if(!Array.isArray(input.routes)||!input.routes.length)return pending('ROAD_DISTANCE_MISSING');
 if(input.routes.some(r=>!r||r.status!=='verified'||!r.provenance||r.provenance.source!=='osrm'||typeof r.provenance.datasetId!=='string'||!r.provenance.datasetId.trim()||typeof r.provenance.routeId!=='string'||!r.provenance.routeId.trim()))return pending('ROAD_PROVENANCE_MISSING');
 // No trusted dataset registry is configured. Fail closed until independently validated.
 return pending('ROAD_DATASET_NOT_TRUSTED');
}
// Product-scoped adapter: never charge a customer for unrelated active warehouses.
function quoteProductDelivery({productOriginIds, origins, suppliers=[], routes, ...tariff}={}) {
 const pending=reason=>({status:'PENDIENTE',reason,feeCup:null,originId:null,billableKm:null,contextRevision:tariff.contextRevision??null});
 if(!Array.isArray(productOriginIds)||!productOriginIds.length||productOriginIds.some(id=>typeof id!=='string'||!id)||new Set(productOriginIds).size!==productOriginIds.length)return pending('INVALID_PRODUCT_ORIGINS');
 if(!Array.isArray(origins)||new Set(origins.filter(o=>o&&typeof o.id==='string').map(o=>o.id)).size!==origins.length)return pending('INVALID_ORIGIN_CATALOG');
 const selected=productOriginIds.map(id=>origins.find(o=>o&&o.id===id));
 if(selected.some(o=>!o))return pending('PRODUCT_ORIGIN_MISSING');
 if(new Set(selected.map(o=>o.type)).size!==1||selected[0].type==='proveedor'&&new Set(selected.map(o=>o.supplierId)).size!==1)return pending('PRODUCT_ORIGINS_INCOMPATIBLE');
 if(selected.some(o=>o.active===false))return pending('PRODUCT_ORIGIN_INACTIVE');
 if(selected.some(o=>o.type==='proveedor'&&!suppliers.some(p=>p&&p.id===o.supplierId&&p.active!==false)))return pending('PRODUCT_SUPPLIER_INACTIVE');
 return quoteDelivery({...tariff,origins:selected,suppliers,routes});
}
if(typeof module!=='undefined'&&module.exports)module.exports={quoteDelivery,quoteProductDelivery,quoteVerifiedRoadDelivery};
if(typeof window!=='undefined')window.EDOfflineQuote=Object.freeze({quoteDelivery,quoteProductDelivery,quoteVerifiedRoadDelivery});
