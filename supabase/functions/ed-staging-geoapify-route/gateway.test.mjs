import test from "node:test";
import assert from "node:assert/strict";
import {handleGatewayRequest,validateRequest,hashRequest,parseRouteResponse,authorizeOperator,authorizeRoutePreflight} from "./gateway.mjs";

const input={origin:{lat:23.12,lon:-82.4},destination:{lat:23.13,lon:-82.37},originId:"warehouse_1",destinationId:"destination_1",contextRevision:7,operationId:"operation_123456"};
const operator={userId:"123e4567-e89b-42d3-a456-426614174000",role:"principal",verifiedBy:"supabase-auth-and-db"};
const env={ED_STAGING_GEOAPIFY_ENABLED:"true",ED_STAGING_GEOAPIFY_NETWORK_ENABLED:"true",ED_STAGING_ALLOWED_ORIGIN:"https://liuben810921.github.io"};
const makeRequest=(body=input,headers={})=>new Request("https://staging.example/functions/v1/ed-staging-geoapify-route",{method:"POST",headers:{"content-type":"application/json",origin:env.ED_STAGING_ALLOWED_ORIGIN,...headers},body:JSON.stringify(body)});
const body=async response=>response.json();

test("keeps the gateway disabled by default before reading adapters",async()=>{
 let auth=0,reserve=0;
 const response=await handleGatewayRequest(makeRequest(),{env:{},authenticate:async()=>{auth++},reserveAtomic:async()=>{reserve++}});
 assert.equal(response.status,503);assert.equal((await body(response)).reason,"STAGING_GEOAPIFY_DISABLED");
 assert.equal(auth,0);assert.equal(reserve,0);
});
test("handles only POST and does not cache",async()=>{
 const response=await handleGatewayRequest(new Request("https://staging.example/route"),{env});
 assert.equal(response.status,405);assert.equal(response.headers.get("cache-control"),"no-store");
});
test("scopes preflight CORS to the exact staging origin",async()=>{
 const allowed=await handleGatewayRequest(new Request("https://staging.example/route",{method:"OPTIONS",headers:{origin:env.ED_STAGING_ALLOWED_ORIGIN}}),{env});
 const denied=await handleGatewayRequest(new Request("https://staging.example/route",{method:"OPTIONS",headers:{origin:"https://evil.example"}}),{env});
 assert.equal(allowed.status,204);assert.equal(allowed.headers.get("access-control-allow-origin"),env.ED_STAGING_ALLOWED_ORIGIN);
 assert.equal(denied.headers.get("access-control-allow-origin"),null);
});
test("rejects extra client claims",()=>{
 assert.equal(validateRequest({...input,role:"principal"}).reason,"UNEXPECTED_FIELDS");
 assert.equal(validateRequest({...input,verifiedBy:"supabase-auth-and-db"}).reason,"UNEXPECTED_FIELDS");
});
test("rejects invalid region, revision, and idempotency key",()=>{
 assert.equal(validateRequest({...input,destination:{lat:25,lon:-82}}).reason,"OUTSIDE_HAVANA_TEST_BOUNDS");
 assert.equal(validateRequest({...input,contextRevision:-1}).reason,"INVALID_CONTEXT");
 assert.equal(validateRequest({...input,operationId:"short"}).reason,"INVALID_CONTEXT");
});
test("route payloads never become trusted route distances",()=>{
 const valid={features:[{properties:{distance:2400},geometry:{type:"LineString"}}]};
 const result=parseRouteResponse(valid);
 assert.equal(result.status,"PENDIENTE");assert.equal(result.reason,"PROVIDER_ROUTE_REQUIRES_TRUST_VALIDATION");assert.equal(result.roadKm,2.4);
 assert.equal(parseRouteResponse({features:[]}).reason,"AMBIGUOUS_PROVIDER_RESPONSE");
 assert.equal(parseRouteResponse({features:[{properties:{distance:999999},geometry:{type:"LineString"}}]}).reason,"INVALID_ROUTE_DISTANCE");
});
test("hash is canonical and changes with context",async()=>{
 const first=await hashRequest(input),same=await hashRequest({...input,destination:{lon:-82.37,lat:23.13}});
 assert.equal(first,same);assert.notEqual(first,await hashRequest({...input,contextRevision:8}));
 assert.match(first,/^[0-9a-f]{64}$/);
});
test("rejects missing and forged operator identity",()=>{
 assert.equal(authorizeOperator(null).ok,false);
 assert.equal(authorizeOperator({...operator,verifiedBy:"client"}).ok,false);
 assert.equal(authorizeOperator({...operator,role:"supervisor"}).ok,false);
 assert.equal(authorizeOperator(operator).ok,true);
});
test("requires committed, operation-bound, payload-bound atomic reservation",()=>{
 const hash="a".repeat(64),base={committed:true,status:"reserved",verifiedBy:"postgres-atomic-rpc",contextVerified:true,contextSource:"staging-postgres",userId:operator.userId,operationId:input.operationId,requestId:"request_123456",contextRevision:7,payloadHash:hash};
 assert.equal(authorizeRoutePreflight({operator,request:input,quotaReservation:base,payloadHash:hash}).ok,true);
 for(const patch of [{committed:false},{verifiedBy:"client"},{contextVerified:false},{contextSource:"client"},{userId:"other"},{operationId:"other_123456"},{requestId:"short"},{contextRevision:8},{payloadHash:"b".repeat(64)}])
  assert.equal(authorizeRoutePreflight({operator,request:input,quotaReservation:{...base,...patch},payloadHash:hash}).ok,false);
});
test("auth precedes quota reservation and unverified identities cannot spend",async()=>{
 let reserve=0;
 const response=await handleGatewayRequest(makeRequest(),{env,authenticate:async()=>({...operator,verifiedBy:"client"}),reserveAtomic:async()=>{reserve++}});
 assert.equal(response.status,401);assert.equal((await body(response)).reason,"OPERATOR_NOT_VERIFIED");assert.equal(reserve,0);
});
test("invalid body and content type do not reserve quota",async()=>{
 let reserve=0;
 const adapters={env,authenticate:async()=>operator,reserveAtomic:async()=>{reserve++;return null}};
 const invalid=await handleGatewayRequest(makeRequest({...input,role:"admin"}),adapters);
 const media=await handleGatewayRequest(new Request("https://staging.example/route",{method:"POST",headers:{origin:env.ED_STAGING_ALLOWED_ORIGIN,"content-type":"text/plain"},body:"{}"}),adapters);
 assert.equal(invalid.status,400);assert.equal((await body(invalid)).reason,"UNEXPECTED_FIELDS");
 assert.equal(media.status,415);assert.equal(reserve,0);
});
test("body limit fails closed",async()=>{
 const response=await handleGatewayRequest(makeRequest({},{"content-length":"20000"}),{env,authenticate:async()=>operator,reserveAtomic:async()=>{throw Error("must not run")}});
 assert.equal(response.status,413);assert.equal((await body(response)).reason,"BODY_TOO_LARGE");
});
test("atomic reservation failure remains pending",async()=>{
 const response=await handleGatewayRequest(makeRequest(),{env,authenticate:async()=>operator,reserveAtomic:async()=>({committed:false})});
 assert.equal(response.status,503);assert.equal((await body(response)).reason,"ATOMIC_QUOTA_NOT_RESERVED");
});
test("even a valid synthetic reservation produces no route or tariff",async()=>{
 let providerCalls=0,reservation;
 const hash=await hashRequest(input);
 const response=await handleGatewayRequest(makeRequest(),{env,authenticate:async()=>operator,reserveAtomic:async request=>{
  reservation=request;
  return {committed:true,status:"reserved",verifiedBy:"postgres-atomic-rpc",userId:request.userId,operationId:request.operationId,requestId:"request_123456",contextRevision:request.contextRevision,payloadHash:request.payloadHash};
 },provider:async()=>{providerCalls++}});
 const result=await body(response);
 assert.equal(response.status,503);assert.equal(result.status,"PENDIENTE");assert.equal(result.reason,"PROVIDER_NOT_CONNECTED");
 assert.equal(result.feeCup,null);assert.deepEqual(result.routes,[]);assert.equal(providerCalls,0);
 assert.equal(reservation.userId,operator.userId);assert.equal(reservation.credits,1);assert.equal(reservation.payloadHash,hash);
});
