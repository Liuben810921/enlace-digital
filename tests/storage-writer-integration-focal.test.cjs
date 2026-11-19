'use strict';
// Offline integration model of writer policies, not an atomic localStorage transaction.
// node tests/storage-writer-integration-focal.test.cjs
const assert=require('node:assert/strict');
const copy=x=>JSON.parse(JSON.stringify(x));
function persist(storage,patch,expected){
 let shared;try{shared=JSON.parse(storage.getItem('enlace_demo_v1'))}catch{return {ok:false,reason:'invalid-json'}}
 if(!shared||!Array.isArray(shared.products))return {ok:false,reason:'invalid-state'};
 for(const [k,v] of Object.entries(expected||{}))if(JSON.stringify(shared[k])!==JSON.stringify(v))return {ok:false,reason:'conflict:'+k};
 const raw=JSON.stringify({...shared,...patch});storage.setItem('enlace_demo_v1',raw);
 return storage.getItem('enlace_demo_v1')===raw?{ok:true}:{ok:false,reason:'verification'};
}
const base={products:[{id:1,name:'old'}],categories:['A'],categoryIcons:{},categoryImages:{},categoryVisibility:{},heroSettings:{},fees:{delivery:1}};
function store(v=base){let raw=JSON.stringify(v);return {getItem:()=>raw,setItem:(_,x)=>{raw=x},read:()=>JSON.parse(raw)}}
let passed=0;function check(name,fn){assert(fn(),name);passed++;console.log('PASS',name)}
check('categories loader preserves foreign inventory',()=>{const s=store({...base,products:[{id:2}]});return persist(s,{categories:['B']},{categories:['A']}).ok&&s.read().products[0].id===2});
check('inventory loader preserves foreign categories',()=>{const s=store({...base,categories:['B']});return persist(s,{products:[{id:3}]},{products:base.products}).ok&&s.read().categories[0]==='B'});
check('inventory queue rejects foreign products',()=>{const s=store({...base,products:[{id:4}]});return persist(s,{products:[{id:5}]},{products:base.products}).reason==='conflict:products'&&s.read().products[0].id===4});
check('queue two sequential batches',()=>{const s=store();return persist(s,{products:[{id:2}]},{products:base.products}).ok&&persist(s,{products:[{id:3}]},{products:[{id:2}]}).ok&&s.read().products[0].id===3});
check('deletion preserves foreign fees',()=>{const s=store({...base,fees:{delivery:99}});return persist(s,{products:[]},{products:base.products}).ok&&s.read().fees.delivery===99});
check('migration categories preserves products',()=>{const s=store({...base,products:[{id:9}]});return persist(s,{categories:['A','B']},{categories:['A']}).ok&&s.read().products[0].id===9});
check('migration reset rejects external inventory',()=>{const s=store({...base,products:[{id:9}]});return persist(s,{products:[]},{products:base.products}).reason==='conflict:products'});
check('general save must reject stale products',()=>{const s=store({...base,products:[{id:9}]});return persist(s,{products:[{id:2}]},{products:base.products}).reason==='conflict:products'});
check('banner preserves inventory',()=>{const s=store({...base,products:[{id:9}]});return persist(s,{heroSettings:{title:'new'}},{heroSettings:{}}).ok&&s.read().products[0].id===9});
check('malformed shared JSON fails closed',()=>{const s=store();s.setItem('enlace_demo_v1','{bad');return persist(s,{products:[]},{}).reason==='invalid-json'&&s.getItem()==='{bad'});
check('uncooperative interleaving remains unsafe',()=>{let raw=JSON.stringify(base);const s={getItem:()=>raw,setItem:(_,next)=>{raw=JSON.stringify({...base,fees:{delivery:99}});raw=next}};return persist(s,{categories:['B']},{categories:['A']}).ok&&JSON.parse(raw).fees.delivery===1});
console.log(passed+'/'+passed+' PASS');
