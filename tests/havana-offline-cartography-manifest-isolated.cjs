'use strict';
// Fail-closed offline cartography manifest preflight. Never downloads, launches routing or quotes.
const fs=require('node:fs');
const path=require('node:path');
const REQUIRED_NULL=['sourceUrl','sourceSha256','downloadedAt','coverageBounds','format','tilesDirectory','styleFile'];
const REQUIRED_KEYS=['schemaVersion','status','region','provider','license','attribution',...REQUIRED_NULL,'offlineOnly','networkRequestsAllowed','commercialQuoteEnabled','routeGeometrySource','preflight'];
const REQUIRED_FLAGS={offlineOnly:true,networkRequestsAllowed:false,commercialQuoteEnabled:false};
function validateOfflineManifest(m){
 const errors=[];
 if(!m||typeof m!=='object'||Array.isArray(m))return {ok:false,errors:['manifest_not_object']};
 if(Object.keys(m).some(key=>!REQUIRED_KEYS.includes(key))||REQUIRED_KEYS.some(key=>!Object.hasOwn(m,key)))errors.push('unexpected_or_missing_keys');
 if(Object.getPrototypeOf(m)!==Object.prototype&&Object.getPrototypeOf(m)!==null)errors.push('unexpected_prototype');
 if(m.schemaVersion!==1)errors.push('schema_version');
 if(m.status!=='blocked_no_assets_downloaded')errors.push('status_not_blocked');
 if(m.region!=='La Habana, Cuba')errors.push('region');
 if(m.provider!=='OpenStreetMap contributors')errors.push('provider');
 if(m.license!=='ODbL 1.0 (verify exact source and derivative obligations before publishing)')errors.push('license');
 if(m.attribution!=='© OpenStreetMap contributors')errors.push('attribution');
 for(const key of REQUIRED_NULL)if(!Object.hasOwn(m,key)||m[key]!==null)errors.push('asset_field_'+key);
 for(const [key,value] of Object.entries(REQUIRED_FLAGS))if(m[key]!==value)errors.push('unsafe_flag_'+key);
 if(typeof m.routeGeometrySource!=='string'||m.routeGeometrySource!=='trusted OSRM backend required; synthetic fixtures not eligible')errors.push('route_provenance');
 if(!Array.isArray(m.preflight)||m.preflight.length!==6||!m.preflight.every(x=>typeof x==='string'&&x.length>10&&x.length<=180&&!x.includes('://')&&!x.includes('<script')&&!x.includes('fetch(')))errors.push('preflight');
 return {ok:errors.length===0,errors,assetReady:false,routeReady:false,quoteReady:false};
}
function validateManifestFile(filename){
 const raw=fs.readFileSync(filename,'utf8');
 return validateOfflineManifest(JSON.parse(raw));
}
if(require.main===module){
 const file=path.resolve(__dirname,'fixtures/havana-offline-cartography-manifest.json');
 const result=validateManifestFile(file);
 if(!result.ok){console.error('FAIL offline manifest:',result.errors.join(','));process.exitCode=1}
 else console.log('PASS offline manifest: blocked, no assets, no network, no quotes');
}
module.exports={validateOfflineManifest,validateManifestFile};
