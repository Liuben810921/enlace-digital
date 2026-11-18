'use strict';
// Disposable, in-memory SERVER-SIDE SIMULATOR. Not a client authorization mechanism.
const {snapshot,requestManualQuote}=require('./manual-approval.js');
const pending=reason=>({status:'PENDIENTE',reason,deliveryFeeCup:null,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER'});
const id=x=>typeof x==='string'&&x.trim().length>0&&x.length<=128;
const time=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):NaN;
function createServerApprovalLab({readActor,readApprover,readContext,clock,ttlMs=900000}={}){
 if(typeof readActor!=='function'||typeof readApprover!=='function'||typeof readContext!=='function'||typeof clock!=='function'||!Number.isSafeInteger(ttlMs)||ttlMs<=0)throw Error('INVALID_DEPENDENCIES');
 const approvals=new Map(),operations=new Map();let sequence=0;
 function context(){const c=readContext();if(!c||typeof c!=='object')return null;return c}
 function approve({operationId,feeCup}={}){
  if(!id(operationId)||!Number.isSafeInteger(feeCup)||feeCup<0)return {status:'REJECTED',reason:'INVALID_INPUT'};
  const actor=readActor();if(!actor||!id(actor.id)||!['principal','general'].includes(actor.role)||actor.enabled!==true)return {status:'REJECTED',reason:'UNAUTHORIZED'};
  const c=context();if(!c)return {status:'REJECTED',reason:'NO_CONTEXT'};
  if(c.quarantined)return {status:'REJECTED',reason:'QUARANTINE'};
  const request=requestManualQuote(c);if(request.reason!=='MANUAL_APPROVAL_REQUIRED')return {status:'REJECTED',reason:request.reason};
  const key=actor.id+'\u0000'+operationId;
  const payload=JSON.stringify([request.request.fingerprint,feeCup]);
  if(operations.has(key)){
   const old=operations.get(key);return old.payload===payload?{status:'APPROVAL_STORED',approvalId:old.approvalId,idempotentReplay:true}:{status:'CONFLICT',reason:'OPERATION_REUSED'};
  }
  const issuedAt=time(clock());if(!Number.isFinite(issuedAt))return {status:'REJECTED',reason:'INVALID_CLOCK'};
  const approvalId='lab-'+(++sequence);
  approvals.set(approvalId,{approvalId,actorId:actor.id,actorRole:actor.role,fingerprint:request.request.fingerprint,feeCup,issuedAt,revoked:false});
  operations.set(key,{payload,approvalId});
  return {status:'APPROVAL_STORED',approvalId,idempotentReplay:false};
 }
 function revoke({approvalId}={}){
  const actor=readActor();if(!actor||!id(actor.id)||!['principal','general'].includes(actor.role)||actor.enabled!==true)return {status:'REJECTED',reason:'UNAUTHORIZED'};
  const record=approvals.get(approvalId);if(!record)return {status:'REJECTED',reason:'NOT_FOUND'};
  record.revoked=true;return {status:'REVOKED',approvalId};
 }
 function resolve({approvalId}={}){
  const record=approvals.get(approvalId);if(!record)return pending('APPROVAL_NOT_FOUND');
  if(record.revoked)return pending('APPROVAL_REVOKED');
  const approver=readApprover(record.actorId);
  if(!approver||approver.enabled!==true||!['principal','general'].includes(approver.role))return pending('APPROVER_NO_LONGER_AUTHORIZED');
  const c=context();if(!c)return pending('NO_CONTEXT');
  if(c.quarantined)return pending('QUARANTINE');
  const request=requestManualQuote(c);if(request.reason!=='MANUAL_APPROVAL_REQUIRED')return pending(request.reason);
  if(request.request.fingerprint!==record.fingerprint)return pending('APPROVAL_STALE');
  const now=time(clock());if(!Number.isFinite(now)||now<record.issuedAt||now-record.issuedAt>ttlMs)return pending('APPROVAL_EXPIRED');
  // Read actor again as a server-side authority lookup for the approver, not the caller.
  // The injected readApprover is required before a real implementation may trust stored roles.
  return {status:'APPROVAL_LAB_ONLY',deliveryFeeCup:record.feeCup,productTotalAdjustment:0,collection:'DIRECT_TO_COURIER',simulationOnly:true,approvalId};
 }
 return Object.freeze({approve,revoke,resolve});
}
module.exports={createServerApprovalLab};
