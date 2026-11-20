'use strict';
// Offline-only Geoapify route response adapter. No HTTP, credentials or checkout wiring.
(function(root){
function pending(reason){return {status:'PENDIENTE',reason,routes:[]};}
function adaptGeoapifyRoutes({responses,originIds,destinationId,contextRevision}={}){
 if(!Number.isSafeInteger(contextRevision)||contextRevision<0)return pending('INVALID_REVISION');
 if(typeof destinationId!=='string'||!destinationId.trim()||!Array.isArray(originIds)||!originIds.length||originIds.some(x=>typeof x!=='string'||!x.trim())||new Set(originIds).size!==originIds.length)return pending('INVALID_ROUTE_SCOPE');
 if(!Array.isArray(responses)||responses.length!==originIds.length)return pending('INCOMPLETE_ROUTES');
 const seen=new Set(),routes=[];
 for(const item of responses){
  if(!item||typeof item!=='object'||typeof item.originId!=='string'||!originIds.includes(item.originId)||seen.has(item.originId))return pending('ROUTE_SCOPE_MISMATCH');
  seen.add(item.originId);
  // A local fixture or untrusted JSON must never be promoted to a verified road distance.
  if(item.httpStatus!==200||!item.body||typeof item.body!=='object'||!Array.isArray(item.body.features)||item.body.features.length!==1)return pending('GEOAPIFY_RESPONSE_INVALID');
  const f=item.body.features[0],p=f&&f.properties;
  if(!p||!Number.isFinite(p.distance)||p.distance<0||p.distance>300000||!Number.isFinite(p.time)||p.time<0)return pending('GEOAPIFY_METRICS_INVALID');
  routes.push({originId:item.originId,destinationId,contextRevision,km:p.distance/1000,status:'unverified',provenance:{source:'geoapify',providerResponse:'offline-fixture',routeId:null}});
 }
 return {status:'PENDIENTE',reason:'ROAD_PROVIDER_NOT_TRUSTED',routes};
}
const api=Object.freeze({adaptGeoapifyRoutes});
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root)root.EDGeoapifyOffline=api;
})(typeof window!=='undefined'?window:null);
