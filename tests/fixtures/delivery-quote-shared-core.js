'use strict';
// Browser/Node shared pure quote core; no network, auth or persistence.
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.EDDeliveryQuoteCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function quote({distanceKm,rateCupPerKm=200,minKm=3,minFeeCup=600,specialFeeCup=0,roundToCup=100,subtotalUsd,thresholdUsd=200,productFree=false}){
  const numeric=[distanceKm,rateCupPerKm,minKm,minFeeCup,specialFeeCup,roundToCup,subtotalUsd,thresholdUsd];
  if(numeric.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0)||!Number.isSafeInteger(roundToCup)||roundToCup<1||roundToCup>10000||typeof productFree!=='boolean'||thresholdUsd<=0)
   return {available:false,reason:'invalid_quote_parameters'};
  const normal=Math.max(minFeeCup,Math.ceil(Math.max(minKm,distanceKm)*rateCupPerKm));
  const gross=Math.ceil(Math.max(normal,specialFeeCup)/roundToCup)*roundToCup;
  if(!Number.isSafeInteger(gross))return {available:false,reason:'invalid_accounting_amount'};
  const freeReason=productFree?'product_promotion':subtotalUsd>=thresholdUsd?'subtotal_threshold':null;
  const customerFeeCup=freeReason?0:gross;
  return {available:true,calculatedDeliveryValueCup:gross,customerFeeCup,promotionCoveredCup:gross-customerFeeCup,freeReason,synthetic:true};
 }
 return {quote};
});
