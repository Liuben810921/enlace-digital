'use strict';
// Offline focused harness. Execute from repository root: node tests/inventory-real-other-writers-focal.test.cjs
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
function extract(start,end){const a=html.indexOf(start);assert(a>=0,'missing '+start);const b=html.indexOf(end,a);assert(b>a,'missing end '+end);return html.slice(a,b)}
const deletion=extract('async function deleteProductForever(id){','\nfunction restoreProduct(');
const migrationLine=html.split('\n').find(x=>x.startsWith('let state;try{state=JSON.parse(localStorage.getItem(\'enlace_demo_v1\'))'));
assert(migrationLine,'migration source missing');
const migration=migrationLine.slice(0,migrationLine.indexOf('const techDefaults='));
const base={products:[{id:1,name:'one'},{id:2,name:'two'}],fees:{delivery:1},categories:['old']};
async function testDeletion(){let db=JSON.parse(JSON.stringify(base)),alerts=[];
 const storage={getItem:()=>JSON.stringify(db),setItem:(_k,v)=>{db=JSON.parse(v)}};
 const fn=new Function('state','localStorage','alert',`let edInventoryLoaded=true,edAdminAuthorized=true,edInventoryQueue=Promise.resolve(),edInventorySnapshot='',cart=[];
 const confirm=()=>true,prompt=()=> 'ELIMINAR',edToken=async()=>'',edHeaders=()=>({}),edApi=async()=>{localStorage.setItem('enlace_demo_v1',JSON.stringify({...JSON.parse(localStorage.getItem()),fees:{delivery:99}}));return [{id:1}]},adminTab=()=>{},renderShop=()=>{};
 ${deletion};return deleteProductForever`)(JSON.parse(JSON.stringify(base)),storage,x=>alerts.push(x));
 await fn(1);assert.equal(db.fees.delivery,1,'Expected to reproduce loss');assert.deepEqual(db.products.map(x=>x.id),[2]);assert(alerts.some(x=>x.includes('Producto eliminado')));console.log('PASS real deletion overwrites foreign fee');
}
function testMigration(){let db=JSON.parse(JSON.stringify(base)),flags={},writes=0;
 const storage={getItem:k=>k==='enlace_demo_v1'?JSON.stringify(db):flags[k]||null,setItem:(k,v)=>{if(k==='enlace_demo_v1'){writes++;if(writes===1)db={...db,fees:{delivery:99}};db=JSON.parse(v)}else flags[k]=v}};
 new Function('localStorage','seed','initialCats',`${migration};return state`)(storage,[],['new']);
 assert.equal(db.fees.delivery,1,'Expected to reproduce loss');assert.equal(flags.enlace_catalog_reset_20261024,'done');assert.equal(writes,2);console.log('PASS real migration overwrites foreign fee');
}
(async()=>{await testDeletion();testMigration();console.log('2/2 PASS (risk reproduction, not remediation)')})().catch(e=>{console.error(e);process.exitCode=1});
