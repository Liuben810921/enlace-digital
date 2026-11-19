'use strict';
// Focused offline model: run node tests/inventory-merge-fields-synthetic.test.cjs
const assert=require('node:assert/strict');
const base={products:[{id:1,name:'old'}],fees:{delivery:1},categories:['A'],account:{locale:'es'}};
const clone=x=>JSON.parse(JSON.stringify(x));
function save(read,write,expectedProducts,target,hook){
 const before=read();
 if(JSON.stringify(before.products)!==JSON.stringify(expectedProducts))return 'conflict';
 if(hook)hook();
 const latest=read();
 if(JSON.stringify(latest.products)!==JSON.stringify(expectedProducts))return 'conflict';
 write({...latest,products:clone(target)});
 return 'saved';
}
const tests=[];
function test(name,fn){fn();tests.push(name);console.log('PASS',name)}
test('preserve foreign fees and categories',()=>{let db=clone(base);db.fees.delivery=88;db.categories=['B'];assert.equal(save(()=>clone(db),v=>db=v,base.products,[{id:1,name:'new'}]),'saved');assert.equal(db.fees.delivery,88);assert.deepEqual(db.categories,['B'])});
test('preserve account',()=>{let db=clone(base);db.account.locale='en';assert.equal(save(()=>clone(db),v=>db=v,base.products,[{id:1,name:'new'}]),'saved');assert.equal(db.account.locale,'en')});
test('reject changed products',()=>{let db=clone(base);db.products[0].name='foreign';assert.equal(save(()=>clone(db),v=>db=v,base.products,[{id:1,name:'new'}]),'conflict');assert.equal(db.products[0].name,'foreign')});
test('reject interleaved products before final read',()=>{let db=clone(base);assert.equal(save(()=>clone(db),v=>db=v,base.products,[{id:1,name:'new'}],()=>{db.products[0].name='foreign'}),'conflict');assert.equal(db.products[0].name,'foreign')});
test('merge interleaved fees before final read',()=>{let db=clone(base);assert.equal(save(()=>clone(db),v=>db=v,base.products,[{id:1,name:'new'}],()=>{db.fees.delivery=99}),'saved');assert.equal(db.fees.delivery,99)});
test('demonstrate lost foreign write after final read',()=>{let db=clone(base),reads=0;const read=()=>{reads++;const value=clone(db);if(reads===2)db.fees.delivery=99;return value};assert.equal(save(read,v=>db=v,base.products,[{id:1,name:'new'}]),'saved');assert.equal(db.fees.delivery,1)});
test('malformed JSON fails closed in defensive parser',()=>{const parse=s=>{try{const x=JSON.parse(s);return x&&Array.isArray(x.products)?x:null}catch{return null}};assert.equal(parse('{bad'),null);assert.equal(parse('{"products":{}}'),null)});
console.log(`${tests.length}/${tests.length} PASS`);
