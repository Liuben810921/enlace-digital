'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const sql=fs.readFileSync(__dirname+'/shared_pool_intents.sql','utf8');
const cases=[
['separate gateway role',/CREATE ROLE ed_intent_gateway NOLOGIN NOBYPASSRLS/],
['separate pool role',/CREATE ROLE ed_intent_pool NOLOGIN NOBYPASSRLS/],
['separate owner role',/CREATE ROLE ed_intent_owner NOLOGIN NOBYPASSRLS/],
['unique nonce',/nonce_hash text NOT NULL UNIQUE/],
['unique actor operation action',/UNIQUE\(actor_id,operation_id,action\)/],
['action binding',/action IN \('approve','revoke'\)/],
['audience binding',/audience='havana-delivery-admin'/],
['context hash',/context_hash text NOT NULL/],
['revision',/context_revision bigint NOT NULL/],
['expiry',/expires_at<=clock_timestamp\(\)/],
['consumption marker',/consumed_at IS NOT NULL/],
['row lock',/FOR UPDATE/],
['gateway insert only',/GRANT INSERT ON ed_delivery_intent_lab.intents TO ed_intent_gateway/],
['pool no table access',/REVOKE ALL ON ed_delivery_intent_lab.intents FROM PUBLIC,ed_intent_pool/],
['pool function only',/GRANT EXECUTE ON FUNCTION ed_delivery_intent_lab.consume\(bigint,text\) TO ed_intent_pool/],
['function owner',/OWNER TO ed_intent_owner/],
['schema locked',/REVOKE CREATE ON SCHEMA ed_delivery_intent_lab/],
['not approval',/LAB_CONSUMED_ONLY/],
['fail closed',/RETURN 'PENDIENTE'/],
['no GUC identity',/CREATE FUNCTION ed_delivery_intent_lab.consume/]
];
cases.forEach(([label,re])=>assert.ok(re.test(sql),label));
assert.ok(!/current_setting\s*\(/i.test(sql),'no mutable GUC');
assert.ok(!/session_user/i.test(sql),'no pooled session_user identity');
assert.ok(!/GRANT (ALL|INSERT|UPDATE) ON ed_delivery_intent_lab.intents TO ed_intent_pool/i.test(sql),'no pool write');
console.log('PASS '+(cases.length+3)+' static intent contract checks; PostgreSQL NOT executed');
