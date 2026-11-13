'use strict';
// Offline accounting/manager-preview adapter. Not wired to orders, UI or Supabase.
const {quoteMixedDelivery}=require('./delivery-mixed-fees-isolated.cjs');
const valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
function quoteDeliveryAccounting({roundToCup=100,actorRole='administrador_general',...args}){
 if(!Number.isSafeInteger(roundToCup)||roundToCup<=0||roundToCup>10000)return {available:false,reason:'invalid_rounding_increment'};
 const result=quoteMixedDelivery(args);
 if(!result.available)return result;
 const grossBase=Math.max(result.normalFeeCup,result.maxSpecialFeeCup??0);
 const roundedGrossCup=Math.ceil(grossBase/roundToCup)*roundToCup;
 if(!Number.isSafeInteger(roundedGrossCup)||!valid(roundedGrossCup))return {available:false,reason:'invalid_accounting_amount'};
 const customerFeeCup=result.freeReason?0:roundedGrossCup;
 return {...result,feeCup:customerFeeCup,customerFeeCup,calculatedDeliveryValueCup:roundedGrossCup,
  promotionCoveredCup:roundedGrossCup-customerFeeCup,roundToCup,
  accountingStatus:'estimated_not_actual_cost',synthetic:true};
}
function validateAdminDeliverySettings({actorRole,thresholdUsd,roundToCup}){
 if(actorRole!=='administrador_general')return {ok:false,reason:'forbidden_role'};
 if(typeof thresholdUsd!=='number'||!Number.isFinite(thresholdUsd)||thresholdUsd<=0||thresholdUsd>1000000||Math.abs(thresholdUsd*100-Math.round(thresholdUsd*100))>1e-7)return {ok:false,reason:'invalid_threshold'};
 if(!Number.isSafeInteger(roundToCup)||roundToCup<=0||roundToCup>10000)return {ok:false,reason:'invalid_rounding_increment'};
 return {ok:true,settings:{thresholdUsd,roundToCup}};
}
// No user-controlled writes. The manager receives an estimate from an already selected destination/origin fixture.
function previewForManager({actorRole,...args}){
 if(!['gestor','administrador_general'].includes(actorRole))return {available:false,reason:'forbidden_role'};
 const quote=quoteDeliveryAccounting(args);
 return quote.available?{...quote,previewOnly:true,orderCreated:false}:quote;
}
module.exports={quoteDeliveryAccounting,validateAdminDeliverySettings,previewForManager};
