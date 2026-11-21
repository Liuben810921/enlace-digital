'use strict';
// Isolated, network-free Geoapify/OSRM candidate adapter. Never verifies routes.
function prepareRouteCandidates(input={}) {
 const pending=reason=>({status:'PENDIENTE',reason,routes:[],quote:null});
 if(!input||typeof input!=='object'||Array.isArray(input))return pending('INVALID_INPUT');
 const {provider,datasetId,contextRevision,destinationId,origins,responses,rateCupPerKm,minKm=3,minFeeCup=600,specialFeeCup=null}=input;
 if(provider!=='osrm'&&provider!=='geoapify')return pending('INVALID_PROVIDER');
 if(typeof datasetId!=='string'||!datasetId.trim()||typeof destinationId!=='string'||!destinationId.trim()||!Number.isSafeInteger(contextRevision)||contextRevision<0)return pending('INVALID_CONTEXT');
 if(!Array.isArray(origins)||!origins.length||!Array.isArray(responses)||responses.length!==origins.length)return pending('INVALID_MANIFEST');
 if(!Number.isFinite(rateCupPerKm)||rateCupPerKm<=0||!Number.isFinite(minKm)||minKm<3||minKm>300||!Number.isSafeInteger(minFeeCup)||minFeeCup<0||specialFeeCup!==null&&(!Number.isSafeInteger(specialFeeCup)||specialFeeCup<0))return pending('INVALID_TARIFF');
 const ids=new Set(),routeIds=new Set();
 for(const o of origins){if(!o||typeof o.originId!=='string'||!o.originId.trim()||typeof o.routeId!=='string'||!o.routeId.trim()||ids.has(o.originId)||routeIds.has(o.routeId))return pending('INVALID_MANIFEST');ids.add(o.originId);routeIds.add(o.routeId)}
 const byOrigin=new Map();
 for(const entry of responses){
  if(!entry||typeof entry.originId!=='string'||!ids.has(entry.originId)||byOrigin.has(entry.originId)||entry.destinationId!==destinationId||entry.contextRevision!==contextRevision||entry.datasetId!==datasetId||entry.provider!==provider||typeof entry.routeId!=='string')return pending('ROUTE_ASSOCIATION_MISMATCH');
  const expected=origins.find(o=>o.originId===entry.originId);
  if(entry.routeId!==expected.routeId)return pending('ROUTE_ASSOCIATION_MISMATCH');
  const payload=entry.payload;let meters;
  if(provider==='osrm'){if(!payload||payload.code!=='Ok'||!Array.isArray(payload.routes)||payload.routes.length!==1)return pending('ROUTE_RESPONSE_INVALID');meters=payload.routes[0]&&payload.routes[0].distance}
  else {if(!payload||!Array.isArray(payload.features)||payload.features.length!==1)return pending('ROUTE_RESPONSE_INVALID');meters=payload.features[0]&&payload.features[0].properties&&payload.features[0].properties.distance}
  if(typeof meters!=='number'||!Number.isFinite(meters)||meters<0||meters>300000)return pending('ROUTE_DISTANCE_INVALID');
  byOrigin.set(entry.originId,{originId:entry.originId,destinationId,contextRevision,km:meters/1000,status:'unverified',provenance:{source:provider,datasetId,routeId:entry.routeId}});
 }
 if(byOrigin.size!==origins.length)return pending('ROUTE_ASSOCIATION_MISMATCH');
 return {status:'CANDIDATOS_NO_VERIFICADOS',reason:null,routes:origins.map(o=>byOrigin.get(o.originId)),quote:null,tariffSnapshot:{rateCupPerKm,minKm,minFeeCup,specialFeeCup,contextRevision}};
}
if(typeof module!=='undefined'&&module.exports)module.exports={prepareRouteCandidates};
if(typeof window!=='undefined')window.EDOfflineRouteCandidates=Object.freeze({prepareRouteCandidates});
