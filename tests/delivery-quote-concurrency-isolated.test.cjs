'use strict';
const assert=require('node:assert/strict');
const {createConcurrentQuoteLab}=require('./delivery-quote-concurrency-isolated.cjs');
const base=()=>({
 cart:{lines:[{productId:'laptop',type:'propio',dispatchOriginId:'own'}]},
 destination:{province:'La Habana',id:'fictional'},
 route:{roadDistancesKm:{own:4,other:999}},
 warehouses:[{id:'own',type:'propio',active:true},{id:'other',type:'propio',active:true}],
 assignments:{laptop:['own','other']},
 tariff:{rateCupPerKm:200,minKm:3,minFeeCup:600}
});
async function main(){
 const first=createConcurrentQuoteLab(base());
 const q=await first.prepare();assert.equal(q.available,true);assert.equal(q.feeCup,800);
 assert.equal((await first.confirm(q.id)).accepted,true);
 assert.equal((await first.confirm(q.id)).reason,'already_finalized');
 for(const field of ['cart','destination','route','warehouses','assignments','tariff']){
  const lab=createConcurrentQuoteLab(base()),quote=await lab.prepare();
  const updates={
   cart:x=>({...x,lines:[{...x.lines[0],dispatchOriginId:'other'}]}),
   destination:x=>({...x,id:'fictional-new'}),
   route:x=>({...x,roadDistancesKm:{...x.roadDistancesKm,own:5}}),
   warehouses:x=>x.map(w=>w.id==='own'?{...w,active:false}:w),
   assignments:x=>({...x,laptop:['other']}),
   tariff:x=>({...x,rateCupPerKm:250})
  };
  // Two operations submitted without awaiting: actual promise interleaving is ordered by mutex.
  const [changed,confirmation]=await Promise.all([lab.mutate(field,updates[field]),lab.confirm(quote.id)]);
  assert.equal(changed[field],1);
  assert.deepEqual(confirmation,{accepted:false,reason:'stale_'+field,synthetic:true});
  assert.equal((await lab.confirm(quote.id)).reason,'already_finalized');
 }
 // Confirm queued before the mutation must succeed against the preceding snapshot.
 const before=createConcurrentQuoteLab(base()),old=await before.prepare();
 const [accepted,changed]=await Promise.all([before.confirm(old.id),before.mutate('route',x=>({...x,roadDistancesKm:{own:10}}))]);
 assert.equal(accepted.accepted,true);assert.equal(changed.route,1);
 // Multiple simultaneous modifications cannot confirm an earlier snapshot.
 const multi=createConcurrentQuoteLab(base()),stale=await multi.prepare();
 const ops=['cart','destination','route','warehouses','tariff'].map(field=>multi.mutate(field,x=>structuredClone(x)));
 const confirmation=multi.confirm(stale.id);
 await Promise.all(ops);
 assert.equal((await confirmation).accepted,false);
 assert.equal(multi.getEvents().filter(e=>e.action==='mutate').length,5);
 // Missing road distances fail closed even when another warehouse has a fictitious long route.
 const missing=createConcurrentQuoteLab({...base(),route:{roadDistancesKm:{other:999}}});
 const noRoad=await missing.prepare();
 assert.equal(noRoad.available,false);assert.equal(noRoad.reason,'missing_verified_road_distance');
 assert.equal((await missing.confirm(noRoad.id)).reason,'quote_unavailable');
 assert.equal((await missing.confirm('not-a-quote')).reason,'unknown_quote');
 console.log('PASS: serialized synthetic prepare/confirm races for six dimensions, idempotence, effective origin and fail-closed routes');
}
main().catch(e=>{console.error(e);process.exitCode=1});
