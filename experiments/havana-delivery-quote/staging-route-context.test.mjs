import test from "node:test";
import assert from "node:assert/strict";
import {resolveStagingRouteContext} from "./staging-route-context.mjs";

const warehouse=(id,patch={})=>({kind:"warehouse",id,revision:1,payload:{type:"propio",active:true,lat:23.12,lng:-82.4,...patch}});
const destination={kind:"destination",id:"dest_1",revision:2,payload:{name:"Casa",lat:23.13,lng:-82.37}};
const association=(id,warehouseIds)=>({kind:"product_origin",id,revision:1,payload:{productId:id,warehouseIds}});
const link=(source_kind,source_id,target_kind,target_id)=>({source_kind,source_id,target_kind,target_id});
const snapshot={
 entities:[destination,warehouse("w1"),warehouse("w2"),association("p1",["w1","w2"]),association("p2",["w1"])],
 links:[link("product_origin","p1","warehouse","w1"),link("product_origin","p1","warehouse","w2"),link("product_origin","p2","warehouse","w1")]
};
const resolve=(overrides={})=>resolveStagingRouteContext({productIds:["p1","p2"],destinationId:"dest_1",snapshot,...overrides});

test("resolves server snapshot to deduplicated warehouse legs without a tariff",()=>{
 const result=resolve();
 assert.equal(result.status,"CONTEXTO_LISTO");
 assert.deepEqual(result.legs,[
  {originId:"w1",lat:23.12,lon:-82.4,productIds:["p1","p2"]},
  {originId:"w2",lat:23.12,lon:-82.4,productIds:["p1"]}
 ]);
 assert.equal("feeCup" in result,false);
});
test("rejects client supplied coordinates or identity claims",()=>{
 assert.equal(resolve({origin:{lat:23.1,lon:-82.3}}).reason,"UNEXPECTED_CONTEXT_FIELDS");
 assert.equal(resolve({customerId:"forged"}).reason,"UNEXPECTED_CONTEXT_FIELDS");
});
test("requires associations and relational links to match exactly",()=>{
 assert.equal(resolve({snapshot:{...snapshot,links:snapshot.links.slice(1)}}).reason,"PRODUCT_ORIGIN_LINK_MISMATCH");
 assert.equal(resolve({snapshot:{...snapshot,entities:[...snapshot.entities,association("p3",["w1"])]},productIds:["p3"]}).status,"PENDIENTE");
});
test("rejects inactive, missing, or out of coverage origins",()=>{
 const inactive={...snapshot,entities:snapshot.entities.map(x=>x.kind==="warehouse"&&x.id==="w1"?warehouse("w1",{active:false}):x)};
 assert.equal(resolve({productIds:["p2"],snapshot:inactive}).reason,"WAREHOUSE_NOT_ACTIVE");
 const outside={...snapshot,entities:snapshot.entities.map(x=>x.kind==="warehouse"&&x.id==="w1"?warehouse("w1",{lat:24}):x)};
 assert.equal(resolve({productIds:["p2"],snapshot:outside}).reason,"WAREHOUSE_COORDINATES_INVALID");
});
test("requires provider warehouses and destinations to be active and linked",()=>{
 const providerWarehouse=warehouse("w1",{type:"proveedor",supplierId:"s1"});
 const providerSnap={...snapshot,entities:[...snapshot.entities.filter(x=>!(x.kind==="warehouse"&&x.id==="w1")),providerWarehouse,{kind:"supplier",id:"s1",revision:1,payload:{active:true,name:"Proveedor"}}],links:[...snapshot.links,link("warehouse","w1","supplier","s1")]};
 assert.equal(resolve({productIds:["p2"],snapshot:providerSnap}).status,"CONTEXTO_LISTO");
 const noSupplier={...providerSnap,entities:providerSnap.entities.map(x=>x.kind==="supplier"?{...x,payload:{...x.payload,active:false}}:x)};
 assert.equal(resolve({productIds:["p2"],snapshot:noSupplier}).reason,"SUPPLIER_NOT_ACTIVE_OR_LINKED");
 const inactiveDestination={...snapshot,entities:snapshot.entities.map(x=>x.kind==="destination"?{...x,payload:{...x.payload,active:false}}:x)};
 assert.equal(resolve({snapshot:inactiveDestination}).reason,"DESTINATION_NOT_ROUTABLE");
});
test("rejects duplicate or malformed snapshots",()=>{
 assert.equal(resolve({snapshot:{...snapshot,entities:[...snapshot.entities,snapshot.entities[0]]}}).reason,"DUPLICATE_STAGING_ENTITY");
 assert.equal(resolve({snapshot:{...snapshot,links:[...snapshot.links,link("product_origin","p1","warehouse","w1")]}}).reason,"DUPLICATE_STAGING_LINK");
 assert.equal(resolve({snapshot:{entities:[destination],links:[]}}).reason,"PRODUCT_ORIGINS_INVALID");
});
