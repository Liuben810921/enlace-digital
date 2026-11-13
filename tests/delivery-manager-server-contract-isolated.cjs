'use strict';
// Contract-only integration boundary. All records are synthetic trusted server fixtures.
// Never accept actor role, settings, dispatch or route distances from a client request.
const {quoteDeliveryAccounting}=require('./delivery-accounting-manager-isolated.cjs');
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const txt=x=>typeof x==='string'&&x.trim()===x&&x.length>0&&x.length<=200;
const keys=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k))&&Object.getOwnPropertySymbols(o).length===0;
const safeId=x=>txt(x)&&!/^(?:__proto__|prototype|constructor)$/.test(x);
const safeDistanceMap=(o,required)=>{
 if(!keys(o,required)||Object.keys(o).length!==required.length)return false;
 return required.every(id=>own(o,id)&&typeof o[id]==='number'&&Number.isFinite(o[id])&&o[id]>=0&&o[id]<=100000);
};
const reject=reason=>({available:false,reason});
function quoteManagerServerContract({request,context}={}){
 if(!keys(request,['customerKind','customerId','addressId','proposedAddress','alternativeAddress','cartId'])||
     !keys(context,['principal','customers','carts','routes','settings','nowMs']))return reject('invalid_contract');
 const {principal,customers,carts,routes,settings,nowMs}=context;
 if(!keys(principal,['userId','role','active','allowedCustomerIds'])||!txt(principal.userId)||principal.active!==true||
     !['gestor','administrador_general'].includes(principal.role))return reject('forbidden_principal');
 if(!Array.isArray(principal.allowedCustomerIds)||!Array.isArray(customers)||!Array.isArray(carts)||!Array.isArray(routes)||
     !keys(settings,['thresholdUsd','roundToCup','rateCupPerKm','minKm','minFeeCup','version'])||
     !Number.isSafeInteger(nowMs)||nowMs<0)return reject('invalid_server_context');
 if(!safeId(request.cartId)||!['nuevo','habitual'].includes(request.customerKind))return reject('invalid_request');
 const cart=carts.find(x=>x.id===request.cartId);
 if(!cart||cart.ownerId!==principal.userId)return reject('cart_not_accessible');
 if(!Array.isArray(cart.lines)||!cart.lines.length||!Array.isArray(cart.origins)||!cart.origins.length)return reject('invalid_cart');
 let destination,history=null,destinationId;
 if(request.customerKind==='habitual'){
  if(!safeId(request.customerId)||!principal.allowedCustomerIds.includes(request.customerId))return reject('customer_not_accessible');
  const customer=customers.find(x=>x.id===request.customerId);
  if(!customer||customer.assignedManagerId!==principal.userId||!Array.isArray(customer.addresses))return reject('customer_not_accessible');
  if(own(request,'proposedAddress'))return reject('unexpected_new_address');
  if(own(request,'alternativeAddress')){
   if(!txt(request.alternativeAddress))return reject('invalid_destination');
   destination=request.alternativeAddress;destinationId='alternative:'+destination;
  }else{
   if(!safeId(request.addressId))return reject('missing_saved_address_id');
   const saved=customer.addresses.find(a=>a.id===request.addressId&&a.active===true);
   if(!saved||!txt(saved.label))return reject('address_not_accessible');
   destination=saved.label;destinationId='saved:'+saved.id;
   history=Number.isSafeInteger(saved.lastQuoteCup)&&saved.lastQuoteCup>=0?saved.lastQuoteCup:null;
  }
 }else{
  if(own(request,'customerId')||own(request,'addressId')||own(request,'alternativeAddress')||!txt(request.proposedAddress))
   return reject('invalid_new_customer');
  destination=request.proposedAddress;destinationId='new:'+destination;
 }
 if(!safeId(settings.version)||!Number.isSafeInteger(settings.roundToCup)||settings.roundToCup<=0||settings.roundToCup>10000||
    ![settings.thresholdUsd,settings.rateCupPerKm,settings.minKm,settings.minFeeCup].every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000000)||settings.thresholdUsd===0)return reject('invalid_settings');
 const route=routes.find(x=>x.destinationId===destinationId&&x.cartId===cart.id&&x.settingsVersion===settings.version);
 if(!route||route.verified!==true||!Number.isSafeInteger(route.verifiedAtMs)||route.verifiedAtMs>nowMs||
     nowMs-route.verifiedAtMs>15*60*1000)return reject('missing_fresh_verified_route');
 const requiredOrigins=[...new Set(cart.lines.map(l=>l.dispatchOriginId))];
 if(!keys(route,['destinationId','cartId','settingsVersion','verified','verifiedAtMs','roadDistancesKm'])||
     requiredOrigins.some(id=>!safeId(id))||!safeDistanceMap(route.roadDistancesKm,requiredOrigins))return reject('invalid_route');
 const q=quoteDeliveryAccounting({
  province:cart.province,lines:cart.lines,origins:cart.origins,roadDistancesKm:route.roadDistancesKm,
  orderSubtotalUsd:cart.subtotalUsd,freeShippingThresholdUsd:settings.thresholdUsd,
  roundToCup:settings.roundToCup,rateCupPerKm:settings.rateCupPerKm,minKm:settings.minKm,minFeeCup:settings.minFeeCup
 });
 if(!q.available)return q;
 return {available:true,previewOnly:true,orderCreated:false,customerKind:request.customerKind,
  destinationMode:destinationId.startsWith('saved:')?'guardada':destinationId.startsWith('alternative:')?'alternativa':'nueva',
  destinationLabel:destination,previousDeliveryQuoteCup:history,previousQuoteIsReferenceOnly:true,
  calculatedDeliveryValueCup:q.calculatedDeliveryValueCup,customerFeeCup:q.customerFeeCup,
  promotionCoveredCup:q.promotionCoveredCup,freeReason:q.freeReason,
  quoteSettingsVersion:settings.version,verifiedRouteAtMs:route.verifiedAtMs,synthetic:true};
}
module.exports={quoteManagerServerContract};
