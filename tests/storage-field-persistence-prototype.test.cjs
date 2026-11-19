'use strict';
// Focused offline prototype; run: node tests/storage-field-persistence-prototype.test.cjs
const assert=require('node:assert/strict');
function persist(storage,patch,expected){
 const raw=storage.getItem('enlace_demo_v1');let shared;
 try{shared=JSON.parse(raw)}catch{return {ok:false,reason:'invalid-json'}}
 if(!shared||typeof shared!=='object'||!Array.isArray(shared.products))return {ok:false,reason:'invalid-state'};
 for(const [key,val] of Object.entries(expected))if(JSON.stringify(shared[key])!==JSON.stringify(val))return {ok:false,reason:'conflict:'+key};
 const next=JSON.stringify({...shared,...patch});storage.setItem('enlace_demo_v1',next);
 return storage.getItem('enlace_demo_v1')===next?{ok:true}:{ok:false,reason:'post-write-mismatch'};
}
const base={products:[{id:1}],categories:['old'],fees:{delivery:1}};
function make(){let raw=JSON.stringify(base);return {getItem:()=>raw,setItem:(_,v)=>raw=v}}
let count=0;function test(name,fn){assert(fn(),name);count++;console.log('PASS',name)}
test('categories preserve external products',()=>{let s=make();s.setItem('',JSON.stringify({...base,products:[{id:9}]}));return persist(s,{categories:['new']},{categories:['old']}).ok&&JSON.parse(s.getItem()).products[0].id===9});
test('inventory preserves external categories',()=>{let s=make();s.setItem('',JSON.stringify({...base,categories:['foreign']}));return persist(s,{products:[{id:2}]},{products:base.products}).ok&&JSON.parse(s.getItem()).categories[0]==='foreign'});
test('inventory conflict rejected',()=>{let s=make();s.setItem('',JSON.stringify({...base,products:[{id:9}]}));return persist(s,{products:[{id:2}]},{products:base.products}).reason==='conflict:products'&&JSON.parse(s.getItem()).products[0].id===9});
test('deletion preserves fees',()=>{let s=make();s.setItem('',JSON.stringify({...base,fees:{delivery:99}}));return persist(s,{products:[]},{products:base.products}).ok&&JSON.parse(s.getItem()).fees.delivery===99});
test('two sequential queue baselines',()=>{let s=make();return persist(s,{products:[{id:2}]},{products:base.products}).ok&&persist(s,{products:[{id:3}]},{products:[{id:2}]}).ok&&JSON.parse(s.getItem()).products[0].id===3});
test('invalid JSON fails closed',()=>{let s=make();s.setItem('','{broken');return persist(s,{products:[]},{}).reason==='invalid-json'&&s.getItem()==='{broken'});
test('uncooperative writer still loses data after last read',()=>{let raw=JSON.stringify(base),s={getItem:()=>raw,setItem:(_,v)=>{raw=JSON.stringify({...base,fees:{delivery:99}});raw=v}};return persist(s,{categories:['new']},{categories:['old']}).ok&&JSON.parse(raw).fees.delivery===1});
console.log(count+'/'+count+' PASS');
module.exports={persist};
