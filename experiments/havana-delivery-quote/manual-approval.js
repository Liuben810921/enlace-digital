'use strict';
// Offline manual approval contract. No identity verification, persistence, checkout or payment.
const {createHash}=require('node:crypto');
const {selectCartOrigins}=require('./cart-origins.js');
const {validateConfiguration}=require('./integration.js');
const pending=reason=>({status:'PENDIENTE',reason,deliveryFeeCup:null,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER'});
function fingerprint(value){return createHash('sha256').update(JSON.stringify(value)).digest('hex')}
function snapshot({configuration,expectedRevision,cart,associations,destinationId,productDeliveryRules}={}){
 const selected=selectCartOrigins({configuration,expectedRevision,cart,associations});
 if(!selected.ok)return {ok:false,reason:selected.reason};
 if(!validateConfiguration(configuration).ok)return {ok:false,reason:'INVALID_CONFIGURATION'};
 if(!configuration.destinations.some(d=>d.id===destinationId))return {ok:false,reason:'UNKNOWN_DESTINATION'};
 if(!Array.isArray(productDeliveryRules))return {ok:false,reason:'INVALID_RULES'};
 const rules=new Map();
 for(const r of productDeliveryRules){
  if(!r||typeof r.productId!=='string'||!r.productId||rules.has(r.productId)||!['normal','special'].includes(r.mode)||r.mode==='special'&&(!Number.isSafeInteger(r.feeCup)||r.feeCup<0))return {ok:false,reason:'INVALID_RULES'};
  rules.set(r.productId,r);
 }
 const quantities=new Map();
 for(const item of cart)quantities.set(item.productId,(quantities.get(item.productId)||0)+item.quantity);
 const products=[...quantities].sort((a,b)=>a[0].localeCompare(b[0])).map(([id,quantity])=>{
  const r=rules.get(id);return r?{id,quantity,mode:r.mode,feeCup:r.mode==='special'?r.feeCup:null}:null;
 });
 if(products.some(p=>!p))return {ok:false,reason:'RULE_MISSING'};
 const originIds=selected.origins.map(o=>o.id).sort();
 const context={revision:expectedRevision,destinationId,products,originIds};
 return {ok:true,context,fingerprint:fingerprint(context),products,originIds};
}
function isMixedSpecial(s){
 const special=s.products.filter(p=>p.mode==='special');
 return special.length>0&&(s.products.length>1||special.some(p=>p.quantity!==1));
}
function requestManualQuote(args={}){
 const s=snapshot(args);if(!s.ok)return pending(s.reason);
 if(!isMixedSpecial(s))return pending('MANUAL_NOT_REQUIRED');
 return {...pending('MANUAL_APPROVAL_REQUIRED'),request:{fingerprint:s.fingerprint,contextRevision:s.context.revision,destinationId:s.context.destinationId,originIds:s.originIds,products:s.products}};
}
function approveManualQuote({request,actor,feeCup,approvalId,issuedAt}={}){
 if(!request||typeof request.fingerprint!=='string'||!/^[a-f0-9]{64}$/.test(request.fingerprint)||!Number.isSafeInteger(request.contextRevision)||request.contextRevision<0)return {status:'REJECTED',reason:'INVALID_REQUEST'};
 if(!actor||!['principal','general'].includes(actor.role)||typeof actor.id!=='string'||!actor.id.trim())return {status:'REJECTED',reason:'UNAUTHORIZED_ROLE'};
 if(!Number.isSafeInteger(feeCup)||feeCup<0||typeof approvalId!=='string'||!approvalId.trim()||typeof issuedAt!=='string'||!Number.isFinite(Date.parse(issuedAt)))return {status:'REJECTED',reason:'INVALID_APPROVAL'};
 // This function records only a synthetic assertion, NOT verified server authorization.
 return {status:'APPROVAL_DRAFT',approvalId,actorId:actor.id,actorRole:actor.role,feeCup,issuedAt,fingerprint:request.fingerprint,contextRevision:request.contextRevision};
}
function resolveManualQuote({approval,now,quarantined=false,...args}={}){
 const s=snapshot(args);if(!s.ok)return pending(s.reason);
 if(!isMixedSpecial(s))return pending('MANUAL_NOT_REQUIRED');
 if(quarantined)return pending('QUARANTINE');
 if(!approval||approval.status!=='APPROVAL_DRAFT'||approval.fingerprint!==s.fingerprint||approval.contextRevision!==s.context.revision)return pending('APPROVAL_MISSING_OR_STALE');
 if(!['principal','general'].includes(approval.actorRole)||typeof approval.actorId!=='string'||!approval.actorId||!Number.isSafeInteger(approval.feeCup)||approval.feeCup<0)return pending('APPROVAL_INVALID');
 if(typeof now!=='string'||!Number.isFinite(Date.parse(now))||!Number.isFinite(Date.parse(approval.issuedAt))||Date.parse(approval.issuedAt)>Date.parse(now)||Date.parse(now)-Date.parse(approval.issuedAt)>15*60*1000)return pending('APPROVAL_EXPIRED');
 return {status:'APROBACION_MANUAL_SIMULADA',reason:null,deliveryFeeCup:approval.feeCup,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER',simulationOnly:true,approvalId:approval.approvalId,contextRevision:s.context.revision};
}
module.exports={snapshot,requestManualQuote,approveManualQuote,resolveManualQuote};
