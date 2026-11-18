'use strict';
// Offline policy gate: never invent a mixed-cart special-fee aggregation.
const {quoteCartDelivery}=require('./cart-origins.js');
const pending=reason=>({status:'PENDIENTE',reason,deliveryFeeCup:null,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER'});
function quoteWithSpecialPolicy({cart,productDeliveryRules, ...args}={}){
 if(!Array.isArray(cart)||!cart.length||!Array.isArray(productDeliveryRules))return pending('SPECIAL_POLICY_INPUT_INVALID');
 const rules=new Map();
 for(const rule of productDeliveryRules){
  if(!rule||typeof rule.productId!=='string'||!rule.productId||rules.has(rule.productId)||!['normal','special'].includes(rule.mode))return pending('SPECIAL_POLICY_INPUT_INVALID');
  if(rule.mode==='special'&&(!Number.isSafeInteger(rule.feeCup)||rule.feeCup<0))return pending('SPECIAL_POLICY_INPUT_INVALID');
  rules.set(rule.productId,rule);
 }
 const unique=new Set();
 let special=null;
 for(const item of cart){
  if(!item||typeof item.productId!=='string'||!item.productId)return pending('SPECIAL_POLICY_INPUT_INVALID');
  unique.add(item.productId);
  const rule=rules.get(item.productId);
  if(!rule)return pending('SPECIAL_POLICY_MISSING');
  if(rule.mode==='special'){
   if(special!==null&&special.productId!==item.productId)return pending('SPECIAL_POLICY_UNDECIDED');
   special=rule;
  }
 }
 // A mixed normal/special cart or more than one special unit has no approved aggregation.
 if(special&&(unique.size>1||cart.filter(x=>x.productId===special.productId).reduce((n,x)=>n+x.quantity,0)!==1))return pending('SPECIAL_POLICY_UNDECIDED');
 // Single special product is supported by the existing one-fee quote contract.
 return quoteCartDelivery({...args,cart,specialFeeCup:special?special.feeCup:null});
}
module.exports={quoteWithSpecialPolicy};
