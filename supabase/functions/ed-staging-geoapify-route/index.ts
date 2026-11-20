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
Deno.serve(async(req)=>{
 if(req.method!=="POST")return json(405,{status:"PENDIENTE",reason:"METHOD_NOT_ALLOWED"});
 // Authorization gate and network gate are separate. No requests until BOTH approved.
 if(Deno.env.get("ED_STAGING_GEOAPIFY_ENABLED")!=="true")return json(503,{status:"PENDIENTE",reason:"STAGING_GEOAPIFY_DISABLED"});
 if(Deno.env.get("ED_STAGING_GEOAPIFY_NETWORK_ENABLED")!=="true")return json(503,{status:"PENDIENTE",reason:"PROVIDER_NETWORK_DISABLED"});
 // A verified, server-side operator identity and durable atomic quota ledger are NOT implemented.
 // Fail closed even when toggles are set. Never forward user-supplied keys.
 return json(503,{status:"PENDIENTE",reason:"OPERATOR_AUTH_AND_ATOMIC_QUOTA_NOT_IMPLEMENTED"});
});
