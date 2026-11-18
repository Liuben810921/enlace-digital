import {readFileSync, lstatSync, realpathSync} from 'node:fs';
import {resolve, dirname, basename} from 'node:path';

// Offline source-policy guard, not a runtime sandbox or module loader.
// Only checked entry points are in scope; dynamic imports and aliases fail closed.
const allowed = new Set([
 'ipc-broker.test.mjs', 'ipc-broker.sigkill.test.mjs',
 'ipc-broker.boundary.test.mjs', 'ipc-isolation.owner.mjs',
 'ipc-rotation.mjs', 'ipc-cross-rotation.mjs'
]);
const importPattern = /\b(?:import|export)\s*(?:[\s\S]*?\s+from\s*)?['"]([^'"\n]+)['"]/g;
export function checkBrokerImports({root, paths, production=false}={}) {
 if (!Array.isArray(paths) || !paths.length || typeof root !== 'string') throw Error('INVALID_SCOPE');
 const rootReal = realpathSync(root), findings=[];
 for (const name of paths) {
  if (typeof name !== 'string' || !/^[a-zA-Z0-9_.-]+\.mjs$/.test(name)) throw Error('INVALID_PATH');
  const file = resolve(rootReal,name), st=lstatSync(file);
  if (!st.isFile() || st.isSymbolicLink() || realpathSync(file)!==file || dirname(file)!==rootReal) throw Error('UNSAFE_SOURCE');
  const source=readFileSync(file,'utf8');
  // These are intentionally conservative: the guard is an audit, not a JS parser.
  if (/\bimport\s*\(/.test(source) || /\brequire\s*\(/.test(source)) findings.push({file:name,reason:'DYNAMIC_IMPORT_UNAUDITED'});
  const imports=[...source.matchAll(importPattern)].map(m=>m[1]);
  for (const specifier of imports) {
   if (specifier==='./ipc-broker.mjs' && (production || !allowed.has(basename(file)))) findings.push({file:name,reason:'DIRECT_BROKER_IMPORT'});
   if (specifier.startsWith('.') && specifier.includes('ipc-broker') && specifier!=='./ipc-broker.mjs') findings.push({file:name,reason:'UNRECOGNIZED_BROKER_PATH'});
  }
  if (/\bstartBroker\s*\(/.test(source) && !allowed.has(name)) findings.push({file:name,reason:'DIRECT_START_CALL_UNAUDITED'});
 }
 return Object.freeze({ok:findings.length===0,findings,filesChecked:paths.length,mode:production?'authorized':'legacy-harness'});
}
