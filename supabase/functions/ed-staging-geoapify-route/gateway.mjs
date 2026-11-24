// Offline-testable Supabase Edge gateway core.
// No provider transport, secrets, database connection, or tariff calculation exists here.
const PENDING = reason => ({status:"PENDIENTE", reason, feeCup:null, routes:[]});
const BOUNDS = {latMin:22.7,latMax:23.3,lonMin:-83.0,lonMax:-81.9};
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const OPERATION_ID = /^[A-Za-z0-9_-]{12,64}$/;
const REQUEST_ID = /^[A-Za-z0-9_-]{12,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 16 * 1024;
const allowedKeys = new Set(["origin","destination","originId","destinationId","contextRevision","operationId"]);

function inside(point){
 return !!point && typeof point==="object" && !Array.isArray(point) &&
  Number.isFinite(point.lat) && Number.isFinite(point.lon) &&
  point.lat>=BOUNDS.latMin && point.lat<=BOUNDS.latMax &&
  point.lon>=BOUNDS.lonMin && point.lon<=BOUNDS.lonMax;
}
export function validateRequest(input){
 if(!input || typeof input!=="object" || Array.isArray(input))return {ok:false,reason:"INVALID_BODY"};
 if(Object.keys(input).some(key=>!allowedKeys.has(key)))return {ok:false,reason:"UNEXPECTED_FIELDS"};
 if(!inside(input.origin)||!inside(input.destination))return {ok:false,reason:"OUTSIDE_HAVANA_TEST_BOUNDS"};
 if(typeof input.originId!=="string"||!ID.test(input.originId)||
    typeof input.destinationId!=="string"||!ID.test(input.destinationId)||
    !Number.isSafeInteger(input.contextRevision)||input.contextRevision<0||
    typeof input.operationId!=="string"||!OPERATION_ID.test(input.operationId))
  return {ok:false,reason:"INVALID_CONTEXT"};
 return {ok:true,data:{origin:input.origin,destination:input.destination,originId:input.originId,destinationId:input.destinationId,contextRevision:input.contextRevision,operationId:input.operationId}};
}
function canonical(value){
 if(value===null||typeof value==="string"||typeof value==="boolean")return JSON.stringify(value);
 if(typeof value==="number"){if(!Number.isFinite(value))throw Error("NON_FINITE_NUMBER");return JSON.stringify(value)}
 if(Array.isArray(value))return "["+value.map(canonical).join(",")+"]";
 if(!value||typeof value!=="object")throw Error("UNSUPPORTED_VALUE");
 return "{"+Object.keys(value).sort().map(key=>JSON.stringify(key)+":"+canonical(value[key])).join(",")+"}";
}
export async function hashRequest(request){
 const bytes=new TextEncoder().encode(canonical(request));
 const digest=await globalThis.crypto.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
export function authorizeOperator(operator){
 if(!operator||typeof operator!=="object")return {ok:false,reason:"OPERATOR_NOT_VERIFIED"};
 if(operator.verifiedBy!=="supabase-auth-and-db"||
    !["principal","administrador_general"].includes(operator.role)||
    typeof operator.userId!=="string"||!UUID.test(operator.userId))
  return {ok:false,reason:"OPERATOR_NOT_VERIFIED"};
 return {ok:true,userId:operator.userId,role:operator.role};
}
export function authorizeRoutePreflight({operator,request,quotaReservation,payloadHash}={}){
 const identity=authorizeOperator(operator);
 if(!identity.ok)return {ok:false,reason:identity.reason};
 const valid=validateRequest(request);
 if(!valid.ok)return {ok:false,reason:valid.reason};
 if(typeof payloadHash!=="string"||!/^[0-9a-f]{64}$/.test(payloadHash))return {ok:false,reason:"INVALID_PAYLOAD_HASH"};
 const reservation=quotaReservation;
 if(!reservation||typeof reservation!=="object"||reservation.committed!==true||
    reservation.status!=="reserved"||reservation.verifiedBy!=="postgres-atomic-rpc"||
    reservation.userId!==identity.userId||reservation.operationId!==valid.data.operationId||
    typeof reservation.requestId!=="string"||!REQUEST_ID.test(reservation.requestId)||
    reservation.contextRevision!==valid.data.contextRevision||reservation.payloadHash!==payloadHash)
  return {ok:false,reason:"ATOMIC_QUOTA_NOT_RESERVED"};
 return {ok:true,userId:identity.userId,requestId:reservation.requestId};
}
function response(status,body,origin){
 const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store","vary":"Origin"};
 if(origin)headers["access-control-allow-origin"]=origin;
 return new Response(JSON.stringify(body),{status,headers});
}
function corsOrigin(request,env){
 const origin=request.headers.get("origin"),allowed=env?.ED_STAGING_ALLOWED_ORIGIN;
 return typeof origin==="string"&&typeof allowed==="string"&&allowed.length>0&&origin===allowed?origin:null;
}
export async function handleGatewayRequest(request,{env={},authenticate,reserveAtomic}={}){
 const origin=corsOrigin(request,env);
 if(request.method==="OPTIONS"){
  const headers={"cache-control":"no-store","vary":"Origin"};
  if(origin){
   headers["access-control-allow-origin"]=origin;
   headers["access-control-allow-methods"]="POST, OPTIONS";
   headers["access-control-allow-headers"]="authorization, apikey, content-type, x-client-info";
   headers["access-control-max-age"]="300";
  }
  return new Response(null,{status:204,headers});
 }
 if(request.method!=="POST")return response(405,PENDING("METHOD_NOT_ALLOWED"),origin);
 if(env.ED_STAGING_GEOAPIFY_ENABLED!=="true")return response(503,PENDING("STAGING_GEOAPIFY_DISABLED"),origin);
 if(env.ED_STAGING_GEOAPIFY_NETWORK_ENABLED!=="true")return response(503,PENDING("PROVIDER_NETWORK_DISABLED"),origin);
 if(typeof authenticate!=="function"||typeof reserveAtomic!=="function")return response(503,PENDING("GATEWAY_NOT_CONFIGURED"),origin);
 const mediaType=(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
 if(mediaType!=="application/json")return response(415,PENDING("JSON_REQUIRED"),origin);
 const declaredLength=Number(request.headers.get("content-length")||0);
 if(Number.isFinite(declaredLength)&&declaredLength>MAX_BODY_BYTES)return response(413,PENDING("BODY_TOO_LARGE"),origin);
 let raw,input;
 try{
  raw=await request.text();
  if(new TextEncoder().encode(raw).length>MAX_BODY_BYTES)return response(413,PENDING("BODY_TOO_LARGE"),origin);
  input=JSON.parse(raw);
 }catch{return response(400,PENDING("INVALID_JSON"),origin)}
 let operator;
 try{operator=await authenticate(request)}catch{return response(401,PENDING("OPERATOR_NOT_VERIFIED"),origin)}
 const identity=authorizeOperator(operator);
 if(!identity.ok)return response(401,PENDING(identity.reason),origin);
 const valid=validateRequest(input);
 if(!valid.ok)return response(400,PENDING(valid.reason),origin);
 let payloadHash;
 try{payloadHash=await hashRequest(valid.data)}catch{return response(503,PENDING("PAYLOAD_HASH_UNAVAILABLE"),origin)}
 let quotaReservation;
 try{
  quotaReservation=await reserveAtomic({userId:identity.userId,operationId:valid.data.operationId,payloadHash,contextRevision:valid.data.contextRevision,credits:1});
 }catch{return response(503,PENDING("ATOMIC_QUOTA_NOT_RESERVED"),origin)}
 const gate=authorizeRoutePreflight({operator,request:valid.data,quotaReservation,payloadHash});
 if(!gate.ok)return response(503,PENDING(gate.reason),origin);
 // Intentionally no provider transport. An authorized reservation is still not a route or quote.
 return response(503,PENDING("PROVIDER_NOT_CONNECTED"),origin);
}
export const internals=Object.freeze({inside,canonical,MAX_BODY_BYTES});
