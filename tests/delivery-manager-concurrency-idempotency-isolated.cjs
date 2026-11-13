'use strict';
// Synchronous, in-memory deterministic model of a server-side atomic quote transaction.
// NOT a durable lock, database transaction, or production idempotency implementation.
const crypto=require('node:crypto');
const {quoteThroughVerifiedBoundary}=require('./delivery-manager-integrated-boundary-isolated.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const validId=x=>typeof x==='string'&&x.length>0&&x.length<=128&&/^[a-zA-Z0-9_-]+$/.test(x);
const reject=reason=>({available:false,reason});
function createSyntheticQuoteStore({snapshot,nowMs,ttlMs=300000}){
 if(!snapshot||!Number.isSafeInteger(nowMs)||nowMs<0||!Number.isSafeInteger(ttlMs)||ttlMs<1)return null;
 let current=snapshot;
 const records=new Map();
 const clone=x=>structuredClone(x);
 const publicResult=entry=>clone(entry.result);
 return {
  replaceSnapshot(next){current=clone(next);},
  advanceClock(next){if(!Number.isSafeInteger(next)||next<nowMs)throw Error('non_monotonic_clock');nowMs=next;},
  quote({key,request,principal,routeRecord}){
   if(!validId(key)||!request||!principal||!routeRecord)return reject('invalid_operation');
   const scope=principal.id+':'+key;
   const payloadHash=hash({request,principalId:principal.id,routeId:routeRecord.routeId});
   const existing=records.get(scope);
   if(existing){
    if(existing.payloadHash!==payloadHash)return reject('idempotency_payload_conflict');
    if(nowMs>existing.expiresAtMs){records.delete(scope);return reject('idempotency_key_expired');}
    // Even a retry cannot return a quote from a different tariff/cart revision.
    if(existing.snapshotHash!==hash(current))return reject('quote_snapshot_changed');
    if(nowMs>existing.quoteExpiresAtMs)return reject('quote_expired');
    return {...publicResult(existing),replayed:true};
   }
   const before=hash(current);
   const immutable=clone(current);
   const result=quoteThroughVerifiedBoundary({request,principal,serverContext:immutable.serverContext,
    routeRecord,nowMs});
   if(!result.available)return result;
   if(hash(current)!==before)return reject('concurrent_snapshot_change');
   const quoteExpiresAtMs=Math.min(nowMs+ttlMs,routeRecord.verifiedAtMs+900000);
   if(quoteExpiresAtMs<nowMs)return reject('quote_expired');
   const quoteResult={...result,quoteExpiresAtMs,replayed:false,synthetic:true};
   records.set(scope,{payloadHash,snapshotHash:before,result:quoteResult,
    quoteExpiresAtMs,expiresAtMs:nowMs+ttlMs});
   return clone(quoteResult);
  },
  recordsCount(){return records.size;}
 };
}
module.exports={createSyntheticQuoteStore};
