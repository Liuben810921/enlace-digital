'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=__dirname;
const rpc=fs.readFileSync(root+'/manual_approval_rpc.sql','utf8');
const boundary=fs.readFileSync(root+'/shared_pool_boundary.md','utf8');
const checks=[
!rpc.includes('\\n'),
rpc.includes('ALTER FUNCTION ed_delivery_lab.approve(text,bigint,text,bigint) OWNER TO ed_delivery_lab_owner;\n'),
rpc.includes('REVOKE CREATE ON SCHEMA ed_delivery_lab FROM PUBLIC,ed_delivery_lab_api;\n'),
rpc.includes('GRANT SELECT ON ed_delivery_lab.actor_grants'),
rpc.includes('GRANT EXECUTE ON FUNCTION ed_delivery_lab.approve'),
rpc.includes('Individual-login lab only'),
!rpc.includes("current_setting('ed_delivery_lab.trusted_actor'"),
boundary.includes('Do not use `session_user` as individual identity'),
boundary.includes('server-side identity provider'),
boundary.includes('single-use authorization intent'),
boundary.includes('transactional table'),
boundary.includes('unavailable to the general pool role'),
boundary.includes('atomically marks intent consumed'),
boundary.includes('unique nonce'),
boundary.includes('action (approve/revoke)'),
boundary.includes('Unknown, stale, revoked'),
boundary.includes('legacy RPC must be disabled'),
boundary.includes('not implemented')||boundary.includes('NOT implemented'),
];
checks.forEach((v,i)=>assert.ok(v,'boundary static check '+(i+1)));
console.log('PASS '+checks.length+' offline boundary checks (not database tests)');
