'use strict';
// Pure, isolated delivery quotation prototype. No maps, live orders or network.
function quoteDelivery({province, distancesKm, rateCupPerKm=200, minKm=3, minFeeCup=600, specialFeeCup=null, freeShipping=false}) {
 if (province !== 'La Habana') return {available:false, reason:'outside_coverage'};
 if (!Array.isArray(distancesKm) || !distancesKm.length || distancesKm.some(x=>typeof x!=='number'||!Number.isFinite(x)||x<0))
  return {available:false, reason:'missing_verified_distance'};
 if (![rateCupPerKm,minKm,minFeeCup].every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0))
  return {available:false, reason:'invalid_settings'};
 if (specialFeeCup!==null && (typeof specialFeeCup!=='number'||!Number.isFinite(specialFeeCup)||specialFeeCup<0))
  return {available:false, reason:'invalid_special_fee'};
 const farthestKm=Math.max(...distancesKm);
 const billableKm=Math.max(minKm,farthestKm);
 const feeCup=freeShipping?0:specialFeeCup!==null?specialFeeCup:Math.max(minFeeCup,Math.ceil(billableKm*rateCupPerKm));
 return {available:true,farthestKm,billableKm,feeCup,mode:freeShipping?'free':specialFeeCup!==null?'special':'normal'};
}
module.exports={quoteDelivery};
