'use strict';
const assert=require('node:assert/strict');
const {quoteThroughVerifiedBoundary:quote}=require('./delivery-manager-integrated-boundary-isolated.cjs');
const {changeSettings,verifyAuditEntry}=require('./delivery-manager-policy-route-audit-isolated.cjs');
const nowMs=1794600000000;
const principal={id:'manager-1',role:'gestor',active:true,assignedCustomerIds:['customer-1']};
const cart={id:'cart-1',ownerId:'manager-1',province:'La Habana',subtotalUsd:150,
 lines:[{productId:'p1',type:'propio',allowedOriginIds:['origin-1'],dispatchOriginId:'origin-1'}],
 origins:[{id:'origin-1',type:'propio',active:true}]};
const customers=[{id:'customer-1',assignedManagerId:'manager-1',
 addresses:[{id:'address-1',label:'Centro Habana, referencia',active:true,lastQuoteCup:600}]}];
const settings={version:'v1',thresholdUsd:200,roundToCup:100,rateCupPerKm:200,minKm:3,minFeeCup:600};
const request={customerKind:'habitual',customerId:'customer-1',addressId:'address-1',cartId:'cart-1'};
const route={routeId:'route-1',destinationId:'saved:address-1',originIds:['origin-1'],
 distancesKm:{'origin-1':3.4},cartId:'cart-1',settingsVersion:'v1',
 verifiedAtMs:nowMs-1000,source:'server_route_provider',trustedByServer:true};
const serverContext={customers,carts:[cart],settings};
const q=(patch={})=>quote({request,principal,serverContext,routeRecord:route,nowMs,...patch});
const valid=q();
assert.equal(valid.available,true);
assert.equal(valid.customerFeeCup,700);
assert.equal(valid.previousDeliveryQuoteCup,600);
assert.equal(valid.orderCreated,false);
assert.equal(valid.promotionCoveredCup,0);
const free=q({serverContext:{...serverContext,carts:[{...cart,subtotalUsd:200}]}});
assert.equal(free.available,true);
assert.equal(free.calculatedDeliveryValueCup,700);
assert.equal(free.customerFeeCup,0);
assert.equal(free.promotionCoveredCup,700);
const alternative='Habana Vieja, referencia';
const altRequest={customerKind:'habitual',customerId:'customer-1',alternativeAddress:alternative,cartId:'cart-1'};
const altRoute={...route,destinationId:'alternative:'+alternative,distancesKm:{'origin-1':8}};
assert.equal(q({request:altRequest}).available,false);
const alt=q({request:altRequest,routeRecord:altRoute});
assert.equal(alt.available,true);
assert.equal(alt.customerFeeCup,1600);
assert.equal(alt.previousDeliveryQuoteCup,null);
const fresh='Plaza, referencia';
const freshRequest={customerKind:'nuevo',proposedAddress:fresh,cartId:'cart-1'};
const newCustomer=q({request:freshRequest,routeRecord:{...route,destinationId:'new:'+fresh}});
assert.equal(newCustomer.available,true);
assert.equal(newCustomer.previousDeliveryQuoteCup,null);
const invalid=[
 [{principal:{...principal,role:'supervisor'}},'forbidden_action'],
 [{principal:{...principal,active:false}},'invalid_principal'],
 [{principal:{...principal,assignedCustomerIds:[]}},'customer_not_assigned'],
 [{request:{...request,customerId:'customer-2'}},'customer_not_accessible'],
 [{serverContext:{...serverContext,customers:[{...customers[0],assignedManagerId:'other'}]}},'customer_not_accessible'],
 [{serverContext:{...serverContext,carts:[{...cart,ownerId:'other'}]}},'cart_not_accessible'],
 [{routeRecord:{...route,source:'browser'}},'untrusted_route'],
 [{routeRecord:{...route,trustedByServer:false}},'untrusted_route'],
 [{routeRecord:{...route,destinationId:'saved:other'}},'route_binding_mismatch'],
 [{routeRecord:{...route,settingsVersion:'v0'}},'route_binding_mismatch'],
 [{routeRecord:{...route,verifiedAtMs:nowMs-900001}},'stale_route'],
 [{routeRecord:{...route,verifiedAtMs:nowMs+1}},'stale_route'],
 [{routeRecord:{...route,distancesKm:{'origin-1':-1}}},'invalid_distances'],
 [{routeRecord:{...route,distancesKm:{'origin-1':3.4,extra:0}}},'invalid_distances'],
 [{request:{...request,rateCupPerKm:0}},'invalid_contract'],
 [{request:{...request,actorRole:'administrador_general'}},'invalid_contract'],
 [{request:{...request,addressId:'address-1',alternativeAddress:alternative}},'ambiguous_destination']
];
for(const [patch,reason] of invalid){
 const result=q(patch);
 assert.equal(result.available,false,JSON.stringify(patch));
 assert.equal(result.reason,reason,JSON.stringify(patch));
}
const admin={id:'admin-1',role:'administrador_general',active:true,assignedCustomerIds:[]};
const updated=changeSettings({principal:admin,oldSettings:{version:'v1',thresholdUsd:200,roundToCup:100},
 proposed:{thresholdUsd:250,roundToCup:200},reason:'Cambio de prueba',atMs:nowMs});
assert.equal(updated.ok,true);
assert.equal(verifyAuditEntry(updated.auditEntry),true);
assert.equal(q({serverContext:{...serverContext,settings:{...settings,version:updated.settings.version,
 thresholdUsd:updated.settings.thresholdUsd,roundToCup:updated.settings.roundToCup}}}).reason,'route_binding_mismatch');
console.log('PASS integrated boundary: permission matrix, customer ownership, verified routes, current tariff, free ledger, audit version invalidation');
