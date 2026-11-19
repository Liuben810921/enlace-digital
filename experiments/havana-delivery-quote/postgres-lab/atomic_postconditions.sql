-- NOT EXECUTED. DBA-only, inspect after both sessions COMMIT/ROLLBACK.
-- :operation_id = synthetic-op-1 or synthetic-revoke-1
SELECT operation_id,action,consumed_at IS NOT NULL AS consumed
FROM ed_delivery_intent_lab.intents WHERE operation_id=:'operation_id';
SELECT actor_id,operation_id,revoked_at IS NOT NULL AS revoked
FROM ed_delivery_lab.approvals
WHERE operation_id IN ('synthetic-op-1','synthetic-revoke-target');
-- Commit scenario: A LAB_APPLIED_ONLY, B PENDIENTE, exactly one intent consumed.
-- Rollback scenario: A result rolled back, B LAB_APPLIED_ONLY, one committed effect.
-- Replays after commit: PENDIENTE.
