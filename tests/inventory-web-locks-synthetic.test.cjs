// Synthetic, dependency-free inventory lock/interleaving tests. Run: node tests/inventory-web-locks-synthetic.test.cjs
'use strict';
const assert=require('node:assert/strict');
const tests=[];
function test(name,fn){tests.push([name,fn]);}
function store(initial){let value=JSON.stringify(initial);return {getItem(){return value},setItem(_key,next){value=next},value(){return JSON.parse(value)}}}
function mutex(){let tail=Promise.resolve();return {request(_name,callback){const task=tail.then(callback);tail=task.catch(()=>{});return task}}}
async function persist(storage,local,target,expected,{locks,interleave}={}){
 const operation=async()=>{
  if(storage.getItem('enlace_demo_v1')!==expected)return 'conflict';
  if(interleave)await interleave();
  const serialized=JSON.stringify({...local,products:target});
  storage.setItem('enlace_demo_v1',serialized);
  return storage.getItem('enlace_demo_v1')===serialized?'ok':'post-conflict';
 };
 return locks?locks.request('enlace-demo-inventory',operation):operation();
}
const old={products:[{id:1,name:'old'}],fees:{delivery:1},categories:['Laptops']};
test('cooperating Web Locks clients serialize and detect stale inventory',async()=>{
 const s=store(old),locks=mutex(),baseline=s.getItem('enlace_demo_v1');
 const a=persist(s,old,[{id:1,name:'first'}],baseline,{locks});
 const b=persist(s,old,[{id:1,name:'second'}],baseline,{locks});
 assert.deepEqual(await Promise.all([a,b]),['ok','conflict']);
 assert.equal(s.value().products[0].name,'first');
});
test('uncooperative writer bypasses Web Lock and overwrites between read/write',async()=>{
 const s=store(old),locks=mutex(),baseline=s.getItem('enlace_demo_v1');
 const result=await persist(s,old,[{id:1,name:'first'}],baseline,{locks,interleave:async()=>s.setItem('enlace_demo_v1',JSON.stringify({...old,products:[{id:1,name:'foreign'}]}))});
 assert.equal(result,'ok');assert.equal(s.value().products[0].name,'first');
});
test('unsupported Web Locks fallback detects pre-existing conflicting change',async()=>{
 const s=store(old),baseline=s.getItem('enlace_demo_v1');
 s.setItem('enlace_demo_v1',JSON.stringify({...old,fees:{delivery:99}}));
 assert.equal(await persist(s,old,[{id:1,name:'first'}],baseline),'conflict');
 assert.equal(s.value().fees.delivery,99);
});
test('unsupported Web Locks fallback cannot close compare/write window',async()=>{
 const s=store(old),baseline=s.getItem('enlace_demo_v1');
 const result=await persist(s,old,[{id:1,name:'first'}],baseline,{interleave:async()=>s.setItem('enlace_demo_v1',JSON.stringify({...old,fees:{delivery:99}}))});
 assert.equal(result,'ok');assert.equal(s.value().fees.delivery,1);
});
test('current noninventory state is retained when constructing batch payload',async()=>{
 const s=store(old),local={...old,fees:{delivery:77},categories:['Celulares']};
 assert.equal(await persist(s,local,[{id:1,name:'first'}],s.getItem('enlace_demo_v1')),'ok');
 assert.equal(s.value().fees.delivery,77);assert.deepEqual(s.value().categories,['Celulares']);
});
test('conflict recovery preserves foreign state and requires reconciliation',async()=>{
 const s=store(old),baseline=s.getItem('enlace_demo_v1');
 s.setItem('enlace_demo_v1',JSON.stringify({...old,products:[{id:1,name:'foreign'}],fees:{delivery:88}}));
 assert.equal(await persist(s,old,[{id:1,name:'first'}],baseline),'conflict');
 assert.equal(s.value().products[0].name,'foreign');assert.equal(s.value().fees.delivery,88);
});
(async()=>{let failed=0;for(const [name,fn] of tests){try{await fn();console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e)}}console.log(`${tests.length-failed}/${tests.length} passed`);if(failed)process.exitCode=1})().catch(e=>{console.error(e);process.exitCode=1});
