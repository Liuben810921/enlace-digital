'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function edDeliveryReassignWarehouse(sourceId){');
const end=html.indexOf('\nfunction edDeliveryUnlinkWarehouseProducts(',start);
assert.ok(start>=0&&end>start,'Exact warehouse reassignment function must exist');
const source=html.slice(start,end);
const marker='const confirmedKeys=[...selectionPanel.querySelectorAll';
assert.ok(source.includes(marker),'Reassignment must recheck selection after confirmation');
const guard=source.slice(source.indexOf(marker),source.indexOf(' const updated={...map};',source.indexOf(marker)));
function check(before,after){
 const messages=[];
 const ctx={chosenKeys:before,selectionPanel:{querySelectorAll:()=>after.map(value=>({value}))},alert:message=>messages.push(message)};
 vm.createContext(ctx);
 const result=vm.runInContext('(function(){'+guard+'return true})()',ctx);
 return {result,messages};
}
assert.equal(check(['p1'],['p2']).result,false);
assert.equal(check(['p1','p2'],['p1']).result,false);
assert.equal(check(['p1'],['p1']).result,true);
assert.equal(check(['p1','p2'],['p1','p2']).result,true);
assert.equal(check(['p1','p2'],['p2','p1']).result,false);
console.log('PASS exact reassignment selection guard: changed, removed, stable, multi-product, reordered');
