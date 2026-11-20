'use strict';
// Geoapify routing response normalization, OFFLINE ONLY.
// No API key, HTTP request, persistence, deployment, or trusted-quote assertion.
function normalizeGeoapifyRoute({payload,originId,destinationId,contextRevision,requestId}={}){
 const pending=reason=>({status:'PENDIENTE',reason,originId:originId||null,destinationId:destinationId||null,km:null});
 if(![originId,destinationId,requestId].every(v=>typeof v==='string'&&v.trim()))return pending('INVALID_IDENTIFIERS');
 if(!Number.isSafeInteger(contextRevision)||contextRevision<0)return pending('INVALID_REVISION');
 if(!payload||typeof payload!=='object'||!Array.isArray(payload.features)||payload.features.length!==1)return pending('INVALID_ROUTE_RESPONSE');
 const feature=payload.features[0];
 const properties=feature&&feature.properties;
 if(!properties||typeof properties!=='object'||!Number.isFinite(properties.distance)||properties.distance<0||properties.distance>300000)return pending('INVALID_ROAD_DISTANCE');
 if(!feature.geometry||typeof feature.geometry!=='object'||!['LineString','MultiLineString'].includes(feature.geometry.type))return pending('INVALID_ROUTE_GEOMETRY');
 // A syntactically valid provider response is not proof of trusted provenance.
 return {status:'PENDIENTE',reason:'PROVIDER_ROUTE_REQUIRES_TRUST_VALIDATION',originId,destinationId,km:properties.distance/1000,contextRevision,requestId,provenance:{source:'geoapify',verified:false}};
}
function normalizeGeoapifyRoutes({responses,originIds,destinationId,contextRevision}={}){
 if(!Array.isArray(originIds)||!originIds.length||new Set(originIds).size!==originIds.length||!Array.isArray(responses)||responses.length!==originIds.length)return {status:'PENDIENTE',reason:'INCOMPLETE_ROUTE_SET',routes:[]};
 const routes=originIds.map((originId,i)=>normalizeGeoapifyRoute({...responses[i],originId,destinationId,contextRevision}));
 if(routes.some(r=>r.reason!=='PROVIDER_ROUTE_REQUIRES_TRUST_VALIDATION'))return {status:'PENDIENTE',reason:'ROUTE_SET_INVALID',routes};
 return {status:'PENDIENTE',reason:'ROUTES_REQUIRE_TRUST_VALIDATION',routes};
}
if(typeof module!=='undefined'&&module.exports)module.exports={normalizeGeoapifyRoute,normalizeGeoapifyRoutes};
if(typeof window!=='undefined')window.EDGeoapifyOffline=Object.freeze({normalizeGeoapifyRoute,normalizeGeoapifyRoutes});
