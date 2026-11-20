// Offline synthetic assertions for identity and reservation decision gates.
// Run with: deno test (only if Deno is already available; no installations).
import {resolveOperator,evaluateReservation} from "./geoapify-operator-offline.ts";
const id="123e4567-e89b-42d3-a456-426614174000";
function assert(condition:boolean,label:string){if(!condition)throw Error(label)}
Deno.test("rejects missing authentication and forged ACL",()=>{
 assert(!resolveOperator(null,{user_id:id,role:"principal",active:true}).ok,"missing user");
 assert(!resolveOperator({id},{user_id:"123e4567-e89b-42d3-a456-426614174001",role:"principal",active:true}).ok,"mismatched ACL");
 assert(!resolveOperator({id,is_anonymous:true},{user_id:id,role:"principal",active:true}).ok,"anonymous");
 assert(!resolveOperator({id},{user_id:id,role:"supervisor",active:true}).ok,"read-only supervisor");
});
Deno.test("allows only committed first reservation",()=>{
 const operator=resolveOperator({id},{user_id:id,role:"principal",active:true});
 assert(operator.ok,"operator");
 assert(evaluateReservation(operator,{outcome:"RESERVED",reserved_request_id:"request_123456"},"request_123456").allowed,"first reservation");
 for(const outcome of ["ALREADY_RESERVED","QUOTA_EXHAUSTED","IDEMPOTENCY_CONFLICT","UNAUTHORIZED"]){
  assert(!evaluateReservation(operator,{outcome,reserved_request_id:"request_123456"},"request_123456").allowed,outcome);
 }
 assert(!evaluateReservation(operator,{outcome:"RESERVED",reserved_request_id:"other_123456"},"request_123456").allowed,"request mismatch");
});
