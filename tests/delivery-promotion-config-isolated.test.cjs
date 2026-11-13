'use strict';
const assert=require('node:assert/strict');
const {validateShippingPromotionConfig,quoteWithPromotionConfig}=require('./delivery-promotion-config-isolated.cjs');
const {quoteMixedDelivery}=require('./delivery-mixed-fees-isolated.cjs');
const origins=[
 {id:'own',type:'propio',active:true},
 {id:'supplier',type:'proveedor',supplierId:'s1',active:true},
 {id:'unused',type:'propio',active:true}
];
const own=(extra={})=>({productId:'laptop',type:'propio',allowedOriginIds:['own','unused'],dispatchOriginId:'own',...extra});
const supplier=(extra={})=>({productId:'speaker',type:'proveedor',supplierId:'s1',allowedOriginIds:['supplier'],dispatchOriginId:'supplier',...extra});
const base={province:'La Habana',lines:[own(),supplier()],origins,roadDistancesKm:{own:2,supplier:8,unused:100}};
const quote=extra=>quoteMixedDelivery({...base,...extra});
assert.equal(quote({}).feeCup,1600);
assert.equal(quote({lines:[own({freeShipping:true}),supplier()]}).feeCup,0);
assert.equal(quote({lines:[own(),supplier({freeShipping:true})]}).feeCup,0);
assert.equal(quote({lines:[own({specialFeeCup:3200}),supplier({freeShipping:true})]}).feeCup,0);
assert.equal(quote({lines:[own({freeShipping:true,specialFeeCup:9999}),supplier({specialFeeCup:2500})]}).feeCup,0);
assert.equal(quote({lines:[own({specialFeeCup:3200}),supplier({specialFeeCup:2500})]}).feeCup,3200);
assert.equal(quote({orderFreeShipping:true,lines:[own({specialFeeCup:3200}),supplier()]}).feeCup,0);
assert.equal(quote({orderSubtotalUsd:250,freeShippingThresholdUsd:250}).feeCup,0);
assert.equal(quote({orderSubtotalUsd:249.99,freeShippingThresholdUsd:250}).feeCup,1600);
assert.equal(quote({orderSubtotalUsd:0,freeShippingThresholdUsd:250}).feeCup,1600);
assert.equal(quote({orderSubtotalUsd:250,freeShippingThresholdUsd:null}).feeCup,1600);
assert.equal(quote({orderSubtotalUsd:250,freeShippingThresholdUsd:250,lines:[own({freeShipping:true}),supplier()]}).freeReason,'product_promotion');
assert.equal(quote({orderSubtotalUsd:250,freeShippingThresholdUsd:250,orderFreeShipping:true}).freeReason,'order_promotion');
assert.equal(quote({roadDistancesKm:{own:2},lines:[own({freeShipping:true}),supplier()]}).reason,'missing_verified_road_distance');
assert.equal(quote({roadDistancesKm:{own:2},orderSubtotalUsd:500,freeShippingThresholdUsd:250}).reason,'missing_verified_road_distance');
assert.equal(quote({lines:[own({freeShipping:true}),supplier({dispatchOriginId:'wrong'})]}).reason,'dispatch_selection_required');
assert.equal(quote({province:'Matanzas',lines:[own({freeShipping:true}),supplier()]}).reason,'outside_coverage');
for(const config of [null,{},[],{enabled:'true',thresholdUsd:250},{enabled:true,thresholdUsd:0},{enabled:true,thresholdUsd:-1},{enabled:true,thresholdUsd:'250'},{enabled:true,thresholdUsd:Infinity},{enabled:true,thresholdUsd:1.001},{enabled:false,thresholdUsd:250},{enabled:true,thresholdUsd:250,secret:'x'}]){
 assert.equal(validateShippingPromotionConfig(config).ok,false,JSON.stringify(config));
}
assert.equal(validateShippingPromotionConfig({enabled:true,thresholdUsd:0.29}).ok,true);
assert.equal(validateShippingPromotionConfig({enabled:true,thresholdUsd:250}).ok,true);
assert.equal(validateShippingPromotionConfig({enabled:false,thresholdUsd:null}).ok,true);
assert.equal(quoteWithPromotionConfig({...base,config:{enabled:true,thresholdUsd:250},orderSubtotalUsd:250}).feeCup,0);
assert.equal(quoteWithPromotionConfig({...base,config:{enabled:false,thresholdUsd:null},orderSubtotalUsd:250}).feeCup,1600);
assert.equal(quoteWithPromotionConfig({...base,config:{enabled:true,thresholdUsd:250}}).reason,'missing_order_subtotal');
assert.equal(quoteWithPromotionConfig({...base,config:{enabled:true,thresholdUsd:'250'},orderSubtotalUsd:300}).reason,'invalid_threshold');
console.log('PASS promotion policy matrix: mixed suppliers, precedence, threshold boundaries, strict config, fail-closed routing');
