'use strict';
// Synthetic administration policy validator. No browser, persistence, services or checkout.
const validUsd=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1000000&&Math.round(n*100)===n*100;
function validateShippingPromotionConfig(config){
 if(!config||typeof config!=='object'||Array.isArray(config))return {ok:false,reason:'invalid_config'};
 const keys=Object.keys(config);
 if(keys.some(k=>!['enabled','thresholdUsd'].includes(k)))return {ok:false,reason:'unknown_config_field'};
 if(typeof config.enabled!=='boolean')return {ok:false,reason:'invalid_enabled'};
 if(config.enabled){
  if(!validUsd(config.thresholdUsd)||config.thresholdUsd===0)return {ok:false,reason:'invalid_threshold'};
  return {ok:true,thresholdUsd:config.thresholdUsd};
 }
 if(config.thresholdUsd!==null&&config.thresholdUsd!==undefined)return {ok:false,reason:'disabled_threshold_must_be_null'};
 return {ok:true,thresholdUsd:null};
}
function quoteWithPromotionConfig({config,...args}){
 const parsed=validateShippingPromotionConfig(config);
 if(!parsed.ok)return {available:false,reason:parsed.reason};
 const {quoteMixedDelivery}=require('./delivery-mixed-fees-isolated.cjs');
 return quoteMixedDelivery({...args,freeShippingThresholdUsd:parsed.thresholdUsd});
}
module.exports={validateShippingPromotionConfig,quoteWithPromotionConfig};
