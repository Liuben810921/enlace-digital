'use strict';
// Synthetic deterministic quote guard. No persistence, network, routes or real money authorization.
const crypto=require('node:crypto');
const {planDelivery}=require('./delivery-dispatch-isolated.cjs');
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));
 return value;
}
function fingerprint(context){return crypto.createHash('sha256').update(JSON.stringify(canonical(context))).digest('hex')}
function createQuoteContext(){
 let versions={cart:0,destination:0,route:0,warehouses:0,assignments:0,tariff:0};
 const audit=[];
 function bump(field){if(!Object.hasOwn(versions,field))throw Error('unknown_context_field');versions={...versions,[field]:versions[field]+1};audit.push({field,version:versions[field]});return versions[field]}
 function capture({cart,destination,route,warehouses,assignments,tariff}){
  if(!cart||!destination||!route||!warehouses||!assignments||!tariff)throw Error('incomplete_quote_context');
  const payload={cart,destination,route,warehouses,assignments,tariff};
  return {versions:{...versions},fingerprint:fingerprint(payload),payload:structuredClone(payload)};
 }
 function validate(quote){
  if(!quote||!quote.versions||!quote.payload||typeof quote.fingerprint!=='string')return {valid:false,reason:'invalid_quote'};
  for(const field of Object.keys(versions))if(versions[field]!==quote.versions[field])return {valid:false,reason:'stale_'+field};
  if(fingerprint(quote.payload)!==quote.fingerprint)return {valid:false,reason:'tampered_payload'};
  return {valid:true};
 }
 function quote(input){
  const snapshot=capture(input);
  const {cart,destination,route,warehouses,assignments,tariff}=snapshot.payload;
  const lines=cart.lines.map(line=>{
   const ids=assignments[line.productId];
   if(!Array.isArray(ids))return {...line,allowedOriginIds:[]};
   return {...line,allowedOriginIds:ids};
  });
  const result=planDelivery({province:destination.province,lines,origins:warehouses,roadDistancesKm:route.roadDistancesKm,...tariff});
  if(!result.available)return {available:false,reason:result.reason,snapshot};
  // This fee is only a synthetic test result. Never use it to authorize checkout.
  return {...result,snapshot,synthetic:true};
 }
 function validateQuote(quoted){return quoted?.available?validate(quoted.snapshot):{valid:false,reason:'quote_unavailable'}}
 return {bump,capture,validate,quote,validateQuote,getVersions:()=>({...versions}),getAudit:()=>structuredClone(audit)};
}
module.exports={createQuoteContext,fingerprint};
