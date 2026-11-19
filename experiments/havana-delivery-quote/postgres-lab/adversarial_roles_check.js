'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const root=__dirname;
const rpc=fs.readFileSync(root+'/manual_approval_rpc.sql','utf8');
const roles=fs.readFileSync(root+'/roles_preflight.sql','utf8');
const models=fs.readFileSync(root+'/identity_models.md','utf8');
const tests=[
!rpc.includes("current_setting('ed_delivery_lab.trusted_actor'"),
rpc.includes('v_actor:=session_user;'),
rpc.includes('OWNER TO ed_delivery_lab_owner'),
rpc.includes('REVOKE CREATE ON SCHEMA ed_delivery_lab'),
rpc.includes('GRANT INSERT,UPDATE ON ed_delivery_lab.approvals'),
rpc.includes('REVOKE ALL ON FUNCTION ed_delivery_lab.approve'),
rpc.includes('TO ed_delivery_lab_api'),
roles.includes('NOLOGIN NOBYPASSRLS'),
!roles.includes('PASSWORD '),
models.includes('Shared connection pool'),
models.includes('cannot'),
models.includes('PENDIENTE'),
!rpc.includes('GRANT ALL ON ALL TABLES'),
];
tests.forEach((v,i)=>assert.ok(v,'static privilege check '+(i+1)));
console.log('PASS '+tests.length+' privilege static checks; SQL NOT EXECUTED');
