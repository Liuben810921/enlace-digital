'use strict';
// Offline-only selection; never certifies road distances or produces a payable quote.
const {validateConfiguration,adaptCheckoutDelivery}=require('./integration.js');
const validId=x=>typeof x==='string'&&x.trim().length>0;
const pending=reason=>({status:'PENDIENTE',reason,deliveryFeeCup:null,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER'});
function selectCartOrigins({configuration,cart,associations,expectedRevision}={}){
 const check=validateConfiguration(configuration);
 if(!check.ok)return {ok:false,reason:check.reason};
 if(configuration.revision!==expectedRevision)return {ok:false,reason:'STALE_REVISION'};
 if(!Array.isArray(cart)||!cart.length||!cart.every(x=>x&&validId(x.productId)&&Number.isSafeInteger(x.quantity)&&x.quantity>0))return {ok:false,reason:'INVALID_CART'};
 if(!associations||typeof associations!=='object'||Array.isArray(associations))return {ok:false,reason:'INVALID_ASSOCIATIONS'};
 const byId=new Map(configuration.origins.map(o=>[o.id,o]));
 const suppliers=new Map(configuration.suppliers.map(s=>[s.id,s]));
 const chosen=new Map();
 for(const item of cart){
  if(!Object.prototype.hasOwnProperty.call(associations,item.productId))return {ok:false,reason:'ASSOCIATION_MISSING'};
  const ids=associations[item.productId];
  if(!Array.isArray(ids)||!ids.length||new Set(ids).size!==ids.length)return {ok:false,reason:'ASSOCIATION_INVALID'};
  for(const id of ids){
   if(!validId(id)||!byId.has(id))return {ok:false,reason:'ASSOCIATION_INVALID'};
   const origin=byId.get(id);
   if(origin.active===false||(origin.type==='proveedor'&&suppliers.get(origin.supplierId)?.active===false))return {ok:false,reason:'ORIGIN_INACTIVE'};
   chosen.set(id,origin);
  }
 }
 return {ok:true,origins:[...chosen.values()],reason:null};
}
function quoteCartDelivery({configuration,cart,associations,expectedRevision,routes,quoteDelivery,...options}={}){
 const selected=selectCartOrigins({configuration,cart,associations,expectedRevision});
 if(!selected.ok)return pending(selected.reason);
 const scoped={...configuration,origins:selected.origins};
 return adaptCheckoutDelivery({configuration:scoped,expectedRevision,routes,quoteDelivery,...options});
}
module.exports={selectCartOrigins,quoteCartDelivery};
