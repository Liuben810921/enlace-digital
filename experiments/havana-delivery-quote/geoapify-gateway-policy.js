'use strict';
// Offline-only policy for a future trusted routing gateway. No HTTP, credentials or production wiring.
const MAX_ORIGINS=8, DAILY_CREDIT_CAP=2400, MAX_PER_MINUTE=30;
function reject(reason){return {status:'PENDIENTE',reason,requests:[],estimatedCredits:0};}
function planRouteBatch(input={},usage={}){
 const {originIds,destinationId,contextRevision,mode='drive'}=input;
 if(!Number.isSafeInteger(contextRevision)||contextRevision<0)return reject('INVALID_REVISION');
 if(!Array.isArray(originIds)||!originIds.length||originIds.length>MAX_ORIGINS||originIds.some(id=>typeof id!=='string'||!id.trim())||new Set(originIds).size!==originIds.length||typeof destinationId!=='string'||!destinationId.trim()||originIds.includes(destinationId))return reject('INVALID_SCOPE');
 if(mode!=='drive')return reject('UNSUPPORTED_MODE');
 if(!Number.isSafeInteger(usage.dailyCredits)||usage.dailyCredits<0||!Number.isSafeInteger(usage.minuteRequests)||usage.minuteRequests<0)return reject('USAGE_UNKNOWN');
 const credits=originIds.length;
 if(usage.dailyCredits+credits>DAILY_CREDIT_CAP)return reject('DAILY_BUDGET_EXCEEDED');
 if(usage.minuteRequests+credits>MAX_PER_MINUTE)return reject('RATE_LIMIT_EXCEEDED');
 return {status:'PENDIENTE',reason:'AWAITING_TRUSTED_GATEWAY',estimatedCredits:credits,requests:originIds.map(originId=>({originId,destinationId,contextRevision,mode}))};
}
module.exports=Object.freeze({planRouteBatch,MAX_ORIGINS,DAILY_CREDIT_CAP,MAX_PER_MINUTE});
