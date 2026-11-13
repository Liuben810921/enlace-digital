'use strict';
// Deterministic synthetic dispatch planner. No geocoding, routing, orders or network.
// Distances MUST be externally verified road distances; synthetic fixtures only here.
const {quoteDelivery}=require('./delivery-quote-isolated.cjs');
function planDelivery({province,lines,origins,roadDistancesKm,rateCupPerKm=200,minKm=3,minFeeCup=600,specialFeeCup=null,freeShipping=false}){
 if(province!=='La Habana')return {available:false,reason:'outside_coverage'};
 if(!Array.isArray(lines)||!lines.length||!Array.isArray(origins)||!roadDistancesKm||typeof roadDistancesKm!=='object')
  return {available:false,reason:'invalid_input'};
 const originMap=new Map(origins.map(o=>[o.id,o]));
 const selected=[],unresolved=[];
 for(const line of lines){
  if(!line||!line.productId||!Array.isArray(line.allowedOriginIds)||!line.allowedOriginIds.length)
   return {available:false,reason:'missing_product_origin'};
  const candidates=line.allowedOriginIds.map(id=>originMap.get(id)).filter(o=>o&&o.active===true&&
   (line.type==='propio'?o.type==='propio':line.type==='proveedor'&&o.type==='proveedor'&&o.supplierId===line.supplierId));
  if(!candidates.length)return {available:false,reason:'no_active_compatible_origin',productId:line.productId};
  // Explicit dispatch choice takes precedence. Never silently choose the farthest warehouse.
  const chosen=line.dispatchOriginId?candidates.find(o=>o.id===line.dispatchOriginId):
   candidates.length===1?candidates[0]:null;
  if(!chosen){unresolved.push({productId:line.productId,candidateOriginIds:candidates.map(o=>o.id)});continue}
  const distance=roadDistancesKm[chosen.id];
  if(typeof distance!=='number'||!Number.isFinite(distance)||distance<0)
   return {available:false,reason:'missing_verified_road_distance',originId:chosen.id};
  selected.push({productId:line.productId,originId:chosen.id,roadDistanceKm:distance});
 }
 if(unresolved.length)return {available:false,reason:'dispatch_selection_required',unresolved};
 const q=quoteDelivery({province,distancesKm:selected.map(x=>x.roadDistanceKm),rateCupPerKm,minKm,minFeeCup,specialFeeCup,freeShipping});
 if(!q.available)return q;
 return {...q,selectedOrigins:selected,distinctOriginIds:[...new Set(selected.map(x=>x.originId))],synthetic:true};
}
module.exports={planDelivery};
