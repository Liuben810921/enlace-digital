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
    distances.push({originId:o.id,km:r.km});
  }
  distances.sort((a,b)=>b.km-a.km||a.originId.localeCompare(b.originId));
  const farthest=distances[0], billableKm=Math.max(minKm,farthest.km);
  const feeCup=specialFeeCup===null?Math.ceil(billableKm*rateCupPerKm):specialFeeCup;
  if(!Number.isSafeInteger(feeCup))return pending('FEE_OVERFLOW');
  return {status:'COTIZACION_SIMULADA',reason:null,feeCup,originId:farthest.originId,billableKm,roadKm:farthest.km,contextRevision};
}
if(typeof module!=='undefined'&&module.exports)module.exports={quoteDelivery};
if(typeof window!=='undefined')window.EDOfflineQuote=Object.freeze({quoteDelivery});
