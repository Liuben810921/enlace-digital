#!/usr/bin/env node
// Offline reference test only: no import by Edge or frontend production.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const data=JSON.parse(fs.readFileSync('tests/fixtures/norm_v1_utf8_vectors.json','utf8'));
const ws=new Set(data.unicode_whitespace_hex.map(x=>parseInt(x,16)));
function normalize(input) {
  if(typeof input!=='string')throw new TypeError('string required');
  for(let i=0;i<input.length;i++){
    const u=input.charCodeAt(i);
    if(u>=0xD800&&u<=0xDBFF){
      const next=input.charCodeAt(i+1);
      if(!(next>=0xDC00&&next<=0xDFFF))throw new Error('surrogate');
      i++;continue;
    }
    if(u>=0xDC00&&u<=0xDFFF)throw new Error('surrogate');
  }
  for(const c of input){
    const u=c.codePointAt(0);
    if(u===0x200B||u===0xFEFF||(u<32&&!ws.has(u))||(u>=0x7F&&u<=0x9F&&!ws.has(u)))throw new Error('control');
  }
  const n=input.normalize('NFC');
  let out='',pending=false;
  for(const c of n){
    if(ws.has(c.codePointAt(0)))pending=out.length>0;
    else {if(pending)out+=' ';out+=c;pending=false;}
  }
  return out;
}
for(const v of data.cases){
  if(v.reject){assert.throws(()=>normalize(v.input),undefined,v.id);continue;}
  assert.equal(Buffer.from(normalize(v.input),'utf8').toString('hex'),v.output_hex,v.id);
}
assert.notEqual(normalize('Calle'),normalize('calle'));
assert.notEqual(normalize('Apto 01'),normalize('Apto 1'));
assert.equal(normalize('A\u0301'),normalize('Á'));
console.log('PASS: JS NORM-v1 '+data.cases.length+' UTF-8 fixtures; Unicode '+process.versions.unicode);
