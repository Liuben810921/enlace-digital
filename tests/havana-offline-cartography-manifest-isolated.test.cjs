'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {validateOfflineManifest,validateManifestFile}=require('./havana-offline-cartography-manifest-isolated.cjs');
const file=path.join(__dirname,'fixtures/havana-offline-cartography-manifest.json');
const base=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(validateManifestFile(file).ok,true);
assert.equal(validateOfflineManifest(base).quoteReady,false);
for(const [key,value] of [['networkRequestsAllowed',true],['commercialQuoteEnabled',true],['offlineOnly',false],['status','ready'],['sourceUrl','https://example.invalid/map.pbf'],['tilesDirectory','tiles'],['sourceSha256','0'.repeat(64)],['coverageBounds',[-83,22,-82,24]],['attribution',''],['routeGeometrySource','synthetic accepted']]){
 const mutated={...base,[key]:value};assert.equal(validateOfflineManifest(mutated).ok,false,key);
}
for(const m of [
 {...base,extraEndpoint:'https://example.invalid'},
 {...base,license:'ODbL 1.0 malicious extra'},
 {...base,preflight:[...base.preflight,'another instruction']},
 {...base,preflight:base.preflight.map((x,i)=>i===0?'fetch(unsafe)':x)},
 {...base,preflight:base.preflight.map((x,i)=>i===0?'https://example.invalid':x)},
 {...base,sourceUrl:undefined},
 Object.assign(Object.create({inherited:true}),base),
])assert.equal(validateOfflineManifest(m).ok,false,'adversarial manifest must fail closed');
assert.equal(validateOfflineManifest(null).ok,false);
console.log('PASS offline cartography manifest fail-closed, license, attribution, assets, network, quote gates');
