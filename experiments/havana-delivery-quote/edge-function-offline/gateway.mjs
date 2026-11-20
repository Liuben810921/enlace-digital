// Offline-only shared ESM gateway; no network, keys or tariffs.
const pending=reason=>({status:'PENDIENTE',reason,feeCup:null,routes:[]});
const keys=new Set(['contextRevision','mode','destination','origins','operationId']);
const inside=p=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===2&&Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&p.lat>=22.8&&p.lat<=23.3&&p.lon>=-82.65&&p.lon<=-82.05;
export function validate(b){
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>!keys.has(k)))return 'INVALID_REQUEST';
 if(!Number.isSafeInteger(b.contextRevision)||b.contextRevision<0)return 'INVALID_REVISION';
 if(b.mode!=='drive')return 'INVALID_MODE';
 if(typeof b.operationId!=='string'||!/^[A-Za-z0-9_-]{12,80}$/.test(b.operationId))return 'INVALID_OPERATION_ID';
 if(!inside(b.destination)||!Array.isArray(b.origins)||b.origins.length<1||b.origins.length>8)return 'INVALID_ROUTE_SCOPE';
 const seen=new Set();
 for(const p of b.origins){if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==3||typeof p.id!=='string'||!/^[A-Za-z0-9_-]{1,48}$/.test(p.id)||!inside({lat:p.lat,lon:p.lon})||seen.has(p.id))return 'INVALID_ROUTE_SCOPE';seen.add(p.id)}
 return null;
}
export async function handleGateway(request,deps={}){
 try{
  if(request.method!=='POST')return {httpStatus:405,body:pending('METHOD_NOT_ALLOWED')};
  if(typeof deps.authenticate!=='function'||typeof deps.reserveAtomic!=='function'||typeof deps.authorizeDispatch!=='function')return {httpStatus:503,body:pending('GATEWAY_NOT_CONFIGURED')};
  const identity=await deps.authenticate(request);
  if(!identity||identity.verified!==true||identity.authorized!==true||identity.role!=='routing-tester'||typeof identity.subject!=='string'||!identity.subject)return {httpStatus:401,body:pending('UNAUTHORIZED')};
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers?.get?.('content-type')||''))return {httpStatus:415,body:pending('UNSUPPORTED_MEDIA_TYPE')};
  const raw=await request.text();
  if(raw.length>8192)return {httpStatus:413,body:pending('BODY_TOO_LARGE')};
  let body;try{body=JSON.parse(raw)}catch{return {httpStatus:400,body:pending('INVALID_JSON')}};
  const error=validate(body);if(error)return {httpStatus:400,body:pending(error)};
  const receipt=await deps.reserveAtomic({principal:identity.subject,operationId:body.operationId,revision:body.contextRevision,credits:body.origins.length,scope:body.origins.map(o=>o.id).join(','),destination:body.destination});
  if(!receipt||receipt.committed!==true||typeof receipt.reservationId!=='string'||!receipt.reservationId||!['RESERVED','REPLAY_RESERVED'].includes(receipt.reason)||receipt.lifecycle!=='RESERVED')return {httpStatus:409,body:pending('RESERVATION_NOT_DISPATCHABLE')};
  // Offline contract check only: never dispatch to a provider. The trusted adapter
  // must enforce the SQL transition atomically and reject released/review/expired records.
  const gate=await deps.authorizeDispatch({principal:identity.subject,operationId:body.operationId,reservationId:receipt.reservationId,expectedLifecycle:'RESERVED',contextRevision:body.contextRevision});
  if(!gate||gate.authorized!==true||gate.lifecycle!=='DISPATCHED'||gate.reservationId!==receipt.reservationId||gate.operationId!==body.operationId)return {httpStatus:409,body:pending('DISPATCH_NOT_AUTHORIZED')};
  return {httpStatus:503,body:pending('PROVIDER_NOT_CONNECTED')};
 }catch{return {httpStatus:503,body:pending('GATEWAY_ERROR')}}
}
export function responseOf(result){return new Response(JSON.stringify(result.body),{status:result.httpStatus,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}})}
