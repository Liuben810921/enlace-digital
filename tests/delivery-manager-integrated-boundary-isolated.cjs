'use strict';
// Offline integration seam. The server MUST assemble all context from trusted sources.
// Never expose this module as a network endpoint without real auth and persistence.
const {authorize,verifyRouteProvenance}=require('./delivery-manager-policy-route-audit-isolated.cjs');
const {quoteManagerServerContract}=require('./delivery-manager-server-contract-isolated.cjs');
const own=(x,k)=>Object.prototype.hasOwnProperty.call(x,k);
const fail=reason=>({available:false,reason});
function quoteThroughVerifiedBoundary({request,principal,serverContext,routeRecord,nowMs}={}){
 if(!request||typeof request!=='object'||Array.isArray(request)||!principal||
    !serverContext||typeof serverContext!=='object'||!routeRecord)return fail('invalid_integration_context');
 const permission=authorize({principal,action:'quote:preview'});
 if(!permission.ok)return fail(permission.reason);
 if(principal.role!=='gestor'&&principal.role!=='administrador_general')return fail('forbidden_role');
 const cart=Array.isArray(serverContext.carts)&&serverContext.carts.find(c=>c&&c.id===request.cartId);
 if(!cart||cart.ownerId!==principal.id||!Array.isArray(cart.lines)||!cart.lines.length)return fail('cart_not_accessible');
 const settings=serverContext.settings;
 if(!settings||typeof settings.version!=='string')return fail('invalid_settings');
 const ids=cart.lines.map(l=>l&&l.dispatchOriginId);
 if(ids.some(id=>typeof id!=='string'||!id.length))return fail('invalid_cart');
 let destinationId;
 if(request.customerKind==='habitual'){
  const customer=Array.isArray(serverContext.customers)&&serverContext.customers.find(c=>c&&c.id===request.customerId);
  if(!customer||customer.assignedManagerId!==principal.id)return fail('customer_not_accessible');
  const assignment=authorize({principal,action:'customer:assigned:read',customerId:request.customerId});
  if(!assignment.ok)return fail(assignment.reason);
  if(own(request,'alternativeAddress')){
   if(own(request,'addressId')||typeof request.alternativeAddress!=='string'||!request.alternativeAddress.trim())return fail('ambiguous_destination');
   destinationId='alternative:'+request.alternativeAddress;
  }else{
   if(!Array.isArray(customer.addresses)||!customer.addresses.some(a=>a&&a.id===request.addressId&&a.active===true))
    return fail('address_not_accessible');
   destinationId='saved:'+request.addressId;
  }
 }else if(request.customerKind==='nuevo'&&typeof request.proposedAddress==='string'&&request.proposedAddress.trim()){
  destinationId='new:'+request.proposedAddress;
 }else return fail('invalid_destination');
 const expected={destinationId,originIds:[...new Set(ids)],cartId:cart.id,settingsVersion:settings.version};
 const verified=verifyRouteProvenance({route:routeRecord,expected,nowMs});
 if(!verified.ok)return fail(verified.reason);
 // Route distances and principal are derived from verified server records, not the request.
 const context={principal:{userId:principal.id,role:principal.role,active:principal.active,allowedCustomerIds:principal.assignedCustomerIds},
  customers:serverContext.customers,carts:serverContext.carts,
  routes:[{destinationId,cartId:cart.id,settingsVersion:settings.version,verified:true,
   verifiedAtMs:routeRecord.verifiedAtMs,roadDistancesKm:verified.distancesKm}],
  settings,nowMs};
 return quoteManagerServerContract({request,context});
}
module.exports={quoteThroughVerifiedBoundary};
