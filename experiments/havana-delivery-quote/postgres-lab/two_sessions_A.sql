-- DISPOSABLE DB ONLY; run after manual_approval.sql and manual_approval_rpc.sql.
-- DBA pre-seeds trusted actor, context, and grants; this lab GUC is NOT authentication.
BEGIN;
SELECT set_config('ed_delivery_lab.trusted_actor','owner',true);
SELECT * FROM ed_delivery_lab.approve('race-1',1100,repeat('a',64),1);
SELECT pg_sleep(4); -- hold row locks so session B contends
COMMIT;
SELECT * FROM ed_delivery_lab.resolve(1);
