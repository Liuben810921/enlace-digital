'use strict';
// Synthetic server contracts only. No database, network, secrets or actual identity verification.
const crypto=require('node:crypto');
const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(o,required)=>plain(o)&&Object.keys(o).length===required.length&&required.every(k=>Object.hasOwn(o,k));
const text=x=>typeof x==='string'&&x.length>0&&x.length<=160&&x.trim()===x;
const int=x=>Number.isSafeInteger(x)&&x>=0;
const fail=reason=>({ok:false,reason});
const policy=Object.freeze({
 gestor:Object.freeze(['quote:preview','customer:assigned:read']),
 administrador_general:Object.freeze(['quote:preview','customer:assigned:read','delivery:settings:update','delivery:audit:read']),
 supervisor:Object.freeze(['delivery:audit:read']),
 cliente:Object.freeze([])
});
function authorize({principal,action,customerId=null}){
 if(!exact(principal,['id','role','active','assignedCustomerIds'])||!text(principal.id)||principal.active!==true||
    !Array.isArray(principal.assignedCustomerIds)||!principal.assignedCustomerIds.every(text))return fail('invalid_principal');
 if(!Object.hasOwn(policy,principal.role)||!policy[principal.role].includes(action))return fail('forbidden_action');
 if(action==='customer:assigned:read'&&(!text(customerId)||!principal.assignedCustomerIds.includes(customerId)))return fail('customer_not_assigned');
 return {ok:true};
}
function verifyRouteProvenance({route,expected,nowMs,maxAgeMs=900000}){
 const fields=['routeId','destinationId','originIds','distancesKm','cartId','settingsVersion','verifiedAtMs','source','trustedByServer'];
 if(!exact(route,fields)||!exact(expected,['destinationId','originIds','cartId','settingsVersion'])||!int(nowMs)||
    !int(maxAgeMs)||maxAgeMs>3600000)return fail('invalid_route_contract');
 if(!text(route.routeId)||!text(route.destinationId)||!text(route.cartId)||!text(route.settingsVersion)||
    route.destinationId!==expected.destinationId||route.cartId!==expected.cartId||route.settingsVersion!==expected.settingsVersion)
    return fail('route_binding_mismatch');
 if(route.trustedByServer!==true||!['server_route_provider','server_verified_cache'].includes(route.source))return fail('untrusted_route');
 if(!int(route.verifiedAtMs)||route.verifiedAtMs>nowMs||nowMs-route.verifiedAtMs>maxAgeMs)return fail('stale_route');
 if(!Array.isArray(route.originIds)||!Array.isArray(expected.originIds)||!route.originIds.every(text)||
    route.originIds.length!==new Set(route.originIds).size||
    route.originIds.length!==expected.originIds.length||route.originIds.some(x=>!expected.originIds.includes(x)))
    return fail('origin_mismatch');
 if(!plain(route.distancesKm)||Object.keys(route.distancesKm).length!==route.originIds.length||
    !route.originIds.every(id=>Object.hasOwn(route.distancesKm,id)&&typeof route.distancesKm[id]==='number'&&
     Number.isFinite(route.distancesKm[id])&&route.distancesKm[id]>=0&&route.distancesKm[id]<=100000))
    return fail('invalid_distances');
 return {ok:true,distancesKm:Object.fromEntries(route.originIds.map(id=>[id,route.distancesKm[id]]))};
}
function canonical(v){return JSON.stringify(v);}
function changeSettings({principal,oldSettings,proposed,reason,atMs,previousAuditHash=null}){
 const permission=authorize({principal,action:'delivery:settings:update'});
 if(!permission.ok)return permission;
 if(!exact(oldSettings,['version','thresholdUsd','roundToCup'])||
    !exact(proposed,['thresholdUsd','roundToCup'])||!text(oldSettings.version)||
    !int(oldSettings.roundToCup)||oldSettings.roundToCup<1||oldSettings.roundToCup>10000||
    !Number.isFinite(oldSettings.thresholdUsd)||oldSettings.thresholdUsd<=0||
    !Number.isFinite(proposed.thresholdUsd)||proposed.thresholdUsd<=0||proposed.thresholdUsd>1000000||
    Math.abs(proposed.thresholdUsd*100-Math.round(proposed.thresholdUsd*100))>1e-7||
    !int(proposed.roundToCup)||proposed.roundToCup<1||proposed.roundToCup>10000||
    !text(reason)||!int(atMs)||(previousAuditHash!==null&&!/^[a-f0-9]{64}$/.test(previousAuditHash)))
    return fail('invalid_change');
 if(oldSettings.thresholdUsd===proposed.thresholdUsd&&oldSettings.roundToCup===proposed.roundToCup)return fail('no_change');
 const next={...proposed,version:oldSettings.version+'+1'};
 const entry={actorId:principal.id,actorRole:principal.role,atMs,reason,previousVersion:oldSettings.version,
  nextVersion:next.version,old:{thresholdUsd:oldSettings.thresholdUsd,roundToCup:oldSettings.roundToCup},
  next:{thresholdUsd:next.thresholdUsd,roundToCup:next.roundToCup},previousAuditHash};
 const hash=crypto.createHash('sha256').update(canonical(entry)).digest('hex');
 return {ok:true,settings:next,auditEntry:{...entry,hash},synthetic:true,committed:false};
}
function verifyAuditEntry(entry){
 if(!plain(entry)||!exact(entry,['actorId','actorRole','atMs','reason','previousVersion','nextVersion','old','next','previousAuditHash','hash'])||
   typeof entry.hash!=='string'||!/^[a-f0-9]{64}$/.test(entry.hash))return false;
 const {hash,...body}=entry;
 const computed=crypto.createHash('sha256').update(canonical(body)).digest('hex');
 return crypto.timingSafeEqual(Buffer.from(hash,'hex'),Buffer.from(computed,'hex'));
}
module.exports={policy,authorize,verifyRouteProvenance,changeSettings,verifyAuditEntry};
