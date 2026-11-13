'use strict';
const assert=require('node:assert/strict');
const {quoteManagerServerContract:quote}=require('./delivery-manager-server-contract-isolated.cjs');
const nowMs=1794600000000;
const principal={userId:'m1',role:'gestor',active:true,allowedCustomerIds:['c1']};
const address={id:'a1',label:'Centro Habana, referencia',active:true,lastQuoteCup:600};
const customer={id:'c1',assignedManagerId:'m1',addresses:[address]};
const cart={id:'cart',ownerId:'m1',province:'La Habana',subtotalUsd:150,lines:[{productId:'p',type:'propio',allowedOriginIds:['o1'],dispatchOriginId:'o1'}],origins:[{id:'o1',type:'propio',active:true}]};
const settings={thresholdUsd:200,roundToCup:100,rateCupPerKm:200,minKm:3,minFeeCup:600,version:'v1'};
const route={destinationId:'saved:a1',cartId:'cart',settingsVersion:'v1',verified:true,verifiedAtMs:nowMs-1000,roadDistancesKm:{o1:3.4}};
const context={principal,customers:[customer],carts:[cart],routes:[route],settings,nowMs};
const request={customerKind:'habitual',customerId:'c1',addressId:'a1',cartId:'cart'};
const q=(req=request,ctx=context)=>quote({request:req,context:ctx});
assert.equal(q().available,true);
const attacks=[
 [{...request,role:'administrador_general'},context,'invalid_contract'],
 [{...request,customerId:'c2'},context,'customer_not_accessible'],
 [{...request,addressId:'a2'},context,'address_not_accessible'],
 [{...request,rateCupPerKm:0},context,'invalid_contract'],
 [{...request,thresholdUsd:0},context,'invalid_contract'],
 [{...request,verified:true},context,'invalid_contract'],
 [{...request,verifiedAtMs:nowMs},context,'invalid_contract'],
 [{...request,roadDistancesKm:{o1:0}},context,'invalid_contract'],
 [request,{...context,principal:{...principal,role:'cliente'}},'forbidden_principal'],
 [request,{...context,principal:{...principal,active:false}},'forbidden_principal'],
 [request,{...context,principal:{...principal,allowedCustomerIds:[]}},'customer_not_accessible'],
 [request,{...context,customers:[{...customer,assignedManagerId:'m2'}]},'customer_not_accessible'],
 [request,{...context,carts:[{...cart,ownerId:'m2'}]},'cart_not_accessible'],
 [request,{...context,routes:[{...route,destinationId:'saved:a2'}]},'missing_fresh_verified_route'],
 [request,{...context,routes:[{...route,cartId:'other'}]},'missing_fresh_verified_route'],
 [request,{...context,routes:[{...route,settingsVersion:'v0'}]},'missing_fresh_verified_route'],
 [request,{...context,routes:[{...route,verifiedAtMs:nowMs+1}]},'missing_fresh_verified_route'],
 [request,{...context,routes:[{...route,verifiedAtMs:nowMs-900001}]},'missing_fresh_verified_route'],
 [request,{...context,routes:[{...route,verified:false}]},'missing_fresh_verified_route'],
 [request,{...context,routes:[{...route,roadDistancesKm:{o1:-1}}]},'invalid_route'],
 [request,{...context,routes:[{...route,roadDistancesKm:{o1:Infinity}}]},'invalid_route'],
 [request,{...context,routes:[{...route,roadDistancesKm:{o1:'3.4'}}]},'invalid_route'],
 [request,{...context,routes:[{...route,roadDistancesKm:{o1:3.4,other:0}}]},'invalid_route'],
 [request,{...context,routes:[{...route,roadDistancesKm:{}}]},'invalid_route'],
 [request,{...context,settings:{...settings,roundToCup:0}},'invalid_settings'],
 [request,{...context,settings:{...settings,roundToCup:100.5}},'invalid_settings'],
 [request,{...context,settings:{...settings,rateCupPerKm:-1}},'invalid_settings'],
 [request,{...context,settings:{...settings,thresholdUsd:NaN}},'invalid_settings'],
 [request,{...context,settings:{...settings,minFeeCup:Infinity}},'invalid_settings'],
 [request,{...context,settings:{...settings,version:'v2'}},'missing_fresh_verified_route'],
 [request,{...context,principal:{...principal,role:'administrador_general',active:false}},'forbidden_principal'],
 [{...request,addressId:'__proto__'},context,'missing_saved_address_id']
];
for(const [req,ctx,reason] of attacks){
 const result=q(req,ctx);
 assert.equal(result.available,false,JSON.stringify(req));
 assert.equal(result.reason,reason,JSON.stringify(req));
}
const alt='Habana Vieja, referencia';
const altReq={customerKind:'habitual',customerId:'c1',alternativeAddress:alt,cartId:'cart'};
assert.equal(q(altReq).reason,'missing_fresh_verified_route');
const altCtx={...context,routes:[{...route,destinationId:'alternative:'+alt}]};
assert.equal(q(altReq,altCtx).available,true);
assert.equal(q({...altReq,addressId:'a1'},altCtx).reason,'ambiguous_destination');
const free=q(request,{...context,carts:[{...cart,subtotalUsd:200}]});
assert.equal(free.customerFeeCup,0);
assert.equal(free.calculatedDeliveryValueCup,700);
assert.equal(free.promotionCoveredCup,700);
console.log('PASS 32+ adversarial contract cases: role spoofing, tenant isolation, route binding/freshness, pricing overrides, ledger');
