'use strict';
// Offline bridge: candidate routes are never upgraded to verified routes or quoted.
function inspectCandidateDelivery(input={},prepare,quoteVerified) {
 const pending=reason=>({status:'PENDIENTE',reason,quote:null,routes:[]});
 if(!input||typeof input!=='object'||Array.isArray(input)||typeof prepare!=='function'||typeof quoteVerified!=='function')return pending('INVALID_INPUT');
 const {origins,suppliers=[],productOriginIds,destinationId,contextRevision}=input;
 if(input.quarantined)return pending('QUARANTINE');
 if(!Array.isArray(origins)||!origins.length||!Array.isArray(suppliers)||!Array.isArray(productOriginIds)||!productOriginIds.length)return pending('INVALID_ASSOCIATIONS');
 const ids=new Set(),supplierIds=new Set();
 for(const s of suppliers){if(!s||typeof s.id!=='string'||!s.id.trim()||supplierIds.has(s.id)||s.active!==undefined&&typeof s.active!=='boolean')return pending('INVALID_SUPPLIERS');supplierIds.add(s.id)}
 for(const o of origins){if(!o||typeof o.id!=='string'||!o.id.trim()||ids.has(o.id)||o.active!==undefined&&typeof o.active!=='boolean'||o.type!=='propio'&&o.type!=='proveedor')return pending('INVALID_ORIGINS');ids.add(o.id)}
 if(new Set(productOriginIds).size!==productOriginIds.length||productOriginIds.some(id=>typeof id!=='string'||!id.trim()||!ids.has(id)))return pending('INVALID_PRODUCT_ORIGINS');
 const selected=productOriginIds.map(id=>origins.find(o=>o.id===id));
 if(selected.some(o=>o.active===false))return pending('PRODUCT_ORIGIN_INACTIVE');
 if(new Set(selected.map(o=>o.type)).size!==1||selected[0].type==='proveedor'&&new Set(selected.map(o=>o.supplierId)).size!==1)return pending('PRODUCT_ORIGINS_INCOMPATIBLE');
 if(selected.some(o=>o.type==='proveedor'&&(typeof o.supplierId!=='string'||!o.supplierId.trim()||!suppliers.some(s=>s.id===o.supplierId&&s.active!==false))))return pending('PRODUCT_SUPPLIER_INACTIVE');
 if(!Array.isArray(input.routeManifest)||input.routeManifest.length!==selected.length)return pending('INVALID_MANIFEST');
 const manifestIds=new Set();
 for(const entry of input.routeManifest){if(!entry||typeof entry.originId!=='string'||!productOriginIds.includes(entry.originId)||manifestIds.has(entry.originId)||typeof entry.routeId!=='string'||!entry.routeId.trim())return pending('INVALID_MANIFEST');manifestIds.add(entry.originId)}
 const result=prepare({provider:input.provider,datasetId:input.datasetId,contextRevision,destinationId,origins:input.routeManifest,responses:input.responses,rateCupPerKm:input.rateCupPerKm,minKm:input.minKm,minFeeCup:input.minFeeCup,specialFeeCup:input.specialFeeCup});
 if(!result||result.status!=='CANDIDATOS_NO_VERIFICADOS')return pending(result&&result.reason||'CANDIDATES_UNAVAILABLE');
 if(!Array.isArray(result.routes)||result.routes.length!==selected.length||result.routes.some(r=>!r||r.status!=='unverified'||r.contextRevision!==contextRevision||r.destinationId!==destinationId||!manifestIds.has(r.originId)))return pending('CANDIDATE_INTEGRITY_FAILED');
 // The strict verified-road boundary must remain closed even if a caller forges status.
 const guard=quoteVerified({routes:result.routes,contextRevision,destinationId});
 if(!guard||guard.status!=='PENDIENTE'||guard.feeCup!==null)return pending('VERIFICATION_BOUNDARY_FAILED');
 return {status:'PENDIENTE',reason:'ROAD_DISTANCE_NOT_TRUSTED',quote:null,routes:result.routes,tariffSnapshot:result.tariffSnapshot,verification:guard.reason};
}
if(typeof module!=='undefined'&&module.exports)module.exports={inspectCandidateDelivery};
if(typeof window!=='undefined')window.EDOfflineCandidateBridge=Object.freeze({inspectCandidateDelivery});
