-- Start within the 4-second pause of session A, in another psql connection.
BEGIN;
SELECT session_user AS authenticated_actor;
SELECT * FROM ed_delivery_lab.approve('race-1',1100,repeat('a',64),1);
COMMIT;
-- Expected one CREATED and one EXISTING, never two approval rows.
SELECT count(*) AS must_equal_one FROM ed_delivery_lab.approvals WHERE actor_id='ed_lab_owner' AND operation_id='race-1';
-- Test revocation, then replay of same operation should return PENDIENTE.
BEGIN;
SELECT session_user AS authenticated_actor;
SELECT ed_delivery_lab.revoke(id) FROM ed_delivery_lab.approvals WHERE actor_id='ed_lab_owner' AND operation_id='race-1';
COMMIT;
BEGIN;
SELECT session_user AS authenticated_actor;
SELECT * FROM ed_delivery_lab.approve('race-1',1100,repeat('a',64),1);
COMMIT;
