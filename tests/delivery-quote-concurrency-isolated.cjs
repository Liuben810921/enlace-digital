'use strict';
// Disposable concurrency simulation: serializable state changes via a promise mutex.
// No network, database, real checkout, payment, or real road routing.
const {createQuoteContext}=require('./delivery-quote-context-isolated.cjs');
function createConcurrentQuoteLab(initialInput){
 const context=createQuoteContext();
 let input=structuredClone(initialInput),tail=Promise.resolve(),nextId=0;
 const records=new Map(),events=[];
 function serial(operation){
  const result=tail.then(operation);
  tail=result.then(()=>undefined,()=>undefined);
  return result;
 }
 function mutate(field,updater){
  return serial(()=>{
   if(!['cart','destination','route','warehouses','assignments','tariff'].includes(field))throw Error('unknown_context_field');
   const current=structuredClone(input[field]);
   const next=updater(current);
   if(next===undefined||next===null)throw Error('invalid_mutation');
   input[field]=structuredClone(next);
   context.bump(field);
   events.push({action:'mutate',field,versions:context.getVersions()});
   return context.getVersions();
  });
 }
 function prepare(){
  return serial(()=>{
   const result=context.quote(input),id='synthetic-'+(++nextId);
   records.set(id,{result,state:'prepared'});
   events.push({action:'prepare',id,available:result.available});
   return {id,available:result.available,reason:result.reason||null,feeCup:result.available?result.feeCup:null};
  });
 }
 function confirm(id){
  return serial(()=>{
   const record=records.get(id);
   if(!record)return {accepted:false,reason:'unknown_quote'};
   if(record.state!=='prepared')return {accepted:false,reason:'already_finalized'};
   const check=context.validateQuote(record.result);
   record.state=check.valid?'confirmed':'rejected';
   events.push({action:'confirm',id,accepted:check.valid,reason:check.reason||null});
   return {accepted:check.valid,reason:check.reason||null,synthetic:true};
  });
 }
 function getEvents(){return structuredClone(events)}
 return {mutate,prepare,confirm,getEvents};
}
module.exports={createConcurrentQuoteLab};
