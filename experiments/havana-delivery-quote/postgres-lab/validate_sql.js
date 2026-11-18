'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const sql=fs.readFileSync(__dirname+'/manual_approval.sql','utf8');
const checks=[
 /CREATE TABLE ed_delivery_lab\.configuration/.test(sql),
 /revision bigint NOT NULL CHECK \(revision>=0\)/.test(sql),
 /CREATE TABLE ed_delivery_lab\.approvals/.test(sql),
 /UNIQUE\(actor_id,operation_id\)/.test(sql),
 /request_fingerprint text NOT NULL/.test(sql),
 /fee_cup bigint NOT NULL CHECK \(fee_cup>=0\)/.test(sql),
 /revoked_at timestamptz/.test(sql),
 /expires_at timestamptz NOT NULL/.test(sql),
 /REVOKE ALL ON ALL TABLES IN SCHEMA ed_delivery_lab FROM PUBLIC/.test(sql),
 /FOR UPDATE/.test(sql),
 /never caller-supplied role/.test(sql),
 /recompute canonical request fingerprint/.test(sql),
 /No unconditional DO UPDATE/.test(sql),
 /Courier charge remains outside checkout/.test(sql),
 !/CREATE EXTENSION/.test(sql),
 !/SECURITY DEFINER\s+AS/.test(sql)
];
checks.forEach((ok,i)=>assert.ok(ok,'contract check '+(i+1)));
console.log('PASS '+checks.length+' SQL contract static checks (NOT PostgreSQL execution)');
