'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const sql=fs.readFileSync(__dirname+'/shared_pool_atomic_lab.sql','utf8');
const checks=[
/REVOKE EXECUTE ON FUNCTION ed_delivery_intent_lab.consume/.test(sql),
/CREATE FUNCTION ed_delivery_intent_lab.apply_intent/.test(sql),
/SECURITY DEFINER SET search_path=pg_catalog/.test(sql),
/authoritative_context/.test(sql),
/admin_roles/.test(sql),
/FOR SHARE/.test(sql),
/FOR UPDATE/.test(sql),
/v.consumed_at IS NOT NULL/.test(sql),
/v.expires_at<=clock_timestamp/.test(sql),
/v.nonce_hash<>p_nonce_hash/.test(sql),
/c.fingerprint<>v.context_hash/.test(sql),
/c.revision<>v.context_revision/.test(sql),
/r NOT IN \('principal','general'\)/.test(sql),
/old_row.actor_id<>v.actor_id/.test(sql),
/old_row.revoked_at IS NOT NULL/.test(sql),
/INSERT INTO ed_delivery_lab.approvals/.test(sql),
/UPDATE ed_delivery_lab.approvals SET revoked_at/.test(sql),
/UPDATE ed_delivery_intent_lab.intents SET consumed_at/.test(sql),
/LAB_APPLIED_ONLY/.test(sql),
/OWNER TO ed_intent_owner/.test(sql),
/REVOKE ALL ON FUNCTION ed_delivery_intent_lab.apply_intent/.test(sql),
/GRANT EXECUTE ON FUNCTION ed_delivery_intent_lab.apply_intent/.test(sql),
!/current_setting\s*\(/.test(sql),
!/session_user/.test(sql)
];checks.forEach((v,i)=>assert.ok(v,'atomic static check '+(i+1)));
console.log('PASS '+checks.length+' static atomic contract checks; PostgreSQL NOT executed');
