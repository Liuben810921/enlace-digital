'use strict';
// Checks documentation coverage only, NOT deployed security or actual SQL grants.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const spec=fs.readFileSync(path.join(__dirname,'../docs/audits/delivery-manager-backend-contract-spec-2026-11-13.md'),'utf8');
const readiness=fs.readFileSync(path.join(__dirname,'../docs/audits/delivery-manager-staging-readiness-final-2026-11-13.md'),'utf8');
for(const token of [
 'ed_quote_preview_v1','ed_quote_status_v1','ed_delivery_settings_update_v1','ed_delivery_audit_read_v1',
 'SECURITY DEFINER','FORCE ROW LEVEL SECURITY','REVOKE ALL','BYPASSRLS','search_path',
 'route_evidence','origin_set_hash','cart_revision','settings_version','destination_hash',
 'PRIMARY KEY(actor_id, operation_key)','ON CONFLICT','pending','completed','failed','expired',
 '40P01','40001','55P03','57014','gross_delivery_cup','customer_fee_cup','promotion_covered_cup',
 'NO-GO','Rollback','A01','A15','No se alteran'
])assert.ok(spec.includes(token),'missing specification control: '+token);
for(let i=1;i<=7;i++)assert.ok(readiness.includes('B0'+i),'missing staging blocker B0'+i);
for(let i=1;i<=15;i++)assert.ok(new RegExp('\\bA'+String(i).padStart(2,'0')+'\\b').test(spec),'missing acceptance A'+i);
assert.ok(!/\bCREATE\s+(TABLE|FUNCTION|POLICY)\b/i.test(spec),'document must not contain executable migration DDL');
console.log('PASS offline backend spec coverage: RPC, RLS, routes, versions, idempotency, audit, recovery, acceptance A01-A15');
