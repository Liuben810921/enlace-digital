'use strict';
const assert=require('node:assert/strict');
const {quote}=require('./fixtures/delivery-quote-shared-core.js');
const {quoteDeliveryAccounting}=require('./delivery-accounting-manager-isolated.cjs');
const origin=[{id:'a',type:'propio',active:true}];
const line=[{productId:'a',type:'propio',allowedOriginIds:['a'],dispatchOriginId:'a'}];
for(const distanceKm of [0,2.9,3,3.01,3.4,8,22.25]){
 for(const specialFeeCup of [0,700,1250,2400]){
  for(const subtotalUsd of [0,199.99,200,500]){
   for(const productFree of [false,true]){
    const common={distanceKm,specialFeeCup,subtotalUsd,productFree};
    const browser=quote(common);
    const node=quoteDeliveryAccounting({province:'La Habana',lines:[{...line[0],freeShipping:productFree,specialFeeCup}],origins:origin,roadDistancesKm:{a:distanceKm},orderSubtotalUsd:subtotalUsd,freeShippingThresholdUsd:200,roundToCup:100});
    assert.equal(browser.available,true);
    assert.equal(node.available,true);
    assert.equal(browser.customerFeeCup,node.customerFeeCup,JSON.stringify(common));
    assert.equal(browser.calculatedDeliveryValueCup,node.calculatedDeliveryValueCup,JSON.stringify(common));
    assert.equal(browser.promotionCoveredCup,node.promotionCoveredCup,JSON.stringify(common));
   }
  }
 }
}
for(const distanceKm of [-1,NaN,Infinity])assert.equal(quote({distanceKm,subtotalUsd:200}).available,false);
assert.equal(quote({distanceKm:3,subtotalUsd:200,roundToCup:0}).available,false);
console.log('PASS shared mobile/Node quote parity: 448 synthetic scenarios, accounting, promotions, rounding');
