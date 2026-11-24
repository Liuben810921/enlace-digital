const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const migration=fs.readFileSync(path.join(root,"experiments/havana-delivery-quote/staging-delivery-auth-boundary-v2.sql"),"utf8");
const adapter=fs.readFileSync(path.join(root,"experiments/havana-delivery-quote/staging-adapter.js"),"utf8");

test("uses a postgres-owned security-definer helper for the Auth claim",()=>{
 assert.match(migration,/create or replace function ed_delivery_private\.current_uid\(\)[\s\S]*?security definer[\s\S]*?set search_path = ''[\s\S]*?select auth\.uid\(\)/i);
 assert.match(migration,/revoke all on function ed_delivery_private\.current_uid\(\) from public, anon, authenticated, ed_delivery_staging_rpc/i);
 assert.doesNotMatch(migration,/grant usage on schema auth/i);
});

test("clones all four current RPCs only after checking their security contract",()=>{
 for(const name of ["read","write","deactivate","batch"]){
  assert.match(migration,new RegExp("public\\.ed_delivery_staging_"+name+"\\([^']*"));
  assert.match(migration,new RegExp("public\\.ed_delivery_staging_"+name+"_v2"));
 }
 assert.match(migration,/position\('ed_delivery_private\.admin_members' in v_definition\)=0/);
 assert.match(migration,/position\('enabled' in v_definition\)=0/);
 assert.match(migration,/position\('SECURITY DEFINER' in upper\(v_definition\)\)=0/);
 assert.match(migration,/position\('SET search_path TO/);
 assert.match(migration,/replace\(v_definition,'auth\.uid\(\)','ed_delivery_private\.current_uid\(\)'\)/);
});

test("new APIs are closed to public and anon and granted only to signed-in callers",()=>{
 for(const name of ["read","write","deactivate","batch"]){
  assert.match(migration,new RegExp("revoke all on function public\\.ed_delivery_staging_"+name+"_v2\\("));
  assert.match(migration,new RegExp("grant execute on function public\\.ed_delivery_staging_"+name+"_v2\\([^;]+ to authenticated"));
 }
});

test("staging adapter uses the v2 API names while legacy RPCs remain available",()=>{
 for(const name of ["read","write","deactivate","batch"])
  assert.match(adapter,new RegExp("ed_delivery_staging_"+name+"_v2"));
 assert.doesNotMatch(migration,/revoke all on function public\.ed_delivery_staging_(read|write|deactivate|batch)\(/i);
});
