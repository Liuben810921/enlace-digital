-- NOT EXECUTED. Disposable PostgreSQL role tests; expected SQL errors must be inspected.
-- Connect as LOGIN with membership ONLY in ed_intent_pool, never owner/gateway.
SELECT has_table_privilege(current_user,'ed_delivery_intent_lab.intents','SELECT') AS pool_select_must_be_false;
SELECT has_table_privilege(current_user,'ed_delivery_intent_lab.intents','INSERT') AS pool_insert_must_be_false;
SELECT has_table_privilege(current_user,'ed_delivery_intent_lab.intents','UPDATE') AS pool_update_must_be_false;
SELECT has_function_privilege(current_user,'ed_delivery_intent_lab.apply_intent(bigint,text)','EXECUTE') AS pool_apply_must_be_true;
SELECT has_function_privilege(current_user,'ed_delivery_intent_lab.consume(bigint,text)','EXECUTE') AS pool_consume_must_be_false;
-- Direct mutation should fail:
UPDATE ed_delivery_intent_lab.intents SET consumed_at=clock_timestamp() WHERE intent_id=-1;
-- DBA inspection, NOT runnable as pool:
-- SELECT rolname,rolcanlogin,rolbypassrls FROM pg_roles WHERE rolname LIKE 'ed_intent_%';
-- SELECT has_column_privilege('ed_intent_owner','ed_delivery_lab.approvals','revoked_at','UPDATE');
-- SELECT has_column_privilege('ed_intent_owner','ed_delivery_lab.approvals','fee_cup','UPDATE');
-- The last must be false. Also verify no role inheritance from pool to owner/gateway.
