'use strict';
// Offline validation of a road-routing provider against manually measured OsmAnd routes.
// Thresholds are provisional QA criteria, not evidence of Havana routing accuracy.
function assessRoute({osmandKm,engineKm,providerStatus='ok',maxRelativeDeviation=0.10,maxAbsoluteDeviationKm=0.5}){
 if(providerStatus!=='ok')return {approved:false,reason:'provider_unavailable',feeStatus:'pending_confirmation'};
 if(![osmandKm,engineKm,maxRelativeDeviation,maxAbsoluteDeviationKm].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0)||osmandKm===0)
  return {approved:false,reason:'invalid_measurement',feeStatus:'pending_confirmation'};
 const absoluteDeviationKm=Math.abs(engineKm-osmandKm);
 const relativeDeviation=absoluteDeviationKm/osmandKm;
 const approved=absoluteDeviationKm<=maxAbsoluteDeviationKm||relativeDeviation<=maxRelativeDeviation;
 return {approved,reason:approved?'within_tolerance':'distance_discrepancy',absoluteDeviationKm,relativeDeviation,feeStatus:approved?'eligible_for_quote':'pending_confirmation'};
}
function evaluateRouteMatrix(rows,options={}){
 if(!Array.isArray(rows)||!rows.length)return {approved:false,reason:'no_reference_routes',results:[]};
 const results=rows.map(row=>({id:row.id,...assessRoute({...row,...options})}));
 const approved=results.every(x=>x.approved);
 return {approved,reason:approved?'all_within_tolerance':'manual_review_required',results,passed:results.filter(x=>x.approved).length,total:results.length};
}
function quoteWithValidation({assessment,quote}){
 if(!assessment?.approved||!quote?.available)return {available:false,reason:assessment?.reason||'route_not_validated',feeStatus:'pending_confirmation'};
 return {...quote,feeStatus:'synthetic_validated'};
}
module.exports={assessRoute,evaluateRouteMatrix,quoteWithValidation};
