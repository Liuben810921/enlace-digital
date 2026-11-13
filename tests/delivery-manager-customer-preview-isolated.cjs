'use strict';
// Offline manager quote for new/returning customers. Synthetic fixtures only.
const {previewForManager}=require('./delivery-accounting-manager-isolated.cjs');
const hasText=x=>typeof x==='string'&&x.trim().length>0&&x.length<=200;
const validMoney=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1000000;
function previewCustomerDelivery({actorRole,customer,alternativeAddress=null,quoteArgs}){
 if(!['gestor','administrador_general'].includes(actorRole))return {available:false,reason:'forbidden_role'};
 if(!customer||!['nuevo','habitual'].includes(customer.kind))return {available:false,reason:'invalid_customer_kind'};
 if(!quoteArgs||typeof quoteArgs!=='object'||Array.isArray(quoteArgs))return {available:false,reason:'invalid_quote_args'};
 const returning=customer.kind==='habitual';
 if(returning&&(!hasText(customer.savedAddress)||!hasText(customer.savedAddressId)))
  return {available:false,reason:'missing_saved_address'};
 if(!returning&&(customer.savedAddress!==undefined||customer.savedAddressId!==undefined))
  return {available:false,reason:'new_customer_has_saved_address'};
 if(alternativeAddress!==null&&!hasText(alternativeAddress))return {available:false,reason:'invalid_alternative_address'};
 const address=alternativeAddress??(returning?customer.savedAddress:customer.proposedAddress);
 if(!hasText(address))return {available:false,reason:'missing_destination_address'};
 const last=returning?customer.lastDeliveryQuoteCup:null;
 if(last!==null&&last!==undefined&&!validMoney(last))return {available:false,reason:'invalid_last_reference'};
 // Reject callers attempting to inject a stale cached price as an authoritative current quote.
 if('feeCup' in quoteArgs||'customerFeeCup' in quoteArgs||'calculatedDeliveryValueCup' in quoteArgs)
  return {available:false,reason:'forbidden_quote_override'};
 const result=previewForManager({...quoteArgs,actorRole});
 if(!result.available)return {...result,destinationMode:alternativeAddress!==null?'alternativa':returning?'guardada':'nueva'};
 return {...result,destinationMode:alternativeAddress!==null?'alternativa':returning?'guardada':'nueva',
  destinationLabel:address,previousDeliveryQuoteCup:last??null,
  previousQuoteIsReferenceOnly:true,quoteUsesCurrentSettings:true,
  historicalQuoteDifferenceCup:last===null||last===undefined?null:result.customerFeeCup-last,
  customerKind:customer.kind,synthetic:true};
}
module.exports={previewCustomerDelivery};
