'use strict';
// Offline delivery readiness gate: no geocoding, HTTP, storage, real addresses or orders.
const {makeRouteRequest,readRouteDistance}=require('./delivery-route-adapter-isolated.cjs');
const validText=x=>typeof x==='string'&&x.trim().length>0&&x.length<=240;
function prepareDelivery({registry,productIds,destination,routeResponses,rateCupPerKm=200,minKm=3}){
 if(!registry||typeof registry.resolve!=='function'||!Array.isArray(productIds)||!productIds.length||productIds.some(x=>!validText(x)))return {available:false,reason:'invalid_products'};
 if(!destination||!validText(destination.referenceLabel)||!Number.isFinite(destination.lat)||!Number.isFinite(destination.lng))return {available:false,reason:'destination_unverified'};
 if(!Number.isFinite(rateCupPerKm)||rateCupPerKm<0||!Number.isFinite(minKm)||minKm<0)return {available:false,reason:'invalid_settings'};
 const origins=new Map();
 for(const id of productIds){
  const eligible=registry.resolve(id);
  if(!eligible.length)return {available:false,reason:'product_origin_missing',productId:id};
  for(const origin of eligible)origins.set(origin.id,origin);
 }
 const routes=[];
 for(const [id,origin] of origins){
  if(!validText(origin.address)||!origin.addressVerified)return {available:false,reason:'warehouse_address_unverified',warehouseId:id};
  const request=makeRouteRequest(origin,destination);
  if(!request.ok)return {available:false,reason:'invalid_coordinates',warehouseId:id};
  const response=routeResponses?.[id];
  if(!response||response.originId!==id||response.destinationLabel!==destination.referenceLabel||response.verifiedByServer!==true)
   return {available:false,reason:'route_unverified',warehouseId:id,request};
  const parsed=readRouteDistance(response.data);
  if(!parsed.ok)return {available:false,reason:parsed.reason,warehouseId:id};
  routes.push({warehouseId:id,roadDistanceKm:parsed.roadDistanceKm});
 }
 // All eligible origins are considered for the conservative quote. Dispatch
 // selection remains a separate server-side decision.
 const farthest=routes.reduce((a,b)=>a.roadDistanceKm>=b.roadDistanceKm?a:b);
 return {available:true,synthetic:true,referenceOnly:true,dispatchNotSelected:true,
  routes,referenceWarehouseId:farthest.warehouseId,
  billableKm:Math.max(minKm,farthest.roadDistanceKm),
  deliveryFeeCup:Math.ceil(Math.max(minKm,farthest.roadDistanceKm)*rateCupPerKm),
  requiresServerIntegration:true};
}
module.exports={prepareDelivery};
