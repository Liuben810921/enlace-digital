import {GuardedQuota} from './unified-guarded.mjs';
import {createHash,randomBytes} from 'node:crypto';
// Offline trust boundary: the token is not an authentication system.
export function createSingleEntry(file,{limit=2,clock=()=>Date.now()}={}){
 const quota=new GuardedQuota(file,{limit,clock});
 const sessions=new Map();
 function verify(token){if(typeof token!=='string'||!/^[0-9a-f]{64}$/.test(token))return null;const key=createHash('sha256').update(token).digest('hex');const entry=sessions.get(key);return entry??null}
 return Object.freeze({
  issueSyntheticPrincipal(principal){if(typeof principal!=='string'||!/^test-[A-Za-z0-9_-]{3,60}$/.test(principal))throw Error('INVALID_SYNTHETIC_PRINCIPAL');const token=randomBytes(32).toString('hex');sessions.set(createHash('sha256').update(token).digest('hex'),principal);return token},
  start(token,{version,id,payload}={}){const principal=verify(token);if(!principal)return {status:'PENDIENTE',reason:'UNAUTHORIZED'};return quota.start({version,id,principal,payload})},
  finish(token,{version,id,payload,known=false}={}){const principal=verify(token);if(!principal)return {status:'PENDIENTE',reason:'UNAUTHORIZED'};return quota.finish({version,id,principal,payload,known})},
  stats(){return quota.stats()},
  close(){sessions.clear();quota.close()}
 });
}
