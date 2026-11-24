const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const patch=fs.readFileSync(path.join(root,"experiments/havana-delivery-quote/staging-delivery-auth-claims-patch.sql"),"utf8");
const schema=fs.readFileSync(path.join(root,"experiments/havana-delivery-quote/staging-delivery-schema.sql"),"utf8");
const helper="ed_delivery_private.current_uid()";

test("JWT subject helper mirrors Supabase auth.uid claims without auth schema dependency",()=>{
 assert.match(patch,/current_setting\('request\.jwt\.claim\.sub',true\)/);
 assert.match(patch,/current_setting\('request\.jwt\.claims',true\)/);
 assert.match(patch,/::jsonb->>'sub'\)\)::uuid/);
 assert.doesNotMatch(patch,/auth\.uid\(\)/);
 assert.match(schema,/create or replace function ed_delivery_private\.current_uid\(\)/);
});

test("all four admin RPCs use the same trusted server JWT subject",()=>{
 for(const name of ["read","write","deactivate","batch"]){
  assert.match(patch,new RegExp("create or replace function public\\.ed_delivery_staging_"+name+"\\("));
 }
 assert.equal((patch.match(/ed_delivery_private\.current_uid\(\)/g)||[]).length>=10,true);
});

test("RLS remains allowlist-bound for every staging table",()=>{
 for(const policy of ["ed_admin_self_read","ed_entities_admin","ed_links_admin","ed_operations_admin"]){
  assert.match(patch,new RegExp("alter policy "+policy+" on ed_delivery_private\\."));
 }
 assert.match(patch,/enabled/);
 assert.match(patch,/actor_id=\(select ed_delivery_private\.current_uid\(\)\)/);
 assert.match(patch,/grant execute on function ed_delivery_private\.current_uid\(\) to ed_delivery_staging_rpc/);
 assert.match(patch,/revoke all on function ed_delivery_private\.current_uid\(\) from public,anon,authenticated/);
});

test("temporary migration privileges are paired with revocations",()=>{
 assert.match(patch,/grant create on schema public to ed_delivery_staging_rpc/);
 assert.match(patch,/set local role ed_delivery_staging_rpc/);
 assert.match(patch,/reset role/);
 assert.match(patch,/revoke create on schema public from ed_delivery_staging_rpc/);
 assert.match(patch,/revoke ed_delivery_staging_rpc from postgres/);
});

test("patch does not drop schema objects or delete auth data",()=>{
 assert.doesNotMatch(patch,/drop\s+(table|schema|policy|function)/i);
 assert.doesNotMatch(patch,/truncate\s/i);
 assert.doesNotMatch(patch,/delete\s+from\s+(auth\.|ed_delivery_private\.admin_members)/i);
});
