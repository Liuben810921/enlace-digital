-- NOT EXECUTED. Run as disposable DBA after roles/functions installed.
-- This script FAILS if expected privilege isolation is not met.
DO $$
BEGIN
 IF has_table_privilege('ed_intent_pool','ed_delivery_intent_lab.intents','SELECT')
 OR has_table_privilege('ed_intent_pool','ed_delivery_intent_lab.intents','INSERT')
 OR has_table_privilege('ed_intent_pool','ed_delivery_intent_lab.intents','UPDATE')
 OR has_function_privilege('ed_intent_pool','ed_delivery_intent_lab.consume(bigint,text)','EXECUTE')
 OR NOT has_function_privilege('ed_intent_pool','ed_delivery_intent_lab.apply_intent(bigint,text)','EXECUTE')
 OR has_table_privilege('ed_intent_gateway','ed_delivery_lab.approvals','INSERT')
 THEN RAISE EXCEPTION 'Unexpected role privilege'; END IF;
 IF NOT has_column_privilege('ed_intent_owner','ed_delivery_lab.approvals','revoked_at','UPDATE')
 OR has_column_privilege('ed_intent_owner','ed_delivery_lab.approvals','fee_cup','UPDATE')
 THEN RAISE EXCEPTION 'Unexpected owner column privilege'; END IF;
END $$;
-- Also inspect inherited memberships separately; do not rely only on these checks.
