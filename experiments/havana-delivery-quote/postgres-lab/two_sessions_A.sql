-- DISPOSABLE DB ONLY; run after manual_approval.sql and manual_approval_rpc.sql.
-- Connect as authenticated PostgreSQL LOGIN ed_lab_owner; never SET ROLE to spoof identity.
BEGIN;
SELECT session_user AS authenticated_actor;
SELECT * FROM ed_delivery_lab.approve('race-1',1100,repeat('a',64),1);
SELECT pg_sleep(4); -- hold row locks so session B contends
COMMIT;
SELECT * FROM ed_delivery_lab.resolve(1);
