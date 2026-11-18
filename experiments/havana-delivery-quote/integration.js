'use strict';
// Offline contract only. No storage, network, checkout mutation or real charges.
const isId=x=>typeof x==='string'&&x.trim().length>0&&x.length<=128;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function validateConfiguration(doc){
 if(!doc||typeof doc!=='object'||Array.isArray(doc)||doc.schemaVersion!==1||!Number.isSafeInteger(doc.revision)||doc.revision<0)return {ok:false,reason:'INVALID_VERSION'};
 if(!Array.isArray(doc.origins)||!Array.isArray(doc.suppliers)||!Array.isArray(doc.destinations))return {ok:false,reason:'INVALID_COLLECTION'};
 const unique=(a)=>a.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&isId(x.id))&&new Set(a.map(x=>x.id)).size===a.length;
 if(![doc.origins,doc.suppliers,doc.destinations].every(unique))return {ok:false,reason:'INVALID_IDS'};
 if(!doc.suppliers.every(s=>isId(s.name)&&typeof s.active==='boolean')||!doc.destinations.every(d=>isId(d.name)&&isId(d.municipality)&&isId(d.address)))return {ok:false,reason:'INVALID_RECORD'};
 const suppliers=new Map(doc.suppliers.map(s=>[s.id,s]));
 if(!doc.origins.every(o=>isId(o.name)&&typeof o.active==='boolean'&&(o.type==='propio'||(o.type==='proveedor'&&isId(o.supplierId)&&suppliers.has(o.supplierId)))))return {ok:false,reason:'INVALID_ORIGIN'};
 return {ok:true,reason:null};
}
function updateConfiguration(current,expectedRevision,next){
 const a=validateConfiguration(current),b=validateConfiguration(next);
 if(!a.ok)return {status:'REJECTED',reason:a.reason};
 if(!Number.isSafeInteger(expectedRevision)||current.revision!==expectedRevision)return {status:'CONFLICT',reason:'STALE_REVISION'};
 if(!b.ok)return {status:'REJECTED',reason:b.reason};
 if(next.revision!==current.revision+1)return {status:'REJECTED',reason:'REVISION_NOT_INCREMENTED'};
 return {status:'ACCEPTED',revision:next.revision,configuration:structuredClone(next)};
}
function adaptCheckoutDelivery({configuration,expectedRevision,destinationId,routes,rateCupPerKm,minKm=3,specialFeeCup=null,quarantined=false,quoteDelivery}={}){
 const pending=reason=>({status:'PENDIENTE',reason,deliveryFeeCup:null,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER'});
 const valid=validateConfiguration(configuration);
 if(!valid.ok)return pending(valid.reason);
 if(configuration.revision!==expectedRevision)return pending('STALE_REVISION');
 if(quarantined)return pending('QUARANTINE');
 if(!configuration.destinations.some(d=>d.id===destinationId))return pending('UNKNOWN_DESTINATION');
 if(typeof quoteDelivery!=='function')return pending('QUOTE_UNAVAILABLE');
 // The route list is supplied by the caller; this adapter cannot certify its provenance.
 const q=quoteDelivery({origins:configuration.origins,suppliers:configuration.suppliers,routes,destinationId,rateCupPerKm,minKm,specialFeeCup,contextRevision:configuration.revision,quarantined});
 if(q.status!=='COTIZACION_SIMULADA')return pending(q.reason||'QUOTE_PENDING');
 return {status:'COTIZACION_SIMULADA',reason:null,deliveryFeeCup:q.feeCup,originId:q.originId,billableKm:q.billableKm,contextRevision:q.contextRevision,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER',simulationOnly:true};
}
module.exports={validateConfiguration,updateConfiguration,adaptCheckoutDelivery};
