'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {validateOfflineManifest,validateManifestRaw,validateManifestFile,MAX_MANIFEST_BYTES}=require('./havana-offline-cartography-manifest-isolated.cjs');
const file=path.join(__dirname,'fixtures/havana-offline-cartography-manifest.json');
const base=JSON.parse(fs.readFileSync(file,'utf8'));
assert.equal(validateManifestFile(file).ok,true);
assert.equal(validateManifestRaw(fs.readFileSync(file,'utf8')).ok,true);
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
 {...base,preflight:[...base.preflight].reverse()},
 {...base,preflight:base.preflight.map((x,i)=>i===0?'Replace with a different approved-looking sentence':x)},
 Object.assign(Object.create({inherited:true}),base),
])assert.equal(validateOfflineManifest(m).ok,false,'adversarial manifest must fail closed');
assert.equal(validateOfflineManifest(null).ok,false);
const denied=result=>{assert.equal(result.ok,false);assert.equal(result.assetReady,false);assert.equal(result.routeReady,false);assert.equal(result.quoteReady,false);};
const raw=fs.readFileSync(file,'utf8');
for(const bad of [
 raw.replace('"schemaVersion": 1,','"schemaVersion": 1, "schemaVersion": 1,'),
 raw.replace('"schemaVersion": 1,','"schemaVersion": 1, "schema\\u0056ersion": 1,'),
 raw.replace('"preflight": [','"preflight": [{"a":1,"a":2},'),
 raw+'garbage','{','[1,2',' '.repeat(MAX_MANIFEST_BYTES+1)
])denied(validateManifestRaw(bad));
denied(validateManifestFile(path.join(__dirname,'fixtures/does-not-exist.json')));
denied(validateManifestFile(__dirname));
denied(validateOfflineManifest(new Proxy(base,{get(){throw Error('blocked');}})));
console.log('PASS offline cartography manifest fail-closed, license, attribution, assets, network, quote gates');
