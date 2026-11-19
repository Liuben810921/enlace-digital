'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const root=__dirname;
const sql=fs.readFileSync(root+'/manual_approval_rpc.sql','utf8');
const a=fs.readFileSync(root+'/two_sessions_A.sql','utf8');
const b=fs.readFileSync(root+'/two_sessions_B.sql','utf8');
const checks=[
/CREATE OR REPLACE FUNCTION ed_delivery_lab\.approve/.test(sql),
/CREATE OR REPLACE FUNCTION ed_delivery_lab\.revoke/.test(sql),
/CREATE OR REPLACE FUNCTION ed_delivery_lab\.resolve/.test(sql),
/UNIQUE\(actor_id,operation_id\)/.test(fs.readFileSync(root+'/manual_approval.sql','utf8')),
/FOR UPDATE/.test(sql),
/FOR SHARE/.test(sql),
/v_old\.revoked_at IS NOT NULL/.test(sql),
/v_old\.expires_at<=clock_timestamp\(\)/.test(sql),
/request_fingerprint<>p_expected_fingerprint/.test(sql),
/configuration_revision<>p_expected_revision/.test(sql),
/NOT IN \('principal','general'\)/.test(sql),
/REVOKE ALL ON FUNCTION ed_delivery_lab\.approve/.test(sql),
/GRANT EXECUTE ON FUNCTION ed_delivery_lab\.approve/.test(sql),
/REVOKE ALL ON ed_delivery_lab\.actor_grants/.test(sql),
/set_config\('ed_delivery_lab\.trusted_actor'/.test(a),
/pg_sleep\(4\)/.test(a),
/count\(\*\) AS must_equal_one/.test(b),
/ed_delivery_lab\.revoke/.test(b),
/'PENDIENTE'/.test(sql),
/context first, then approval/.test(sql),\n/session_user/.test(sql),\n!/current_setting\\('ed_delivery_lab\\.trusted_actor'/.test(sql),
];
checks.forEach((v,i)=>assert.ok(v,'static check '+(i+1)));
console.log('PASS '+checks.length+' static RPC contract checks; PostgreSQL NOT executed');
