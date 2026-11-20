'use strict';
// Pure, offline integration facade for the delivery administration UI.
// Does not contact external services or create customer-payable quotes.
function createDeliveryController({assembleDeliveryContext,calculateDeliveryPreview}){
 if(typeof assembleDeliveryContext!=='function'||typeof calculateDeliveryPreview!=='function')throw Error('MISSING_DELIVERY_DEPENDENCIES');
 function preview(snapshot){
  const context=assembleDeliveryContext(snapshot);
  if(context.status!=='READY_FOR_PREVIEW')return context;
  // All routes remain untrusted until an authenticated server verifier is deployed.
  return calculateDeliveryPreview({...context,trustProvider:false});
 }
 function summarize(snapshot){
  const result=preview(snapshot);
  if(result.status!=='VISTA_PREVIA')return {status:'PENDIENTE',reason:result.reason||'NO_VERIFIED_ROUTES',amountCup:null,canCheckout:false};
  return {status:'VISTA_PREVIA',amountCup:result.feeCup,lines:result.lines,canCheckout:false};
 }
 return Object.freeze({preview,summarize});
}
if(typeof module!=='undefined'&&module.exports)module.exports={createDeliveryController};
if(typeof window!=='undefined')window.EDDeliveryController=Object.freeze({createDeliveryController});
