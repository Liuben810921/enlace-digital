// STAGING-ONLY PREPARATION. Never deploy without independent approval.
// No Geoapify credential is embedded in this source. Network calls are disabled by default.
const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"null","vary":"Origin"}});
type Point={lat:number;lon:number};
const point=(p:unknown):p is Point=>{
 if(!p||typeof p!=="object")return false;
 const x=p as Record<string,unknown>;
 return typeof x.lat==="number"&&Number.isFinite(x.lat)&&x.lat>=22.7&&x.lat<=23.3&&typeof x.lon==="number"&&Number.isFinite(x.lon)&&x.lon>=-83.0&&x.lon<=-81.9;
};
type Input={origin?:Point;destination?:Point;originId?:string;destinationId?:string;contextRevision?:number};
const validId=(x:unknown)=>typeof x==="string"&&/^[a-zA-Z0-9_-]{1,64}$/.test(x);
export function validateRequest(input:unknown):{ok:true;data:Required<Input>}|{ok:false;reason:string}{
 if(!input||typeof input!=="object"||Array.isArray(input))return {ok:false,reason:"INVALID_BODY"};
 const d=input as Input;
 if(!point(d.origin)||!point(d.destination))return {ok:false,reason:"OUTSIDE_HAVANA_TEST_BOUNDS"};
 if(!validId(d.originId)||!validId(d.destinationId)||!Number.isSafeInteger(d.contextRevision)||d.contextRevision!<0)return {ok:false,reason:"INVALID_CONTEXT"};
 return {ok:true,data:d as Required<Input>};
}
export function parseRouteResponse(payload:unknown){
 if(!payload||typeof payload!=="object")return {status:"PENDIENTE",reason:"INVALID_PROVIDER_RESPONSE"};
 const features=(payload as Record<string,unknown>).features;
 if(!Array.isArray(features)||features.length!==1)return {status:"PENDIENTE",reason:"AMBIGUOUS_PROVIDER_RESPONSE"};
 const f=features[0];
 const meters=f?.properties?.distance;
 if(typeof meters!=="number"||!Number.isFinite(meters)||meters<0||meters>300000||!["LineString","MultiLineString"].includes(f?.geometry?.type))return {status:"PENDIENTE",reason:"INVALID_ROUTE_DISTANCE"};
 return {status:"PENDIENTE",reason:"PROVIDER_ROUTE_REQUIRES_TRUST_VALIDATION",roadKm:meters/1000,provider:"geoapify"};
}
// No role is inferred from a client claim, body, or user_metadata.
// A future adapter must verify the JWT signature and server-side admin membership.
export type VerifiedOperator={userId:string;role:"principal"|"administrador_general";verifiedBy:"supabase-auth-and-db"};
export function authorizeOperator(operator:unknown):{ok:true;userId:string}|{ok:false;reason:string}{
 if(!operator||typeof operator!=="object")return {ok:false,reason:"OPERATOR_NOT_VERIFIED"};
 const o=operator as Record<string,unknown>;
 if(o.verifiedBy!=="supabase-auth-and-db"||!["principal","administrador_general"].includes(String(o.role))||typeof o.userId!=="string"||!/^[0-9a-f-]{36}$/i.test(o.userId))return {ok:false,reason:"OPERATOR_NOT_VERIFIED"};
 return {ok:true,userId:o.userId};
}
// Quota reservation must be a single PostgreSQL transaction before calling Geoapify.
// The function is intentionally not wired to a database RPC until staging approval.
export function authorizeRoutePreflight({operator,request,quotaReservation}:{operator:unknown;request:unknown;quotaReservation:unknown}){
 const auth=authorizeOperator(operator);
 if(!auth.ok)return {ok:false,reason:auth.reason};
 const valid=validateRequest(request);
 if(!valid.ok)return {ok:false,reason:valid.reason};
 if(!quotaReservation||typeof quotaReservation!=="object")return {ok:false,reason:"ATOMIC_QUOTA_NOT_RESERVED"};
 const q=quotaReservation as Record<string,unknown>;
 if(q.status!=="reserved"||q.userId!==auth.userId||typeof q.requestId!=="string"||!/^[a-zA-Z0-9_-]{12,64}$/.test(q.requestId)||q.contextRevision!==valid.data.contextRevision)return {ok:false,reason:"ATOMIC_QUOTA_NOT_RESERVED"};
 return {ok:true,requestId:q.requestId};
}
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json(405,{status:"PENDIENTE",reason:"METHOD_NOT_ALLOWED"});
 if(Deno.env.get("ED_STAGING_GEOAPIFY_ENABLED")!=="true")return json(503,{status:"PENDIENTE",reason:"STAGING_GEOAPIFY_DISABLED"});
 if(Deno.env.get("ED_STAGING_GEOAPIFY_NETWORK_ENABLED")!=="true")return json(503,{status:"PENDIENTE",reason:"PROVIDER_NETWORK_DISABLED"});
 // No adapter supplies a verified identity or durable reservation yet.
 // These are mandatory, not optional configuration flags.
 const gate=authorizeRoutePreflight({operator:null,request:null,quotaReservation:null});
 return json(503,{status:"PENDIENTE",reason:gate.ok?"NETWORK_INTEGRATION_NOT_APPROVED":gate.reason});
});
