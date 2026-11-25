'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
const start='function edCheckoutDeliveryContextRead(){';
const end='function edDeliveryCheckoutPreview(lines){';
const a=scripts.indexOf(start),b=scripts.indexOf(end,a+start.length);
assert(a>=0&&b>a,'checkout context reader must exist');
const reader=scripts.slice(a,b);
function setup(remoteResult){
 const products=[{id:7,name:'Equipo',price:100}],inventory=JSON.stringify({products});
 const readKeys=[];
 const args=[];
 const ctx={
  window:{EDDeliveryStagingBridge:{isConnected:()=>true,checkoutContext(input){args.push(input);return remoteResult}}},
  state:{products},edInventoryLoaded:true,edInventoryPendingSaves:0,edInventorySnapshot:JSON.stringify(products),
  edDeliveryContextRevision:()=>4,edDeliveryIsQuarantined(){throw Error('local quarantine must not affect remote staging')},
  localStorage:{getItem(key){readKeys.push(key);if(key==='enlace_demo_v1')return inventory;throw Error('local delivery key must not be read in staging mode: '+key)}}
 };
 vm.createContext(ctx);vm.runInContext(reader,ctx);
 return {ctx,args,readKeys,products,inventory};
}
test('connected checkout reads remote staging associations and never local delivery keys',()=>{
 const x=setup({ok:true,snapshot:null});
 const snapshot={source:'supabase-staging',inventory:x.inventory,associations:'{"7":["w1"]}',origins:'[]',suppliers:'[]',destinations:'[]',revision:4,remoteRevision:'rev'};
 x.ctx.window.EDDeliveryStagingBridge.checkoutContext=()=>({ok:true,snapshot});
 const result=x.ctx.edCheckoutDeliveryContextRead();
 assert.equal(result.ok,true);
 assert.equal(result.snapshot,snapshot);
 assert.deepEqual(x.readKeys,['enlace_demo_v1','enlace_demo_v1']);
 assert.deepEqual(x.args[0],{products:x.products,inventorySnapshot:x.inventory,baseRevision:4});
});
test('invalid remote context fails closed and does not fall back to local associations',()=>{
 const x=setup({ok:false,reason:'STAGING_ASSOCIATION_LINK_MISMATCH'});
 const result=x.ctx.edCheckoutDeliveryContextRead();
 assert.equal(result.ok,false);
 assert.match(result.reason,/STAGING_ASSOCIATION_LINK_MISMATCH/);
 assert.deepEqual(x.readKeys,['enlace_demo_v1']);
});
