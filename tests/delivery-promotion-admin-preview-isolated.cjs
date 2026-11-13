'use strict';
// Offline administration preview; no persistence, UI, production or external services.
const {validateShippingPromotionConfig,quoteWithPromotionConfig}=require('./delivery-promotion-config-isolated.cjs');
function makePromotionDraft({enabled=false,thresholdUsd=null,freeProductIds=[]}={}){
 const config={enabled,thresholdUsd};
 const valid=validateShippingPromotionConfig(config);
 if(!valid.ok)return {ok:false,reason:valid.reason};
 if(!Array.isArray(freeProductIds)||freeProductIds.some(x=>typeof x!=='string'||!x.trim())||new Set(freeProductIds).size!==freeProductIds.length)
  return {ok:false,reason:'invalid_product_ids'};
 return {ok:true,draft:{config,freeProductIds:[...freeProductIds]}};
}
function previewPromotion({draft,lines,...args}){
 if(!draft||!draft.config)return {available:false,reason:'invalid_draft'};
 const checked=makePromotionDraft({...draft.config,freeProductIds:draft.freeProductIds});
 if(!checked.ok)return {available:false,reason:checked.reason};
 if(!Array.isArray(lines))return {available:false,reason:'invalid_lines'};
 const ids=new Set(lines.map(x=>x?.productId));
 if(checked.draft.freeProductIds.some(id=>!ids.has(id)))return {available:false,reason:'unknown_promoted_product'};
 const promoted=new Set(checked.draft.freeProductIds);
 return quoteWithPromotionConfig({config:checked.draft.config,lines:lines.map(line=>({...line,freeShipping:line?.freeShipping===true||promoted.has(line?.productId)})),...args});
}
function createDraftSession(initial){
 const checked=makePromotionDraft(initial);
 if(!checked.ok)return checked;
 const original=JSON.parse(JSON.stringify(checked.draft));
 let current=JSON.parse(JSON.stringify(original));
 return {ok:true,
  read:()=>JSON.parse(JSON.stringify(current)),
  edit:next=>{const r=makePromotionDraft(next);if(!r.ok)return r;current=r.draft;return {ok:true};},
  revert:()=>{current=JSON.parse(JSON.stringify(original));return {ok:true,draft:JSON.parse(JSON.stringify(current))};},
  preview:args=>previewPromotion({...args,draft:current})
 };
}
module.exports={makePromotionDraft,previewPromotion,createDraftSession};
