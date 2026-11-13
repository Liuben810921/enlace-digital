'use strict';
// Proposed synthetic order-level policy. Not connected to checkout or production.
const {planDelivery}=require('./delivery-dispatch-isolated.cjs');
const validMoney=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000000;
function quoteMixedDelivery({province,lines,origins,roadDistancesKm,settings={},orderFreeShipping=false}){
 if(!Array.isArray(lines)||!lines.length)return {available:false,reason:'invalid_lines'};
 if(typeof orderFreeShipping!=='boolean')return {available:false,reason:'invalid_free_shipping'};
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
 const chargeable=lines.filter(line=>line.freeShipping!==true);
 const special=chargeable.filter(line=>line.specialFeeCup!==null&&line.specialFeeCup!==undefined);
 const maxSpecialFeeCup=special.length?Math.max(...special.map(line=>line.specialFeeCup)):null;
 // One delivery charge per order. No summing product fees or per-origin fees.
 // The highest special fee acts as a minimum floor over normal distance-based fee.
 const feeCup=orderFreeShipping||!chargeable.length?0:Math.max(base.feeCup,maxSpecialFeeCup??0);
 const mode=feeCup===0?'free':maxSpecialFeeCup!==null&&maxSpecialFeeCup>base.feeCup?'special_floor':'normal';
 return {...base,feeCup,mode,normalFeeCup:base.feeCup,maxSpecialFeeCup,
  chargeableProducts:chargeable.length,freeProducts:lines.length-chargeable.length,
  policy:'single_delivery_max_floor_v1',synthetic:true};
}
module.exports={quoteMixedDelivery};
