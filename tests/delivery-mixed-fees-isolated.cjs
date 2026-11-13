'use strict';
// Proposed synthetic order-level policy. Not connected to checkout or production.
const {planDelivery}=require('./delivery-dispatch-isolated.cjs');
const validMoney=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000000;
function quoteMixedDelivery({province,lines,origins,roadDistancesKm,settings={},orderFreeShipping=false,orderSubtotalUsd=null,freeShippingThresholdUsd=null}){
 if(!Array.isArray(lines)||!lines.length)return {available:false,reason:'invalid_lines'};
 if(typeof orderFreeShipping!=='boolean')return {available:false,reason:'invalid_free_shipping'};
 if(freeShippingThresholdUsd!==null&&(!validMoney(freeShippingThresholdUsd)||freeShippingThresholdUsd===0))return {available:false,reason:'invalid_free_shipping_threshold'};
 if(orderSubtotalUsd!==null&&!validMoney(orderSubtotalUsd))return {available:false,reason:'invalid_order_subtotal'};
 if(freeShippingThresholdUsd!==null&&orderSubtotalUsd===null)return {available:false,reason:'missing_order_subtotal'};
 const ids=new Set();
 for(const line of lines){
  if(!line||typeof line.productId!=='string'||!line.productId||ids.has(line.productId))
   return {available:false,reason:'duplicate_or_invalid_product'};
  ids.add(line.productId);
  if(line.freeShipping!==undefined&&typeof line.freeShipping!=='boolean')
   return {available:false,reason:'invalid_product_free_shipping',productId:line.productId};
  if(line.specialFeeCup!==undefined&&line.specialFeeCup!==null&&!validMoney(line.specialFeeCup))
   return {available:false,reason:'invalid_product_special_fee',productId:line.productId};
 }
 // Validate every origin and road distance even for free-shipping orders.
 const base=planDelivery({province,lines,origins,roadDistancesKm,...settings,specialFeeCup:null,freeShipping:false});
 if(!base.available)return base;
 const anyProductFree=lines.some(line=>line.freeShipping===true);
 const thresholdFree=freeShippingThresholdUsd!==null&&orderSubtotalUsd>=freeShippingThresholdUsd;
 const special=lines.filter(line=>line.specialFeeCup!==null&&line.specialFeeCup!==undefined);
 const maxSpecialFeeCup=special.length?Math.max(...special.map(line=>line.specialFeeCup)):null;
 // One delivery charge per order. No summing product fees or per-origin fees.
 // The highest special fee acts as a minimum floor over normal distance-based fee.
 const freeReason=orderFreeShipping?'order_promotion':anyProductFree?'product_promotion':thresholdFree?'subtotal_threshold':null;
 const feeCup=freeReason?0:Math.max(base.feeCup,maxSpecialFeeCup??0);
 const mode=feeCup===0?'free':maxSpecialFeeCup!==null&&maxSpecialFeeCup>base.feeCup?'special_floor':'normal';
 return {...base,feeCup,mode,normalFeeCup:base.feeCup,maxSpecialFeeCup,
  chargeableProducts:freeReason?0:lines.length,freeProducts:freeReason?lines.length:0,freeReason,
  policy:'single_delivery_order_wide_free_v2',synthetic:true};
}
module.exports={quoteMixedDelivery};
