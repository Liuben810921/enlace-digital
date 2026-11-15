'use strict';
// Public-landmark-only offline validation matrix; never performs HTTP requests.
const {prepareRoadRoute,acceptRoadRoute}=require('./delivery-osrm-integration-contract-isolated.cjs');
const {assessRoute}=require('./delivery-route-validation-isolated.cjs');
const allowed=/^[a-z0-9_-]{1,64}$/i;
function validatePublicRouteBatch({routes,cartographyVersion,nowMs,maxAgeMs=86400000}){
 const fail=(reason)=>({approved:false,reason,feeStatus:'pending_confirmation',results:[]});
 if(!Array.isArray(routes)||routes.length<8||routes.length>12)return fail('route_count_out_of_range');
 if(!Number.isFinite(nowMs))return fail('invalid_clock');
 const seen=new Set(),results=[];
 for(const item of routes){
  if(!item||!allowed.test(item.id||'')||seen.has(item.id))return fail('duplicate_or_invalid_id');
  seen.add(item.id);
  if(item.publicReference!==true||item.origin?.publicReference!==true||item.destination?.publicReference!==true)return fail('non_public_location');
  const plan=prepareRoadRoute({origin:item.origin,destination:item.destination,province:'La Habana',cartographyVersion});
  const route=acceptRoadRoute({plan,envelope:item.envelope,nowMs,maxAgeMs});
  const comparison=route.available?assessRoute({osmandKm:item.osmandKm,engineKm:route.roadDistanceKm}):{approved:false,reason:route.reason,feeStatus:'pending_confirmation'};
  results.push({id:item.id,originId:item.origin?.id||null,destinationId:item.destination?.id||null,roadDistanceKm:route.available?route.roadDistanceKm:null,approved:comparison.approved,reason:comparison.reason,feeStatus:comparison.approved?'eligible_for_synthetic_quote':'pending_confirmation'});
 }
 return {approved:results.every(r=>r.approved),synthetic:true,feeStatus:results.every(r=>r.approved)?'eligible_for_synthetic_quote':'pending_confirmation',results};
}
module.exports={validatePublicRouteBatch};
