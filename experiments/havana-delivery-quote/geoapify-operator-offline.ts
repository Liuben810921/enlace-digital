// OFFLINE ONLY. This module does not connect to Supabase or Geoapify.
// Supabase Auth user verification must be performed by the server with a
// publishable-key-scoped Auth client (never trust decoded JWT payload alone).
export type AdminRole="principal"|"administrador_general";
export type IdentityResult={ok:true;userId:string;role:AdminRole}|{ok:false;reason:string};
type AuthUser={id:string;aud?:string;is_anonymous?:boolean};
type AdminRecord={user_id:string;role:string;active:boolean};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function resolveOperator(authUser:AuthUser|null,acl:AdminRecord|null):IdentityResult{
 if(!authUser||!uuid.test(authUser.id)||authUser.is_anonymous===true)return {ok:false,reason:"AUTH_USER_NOT_VERIFIED"};
 if(!acl||acl.user_id!==authUser.id||acl.active!==true||!["principal","administrador_general"].includes(acl.role))return {ok:false,reason:"ADMIN_ACL_DENIED"};
 return {ok:true,userId:authUser.id,role:acl.role as AdminRole};
}
export type Reservation={outcome:string;reserved_request_id:string|null};
export function evaluateReservation(identity:IdentityResult,reservation:Reservation|null,expectedRequestId:string){
 if(!identity.ok)return {allowed:false,reason:identity.reason};
 if(!reservation||reservation.outcome!=="RESERVED"||reservation.reserved_request_id!==expectedRequestId)return {allowed:false,reason:reservation?.outcome||"RESERVATION_MISSING"};
 // Must be a committed reservation from a trusted server-side SQL RPC.
 return {allowed:true,reason:"FIRST_COMMITTED_RESERVATION_ONLY"};
}
// Integration requirements: server verifies bearer token using Auth getUser(token),
// loads private ACL with least-privilege DB worker, computes canonical payload SHA256,
// assigns server-owned daily cap and requestId, executes reservation RPC in ONE
// transaction, confirms commit, then makes at most one provider request.
// Do not accept identity, quota, hash or 'verified' flag from browser request.
