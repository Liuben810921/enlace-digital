'use strict';
// Fail-closed offline cartography manifest preflight. Never downloads, launches routing or quotes.
const fs=require('node:fs');
const path=require('node:path');
const MAX_MANIFEST_BYTES=16384;
const PREFLIGHT=Object.freeze([
 'Confirm zero cost and legal redistribution terms',
 'Verify actual coverage and map version',
 'Generate local tiles and style without external tile requests',
 'Preserve attribution visibly in mobile map',
 'Validate manifest hashes and coverage before enabling tiles',
 'Keep route provenance and commercial fees fail-closed'
]);
const DENIED={assetReady:false,routeReady:false,quoteReady:false};
const REQUIRED_NULL=['sourceUrl','sourceSha256','downloadedAt','coverageBounds','format','tilesDirectory','styleFile'];
const REQUIRED_KEYS=['schemaVersion','status','region','provider','license','attribution',...REQUIRED_NULL,'offlineOnly','networkRequestsAllowed','commercialQuoteEnabled','routeGeometrySource','preflight'];
const REQUIRED_FLAGS={offlineOnly:true,networkRequestsAllowed:false,commercialQuoteEnabled:false};
function validateOfflineManifest(m){
 const errors=[];
 if(!m||typeof m!=='object'||Array.isArray(m))return {ok:false,errors:['manifest_not_object'],...DENIED};
 try{
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
 if(!Array.isArray(m.preflight)||m.preflight.length!==PREFLIGHT.length||!PREFLIGHT.every((x,i)=>m.preflight[i]===x))errors.push('preflight');
 }catch(_){errors.push('manifest_access_error');}
 return {ok:errors.length===0,errors,...DENIED};
}
// Parse JSON structure to reject duplicate keys, including escaped-equivalent and nested keys.
function rejectDuplicateJsonKeys(raw){
 let i=0;
 function ws(){while(i<raw.length && /[ \\t\\r\\n]/.test(raw[i]))i++;}
 function str(){const start=i++;let escaped=false;while(i<raw.length){const c=raw[i++];if(escaped){escaped=false;continue;}if(c==='\\\\'){escaped=true;continue;}if(c==='"')return JSON.parse(raw.slice(start,i));}throw Error('invalid_json');}
 function value(){ws();const c=raw[i];if(c==='"'){str();return;}
  if(c==='{'){i++;const keys=new Set();ws();if(raw[i]==='}'){i++;return;}while(i<raw.length){ws();if(raw[i]!=='"')throw Error('invalid_json');const k=str();if(keys.has(k))throw Error('duplicate_json_key');keys.add(k);ws();if(raw[i++]!==':')throw Error('invalid_json');value();ws();if(raw[i]==='}'){i++;return;}if(raw[i++]!==',')throw Error('invalid_json');}throw Error('invalid_json');}
  if(c==='['){i++;ws();if(raw[i]===']'){i++;return;}while(i<raw.length){value();ws();if(raw[i]===']'){i++;return;}if(raw[i++]!==',')throw Error('invalid_json');}throw Error('invalid_json');}
  const match=/^(?:true|false|null|-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)/.exec(raw.slice(i));if(!match)throw Error('invalid_json');i+=match[0].length;
 }
 value();ws();if(i!==raw.length)throw Error('invalid_json');
}
function validateManifestRaw(raw){
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>MAX_MANIFEST_BYTES)return {ok:false,errors:['manifest_too_large_or_invalid'],...DENIED};
 try{rejectDuplicateJsonKeys(raw);return validateOfflineManifest(JSON.parse(raw));}
 catch(e){return {ok:false,errors:[e.message==='duplicate_json_key'?'duplicate_json_key':'invalid_json'],...DENIED};}
}
function validateManifestFile(filename){
 try{
  const stat=fs.statSync(filename);
  if(!stat.isFile()||stat.size>MAX_MANIFEST_BYTES)return {ok:false,errors:['manifest_too_large_or_invalid'],...DENIED};
  return validateManifestRaw(fs.readFileSync(filename,'utf8'));
 }catch(_){return {ok:false,errors:['manifest_file_unavailable'],...DENIED};}
}
if(require.main===module){
 const file=path.resolve(__dirname,'fixtures/havana-offline-cartography-manifest.json');
 const result=validateManifestFile(file);
 if(!result.ok){console.error('FAIL offline manifest:',result.errors.join(','));process.exitCode=1}
 else console.log('PASS offline manifest: blocked, no assets, no network, no quotes');
}
module.exports={validateOfflineManifest,validateManifestRaw,validateManifestFile,MAX_MANIFEST_BYTES};
