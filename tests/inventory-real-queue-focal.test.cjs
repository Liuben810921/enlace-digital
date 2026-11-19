'use strict';
// Run offline from repository root: node tests/inventory-real-queue-focal.test.cjs
// Extracts the real edQueueInventory function from index.html; all APIs are mocked.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const begin=html.indexOf('function edQueueInventory(){'),end=html.indexOf('\nconst seed=[];',begin);
assert(begin>=0&&end>begin,'Cannot locate actual queue function');
const source=html.slice(begin,end);
const build=new Function('state','localStorage','statuses','alerts','calls','interfere',`
let edInventoryLoaded=true,edAdminAuthorized=true,edInventoryPendingSaves=0,edInventoryQueue=Promise.resolve(),
edInventorySnapshot=JSON.stringify([{id:1,name:'old',photos:[],colors:[]}]),edInventoryLastQueueWrite=null,edInventoryQueueWriteVersion=0;
const edStatus=(...x)=>statuses.push(x),alert=x=>alerts.push(x),edToken=async()=>'',edToRow=p=>({id:p.id,name:p.name}),edUploadPhoto=async x=>x,edHeaders=()=>({});
const edApi=async(...args)=>{calls.push(args);if(interfere)interfere(localStorage);return []};
${source}
return {enqueue:edQueueInventory,wait:()=>edInventoryQueue,pending:()=>edInventoryPendingSaves,snapshot:()=>edInventorySnapshot};
`);
const original={products:[{id:1,name:'old',photos:[],colors:[]}],fees:{delivery:1},categories:['A']};
function setup(interfere){let value=JSON.stringify(original),statuses=[],alerts=[],calls=[];const storage={getItem:()=>value,setItem:(_k,v)=>value=v};const state={...original,products:[{id:1,name:'first',photos:[],colors:[]}]};const queue=build(state,storage,statuses,alerts,calls,interfere);return {queue,state,storage,statuses,alerts,calls,read:()=>JSON.parse(value)}}
const tests=[];
async function test(name,fn){await fn();tests.push(name);console.log('PASS',name)}
(async()=>{
await test('real queue normal save',async()=>{const t=setup();t.queue.enqueue();assert.equal(await t.queue.wait(),true);assert.equal(t.read().products[0].name,'first');assert.equal(t.queue.pending(),0)});
await test('real queue detects external fee edit after mocked remote operation',async()=>{const t=setup(s=>s.setItem('enlace_demo_v1',JSON.stringify({...JSON.parse(s.getItem()),fees:{delivery:99}})));t.queue.enqueue();assert.equal(await t.queue.wait(),false);assert.equal(t.read().fees.delivery,99);assert.equal(t.read().products[0].name,'old');assert(t.calls.length>0)});
await test('real queue detects external inventory edit',async()=>{const t=setup(s=>s.setItem('enlace_demo_v1',JSON.stringify({...JSON.parse(s.getItem()),products:[{id:1,name:'foreign'}]})));t.queue.enqueue();assert.equal(await t.queue.wait(),false);assert.equal(t.read().products[0].name,'foreign')});
await test('real queue preserves two sequential targets',async()=>{const t=setup();t.queue.enqueue();t.state.products=[{id:1,name:'second',photos:[],colors:[]}];t.queue.enqueue();assert.equal(await t.queue.wait(),true);assert.equal(t.read().products[0].name,'second');assert.equal(t.calls.length,2);assert.equal(t.queue.pending(),0)});
console.log(`${tests.length}/${tests.length} PASS`);
})().catch(e=>{console.error(e);process.exitCode=1});
