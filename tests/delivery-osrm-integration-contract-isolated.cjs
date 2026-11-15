'use strict';
// Offline authoritative-boundary contract for a future OSRM driving adapter.
// No HTTP, geocoding, real address, credentials or production data.
const {makeRouteRequest,readRouteDistance}=require('./delivery-route-adapter-isolated.cjs');
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(x);
const text=x=>typeof x==='string'&&x.length>0&&x.length<=120;
function prepareRoadRoute({origin,destination,province,cartographyVersion}){
 if(province!=='La Habana')return {ready:false,reason:'outside_coverage',feeStatus:'pending_confirmation'};
 if(!id(origin?.id)||!id(destination?.id)||!text(cartographyVersion)||origin.verified!==true||destination.verified!==true)
  return {ready:false,reason:'location_not_verified',feeStatus:'pending_confirmation'};
 const req=makeRouteRequest(origin,destination);
 if(!req.ok)return {ready:false,reason:req.reason,feeStatus:'pending_confirmation'};
 return {ready:true,originId:origin.id,destinationId:destination.id,cartographyVersion,request:req,requiresExternalService:true};
}
function acceptRoadRoute({plan,envelope,nowMs,maxAgeMs=86400000}){
 const pending=reason=>({available:false,reason,feeStatus:'pending_confirmation'});
 if(!plan?.ready)return pending(plan?.reason||'route_not_prepared');
 if(!Number.isFinite(nowMs)||!Number.isFinite(maxAgeMs)||maxAgeMs<=0)return pending('invalid_clock');
 if(!envelope||envelope.trustedBackend!==true||envelope.originId!==plan.originId||envelope.destinationId!==plan.destinationId||envelope.cartographyVersion!==plan.cartographyVersion)return pending('route_provenance_mismatch');
 if(!Number.isFinite(envelope.measuredAtMs)||envelope.measuredAtMs>nowMs||nowMs-envelope.measuredAtMs>=maxAgeMs)return pending('route_expired');
 const distance=readRouteDistance(envelope.response);
 if(!distance.ok)return pending(distance.reason);
 return {available:true,synthetic:true,feeStatus:'eligible_for_synthetic_quote',roadDistanceKm:distance.roadDistanceKm,originId:plan.originId,destinationId:plan.destinationId,cartographyVersion:plan.cartographyVersion,measuredAtMs:envelope.measuredAtMs};
}
module.exports={prepareRoadRoute,acceptRoadRoute};
