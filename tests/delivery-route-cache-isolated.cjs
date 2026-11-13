'use strict';
// Offline route cache: verified synthetic road distances only. No network, storage or API keys.
const {makeRouteRequest,readRouteDistance}=require('./delivery-route-adapter-isolated.cjs');
const {planDelivery}=require('./delivery-dispatch-isolated.cjs');
const validNumber=n=>typeof n==='number'&&Number.isFinite(n);
function pointKey(p){return validNumber(p?.lat)&&validNumber(p?.lng)?p.lat.toFixed(5)+','+p.lng.toFixed(5):null}
function cacheKey(engine,profile,origin,destination){
 const a=pointKey(origin),b=pointKey(destination);
 return a&&b?JSON.stringify([engine,profile,a,b]):null;
}
function makeRouteCache({ttlMs=86400000,maxEntries=500,now=()=>Date.now()}={}){
 const data=new Map();
 return {
  read(key){
   const entry=data.get(key);
   if(!entry)return {hit:false};
   if(now()>=entry.expiresAt){data.delete(key);return {hit:false,reason:'expired'}}
   return {hit:true,roadDistanceKm:entry.roadDistanceKm};
  },
  write(key,roadDistanceKm){
   if(!key||!validNumber(roadDistanceKm)||roadDistanceKm<0)return false;
   if(data.size>=maxEntries&&!data.has(key))data.delete(data.keys().next().value);
   data.set(key,{roadDistanceKm,expiresAt:now()+ttlMs});return true;
  },
  size:()=>data.size
 };
}
function buildOfflineRouteQuote({province,lines,origins,destination,routeResponses={},cache=makeRouteCache(),settings={}}){
 if(province!=='La Habana')return {available:false,reason:'outside_coverage'};
 if(!Array.isArray(lines)||!Array.isArray(origins))return {available:false,reason:'invalid_input'};
 const originMap=new Map(origins.map(o=>[o.id,o]));
 const chosen=[];
 for(const line of lines){
  if(!line||!line.productId||!Array.isArray(line.allowedOriginIds)||!line.allowedOriginIds.length)return {available:false,reason:'missing_product_origin'};
  const compatible=line.allowedOriginIds.map(id=>originMap.get(id)).filter(o=>o&&o.active===true&&(line.type==='propio'?o.type==='propio':line.type==='proveedor'&&o.type==='proveedor'&&o.supplierId===line.supplierId));
  if(!compatible.length)return {available:false,reason:'no_active_compatible_origin',productId:line.productId};
  const origin=line.dispatchOriginId?compatible.find(o=>o.id===line.dispatchOriginId):compatible.length===1?compatible[0]:null;
  if(!origin)return {available:false,reason:'dispatch_selection_required',productId:line.productId,candidateOriginIds:compatible.map(o=>o.id)};
  chosen.push({line,origin});
 }
 const distances={},details=[];
 for(const {line,origin} of chosen){
  const req=makeRouteRequest(origin,destination);
  if(!req.ok)return {available:false,reason:'invalid_coordinates',originId:origin.id};
  const key=cacheKey(req.engine,req.profile,origin,destination);
  const cached=cache.read(key);
  let roadDistanceKm;
  if(cached.hit){roadDistanceKm=cached.roadDistanceKm}
  else{
   // Fixtures are keyed by origin id. Never fetch a real routing service.
   const response=routeResponses[origin.id];
   if(!response)return {available:false,reason:'route_unavailable',originId:origin.id};
   const parsed=readRouteDistance(response);
   if(!parsed.ok)return {available:false,reason:parsed.reason,originId:origin.id};
   roadDistanceKm=parsed.roadDistanceKm;
   cache.write(key,roadDistanceKm);
  }
  distances[origin.id]=roadDistanceKm;
  details.push({productId:line.productId,originId:origin.id,roadDistanceKm,fromCache:cached.hit});
 }
 const result=planDelivery({province,lines,origins,roadDistancesKm:distances,...settings});
 return result.available?{...result,details,synthetic:true}:{...result,synthetic:true};
}
module.exports={cacheKey,makeRouteCache,buildOfflineRouteQuote};
