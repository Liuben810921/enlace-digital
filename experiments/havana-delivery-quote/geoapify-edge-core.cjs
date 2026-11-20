'use strict';
// Offline-only core for future Supabase Edge Function. No network or secrets.
const PENDING=reason=>({status:'PENDIENTE',reason,feeCup:null,routes:[]});
const BOUNDS={latMin:22.8,latMax:23.3,lonMin:-82.65,lonMax:-82.05};
function inside(p){return p&&typeof p==='object'&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=BOUNDS.latMin&&p.lat<=BOUNDS.latMax&&p.lon>=BOUNDS.lonMin&&p.lon<=BOUNDS.lonMax;}
function validate(request){
 if(!request||typeof request!=='object'||Array.isArray(request))return 'INVALID_REQUEST';
 if(!Number.isSafeInteger(request.contextRevision)||request.contextRevision<0)return 'INVALID_REVISION';
 if(!inside(request.destination)||!Array.isArray(request.origins)||request.origins.length<1||request.origins.length>8)return 'INVALID_ROUTE_SCOPE';
 const seen=new Set();
 for(const p of request.origins){if(!inside(p)||typeof p.id!=='string'||!/^[a-zA-Z0-9_-]{1,48}$/.test(p.id)||seen.has(p.id))return 'INVALID_ROUTE_SCOPE';seen.add(p.id);}
 if(request.mode!=='drive')return 'INVALID_MODE';
 return null;
}
async function handle(request,adapters){
 try{
  if(!adapters||typeof adapters.authenticate!=='function'||typeof adapters.reserveAtomic!=='function')return PENDING('GATEWAY_NOT_CONFIGURED');
  const identity=await adapters.authenticate();
  if(!identity||identity.authorized!==true||identity.role!=='routing-tester')return PENDING('UNAUTHORIZED');
  const err=validate(request);if(err)return PENDING(err);
  // Reserve credits atomically in trusted storage before any future provider call.
  const reservation=await adapters.reserveAtomic({principal:identity.subject,credits:request.origins.length,revision:request.contextRevision});
  if(!reservation||reservation.committed!==true||typeof reservation.reservationId!=='string'||!reservation.reservationId)return PENDING('BUDGET_NOT_RESERVED');
  // Deliberately no transport to Geoapify; no real quotes.
  return PENDING('PROVIDER_NOT_CONNECTED');
 }catch{return PENDING('GATEWAY_ERROR');}
}
module.exports={handle,validate,inside,PENDING};
