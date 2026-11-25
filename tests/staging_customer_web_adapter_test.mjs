// Offline contract tests: no network, no Supabase writes, no production web edits.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createStagingCustomerTransport } from '../scripts/staging_customer_web_adapter.mjs';
const staging='https://xqahthghvozeigbojhyi.supabase.co/functions/v1/enlace-cliente-auth-staging';
test('staging transport rejects production and insecure endpoint',()=>{
  for(const url of ['https://ubrvuplslconfxwpfzxj.supabase.co/functions/v1/enlace-cliente-auth','http://xqahthghvozeigbojhyi.supabase.co/functions/v1/enlace-cliente-auth-staging']){
    assert.throws(()=>createStagingCustomerTransport({endpoint:url,publishableKey:'sb_publishable_example',fetchImpl:async()=>{}}));
  }
});
test('request carries public key in apikey, never as Bearer; session token remains in body',async()=>{
 let seen;const api=createStagingCustomerTransport({endpoint:staging,publishableKey:'sb_publishable_example',fetchImpl:async(u,o)=>{seen={u,o};return {ok:true,json:async()=>({ok:true})}}});
 assert.deepEqual(await api('profile',{token:'test-token'}),{ok:true});
 assert.equal(seen.u,staging);assert.equal(seen.o.headers.apikey,'sb_publishable_example');assert.equal(seen.o.headers.Authorization,undefined);assert.equal(JSON.parse(seen.o.body).token,'test-token');
});
test('non-JSON or HTTP error fails closed',async()=>{
 const api=createStagingCustomerTransport({endpoint:staging,publishableKey:'sb_publishable_example',fetchImpl:async()=>({ok:false,status:503,json:async()=>{throw Error('invalid')}})});
 await assert.rejects(api('login',{}),/Respuesta no JSON/);
});
