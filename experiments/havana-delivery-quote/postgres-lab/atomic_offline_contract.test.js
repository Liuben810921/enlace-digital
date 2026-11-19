'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const dir=__dirname;
const atomic=fs.readFileSync(dir+'/shared_pool_atomic_lab.sql','utf8');
const intents=fs.readFileSync(dir+'/shared_pool_intents.sql','utf8');
const roles=fs.readFileSync(dir+'/atomic_disposable_roles.sql','utf8');
const checks=[
['no literal newline regression',!atomic.includes(String.raw`\n`)],
['atomic rollback on insert conflict',atomic.includes('ON CONFLICT (actor_id,operation_id) DO NOTHING RETURNING id INTO inserted_id')],
['failed insert not consumed',atomic.includes("IF inserted_id IS NULL THEN RETURN 'PENDIENTE'; END IF;")],
['intent unique key',intents.includes('UNIQUE(actor_id,operation_id,action)')],
['approval unique key',atomic.includes('ed_delivery_lab.approvals')],
['no pool table grants',!atomic.includes('GRANT SELECT ON ed_delivery_intent_lab.intents TO ed_intent_pool')],
['owner function',atomic.includes('OWNER TO ed_intent_owner')],
['role freshness',atomic.includes("r NOT IN ('principal','general')")],
['context revision',atomic.includes('c.revision<>v.context_revision')],
['revocation checks actor',atomic.includes('old_row.actor_id<>v.actor_id')],
['revocation checks expiry',atomic.includes('old_row.expires_at<=clock_timestamp()')],
['revoke already revoked',atomic.includes('old_row.revoked_at IS NOT NULL')],
['transactional consume',atomic.includes('UPDATE ed_delivery_intent_lab.intents SET consumed_at=clock_timestamp()')],
['no client GUC',!/current_setting\s*\(/.test(atomic)],
['no session user identity',!/session_user/i.test(atomic)],
['isolated pool login',roles.includes('ed_intent_test_pool LOGIN NOINHERIT NOBYPASSRLS')],
['isolated gateway login',roles.includes('ed_intent_test_gateway LOGIN NOINHERIT NOBYPASSRLS')],
['no owner membership',!roles.includes('GRANT ed_intent_owner TO')]
];
checks.forEach(([label,ok])=>assert.ok(ok,label));
console.log('PASS '+checks.length+' static contract checks; PostgreSQL NOT executed');
