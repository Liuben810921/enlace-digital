'use strict';
// Isolated, network-free contract. Not connected to checkout or production.
function quoteDelivery(input={}) {
  if(!input||typeof input!=='object'||Array.isArray(input)) input={};
  const {origins, suppliers=[], routes, destinationId, rateCupPerKm, minKm=3, minFeeCup=600, specialFeeCup=null, contextRevision, quarantined=false}=input;
  const pending=(reason)=>({status:'PENDIENTE',reason,feeCup:null,originId:null,billableKm:null,contextRevision:contextRevision??null});
  if(quarantined) return pending('QUARANTINE');
  if(!Number.isSafeInteger(contextRevision)||contextRevision<0) return pending('INVALID_REVISION');
  if(!Array.isArray(origins)||!Array.isArray(suppliers)||!Array.isArray(routes)||typeof destinationId!=='string'||!destinationId) return pending('INVALID_INPUT');
  if(!Number.isFinite(rateCupPerKm)||rateCupPerKm<=0||!Number.isFinite(minKm)||minKm<3||minKm>300||!Number.isSafeInteger(minFeeCup)||minFeeCup<0) return pending('INVALID_TARIFF');
  if(specialFeeCup!==null&&(!Number.isSafeInteger(specialFeeCup)||specialFeeCup<0)) return pending('INVALID_SPECIAL_FEE');
  if(suppliers.some(s=>!s||typeof s.id!=='string'||!s.id.trim())||new Set(suppliers.map(s=>s.id)).size!==suppliers.length)return pending('INVALID_SUPPLIER_CATALOG');
  const activeSuppliers=new Set(suppliers.filter(s=>s.active!==false).map(s=>s.id));
  const eligible=origins.filter(o=>o&&typeof o.id==='string'&&o.id&&o.active!==false&&(o.type==='propio'||(o.type==='proveedor'&&activeSuppliers.has(o.supplierId))));
  if(origins.some(o=>o&&o.type==='proveedor'&&(typeof o.supplierId!=='string'||!o.supplierId.trim())))return pending('INVALID_SUPPLIER_REFERENCE');
  if(!eligible.length) return pending('NO_ACTIVE_ORIGINS');
  if(new Set(eligible.map(o=>o.id)).size!==eligible.length) return pending('DUPLICATE_ORIGIN');
  const distances=[];
  let provenanceDataset=null,provenanceMode=null;
  const provenanceRouteIds=new Set();
  for(const o of eligible){
    const matching=routes.filter(r=>r&&r.originId===o.id&&r.destinationId===destinationId);
    if(matching.length!==1) return pending('ROAD_DISTANCE_MISSING');
    const r=matching[0];
    if(r.status!=='verified'||r.contextRevision!==contextRevision||!Number.isFinite(r.km)||r.km<0||r.km>300) return pending('ROAD_DISTANCE_UNVERIFIED');
    // A caller-supplied 'verified' flag alone cannot prove a road measurement.
    // Synthetic fixtures remain usable only in this explicitly simulated contract.
    if(r.provenance!==undefined&&(!r.provenance||typeof r.provenance!=='object'||r.provenance.source!=='osrm'||typeof r.provenance.datasetId!=='string'||!r.provenance.datasetId.trim()||typeof r.provenance.routeId!=='string'||!r.provenance.routeId.trim()))return pending('ROAD_PROVENANCE_INVALID');
    const hasProvenance=r.provenance!==undefined;
    if(provenanceMode!==null&&provenanceMode!==hasProvenance)return pending('ROAD_PROVENANCE_INCONSISTENT');
    provenanceMode=hasProvenance;
    if(hasProvenance){
      if(provenanceDataset!==null&&provenanceDataset!==r.provenance.datasetId)return pending('ROAD_DATASET_MISMATCH');
      if(provenanceRouteIds.has(r.provenance.routeId))return pending('ROAD_ROUTE_ID_DUPLICATE');
      provenanceRouteIds.add(r.provenance.routeId);
      provenanceDataset=r.provenance.datasetId;
    }
    distances.push({originId:o.id,km:r.km});
  }
  distances.sort((a,b)=>b.km-a.km||a.originId.localeCompare(b.originId));
  const farthest=distances[0], billableKm=Math.max(minKm,farthest.km);
  const feeCup=specialFeeCup===null?Math.max(minFeeCup,Math.ceil(billableKm*rateCupPerKm)):specialFeeCup;
  if(!Number.isSafeInteger(feeCup))return pending('FEE_OVERFLOW');
  return {status:'COTIZACION_SIMULADA',reason:null,feeCup,originId:farthest.originId,billableKm,roadKm:farthest.km,contextRevision};
}
// Strict boundary for any future non-synthetic route: require independently
// supplied provenance, while never treating it as independently verified.
function quoteVerifiedRoadDelivery(input={}) {
 if(!input||typeof input!=='object'||Array.isArray(input)) input={};
 const pending=reason=>({status:'PENDIENTE',reason,feeCup:null,originId:null,billableKm:null,contextRevision:input.contextRevision??null});
 if(!Array.isArray(input.routes)||!input.routes.length)return pending('ROAD_DISTANCE_MISSING');
 if(input.routes.some(r=>!r||r.status!=='verified'||!r.provenance||r.provenance.source!=='osrm'||typeof r.provenance.datasetId!=='string'||!r.provenance.datasetId.trim()||typeof r.provenance.routeId!=='string'||!r.provenance.routeId.trim()))return pending('ROAD_PROVENANCE_MISSING');
 // No trusted dataset registry is configured. Fail closed until independently validated.
 return pending('ROAD_DATASET_NOT_TRUSTED');
}
// Product-scoped adapter: never charge a customer for unrelated active warehouses.
function quoteProductDelivery(input={}) {
 if(!input||typeof input!=='object'||Array.isArray(input)) input={};
 const {productOriginIds, origins, suppliers=[], routes, ...tariff}=input;
 const pending=reason=>({status:'PENDIENTE',reason,feeCup:null,originId:null,billableKm:null,contextRevision:tariff.contextRevision??null});
 if(!Array.isArray(productOriginIds)||!productOriginIds.length||productOriginIds.some(id=>typeof id!=='string'||!id)||new Set(productOriginIds).size!==productOriginIds.length)return pending('INVALID_PRODUCT_ORIGINS');
 if(!Array.isArray(origins)||new Set(origins.filter(o=>o&&typeof o.id==='string').map(o=>o.id)).size!==origins.length)return pending('INVALID_ORIGIN_CATALOG');
 if(!Array.isArray(suppliers)||!Array.isArray(routes))return pending('INVALID_INPUT');
 const selected=productOriginIds.map(id=>origins.find(o=>o&&o.id===id));
 if(selected.some(o=>!o))return pending('PRODUCT_ORIGIN_MISSING');
 if(new Set(selected.map(o=>o.type)).size!==1||selected[0].type==='proveedor'&&new Set(selected.map(o=>o.supplierId)).size!==1)return pending('PRODUCT_ORIGINS_INCOMPATIBLE');
 if(selected.some(o=>o.active===false))return pending('PRODUCT_ORIGIN_INACTIVE');
 if(selected.some(o=>o.type==='proveedor'&&!suppliers.some(p=>p&&p.id===o.supplierId&&p.active!==false)))return pending('PRODUCT_SUPPLIER_INACTIVE');
 return quoteDelivery({...tariff,origins:selected,suppliers,routes});
}
if(typeof module!=='undefined'&&module.exports)module.exports={quoteDelivery,quoteProductDelivery,quoteVerifiedRoadDelivery};
if(typeof window!=='undefined')window.EDOfflineQuote=Object.freeze({quoteDelivery,quoteProductDelivery,quoteVerifiedRoadDelivery});
