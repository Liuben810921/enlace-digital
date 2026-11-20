-- Disposable PostgreSQL prototype ONLY. Never run on Supabase/staging/production.
BEGIN;
CREATE SCHEMA IF NOT EXISTS geoapify_disposable;
CREATE TABLE geoapify_disposable.budget (
 day_utc date PRIMARY KEY,
 spent integer NOT NULL DEFAULT 0 CHECK (spent>=0 AND spent<=2400),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE geoapify_disposable.reservation (
 principal text NOT NULL,
 operation_id text NOT NULL,
 payload_hash text NOT NULL CHECK (payload_hash ~ '^[0-9a-f]{64}$'),
 day_utc date NOT NULL REFERENCES geoapify_disposable.budget(day_utc),
 credits integer NOT NULL CHECK (credits BETWEEN 1 AND 8),
 reservation_id uuid NOT NULL DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(principal,operation_id),
 UNIQUE(reservation_id)
);
-- Call with an independently authenticated principal and server-computed SHA256 canonical payload.
-- Serializable behaviour for the budget is achieved by the single row lock.
CREATE OR REPLACE FUNCTION geoapify_disposable.reserve(
 p_principal text,p_operation_id text,p_hash text,p_credits integer,p_day date
) RETURNS TABLE(committed boolean,reservation_id uuid,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE existing geoapify_disposable.reservation%ROWTYPE;
DECLARE remaining integer;
DECLARE new_id uuid;
BEGIN
 IF p_principal IS NULL OR length(p_principal) NOT BETWEEN 1 AND 128
    OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{12,80}$'
    OR p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$'
    OR p_credits IS NULL OR p_credits NOT BETWEEN 1 AND 8
    OR p_day IS DISTINCT FROM (now() AT TIME ZONE 'UTC')::date THEN
   RETURN QUERY SELECT false,NULL::uuid,'INVALID_INPUT'::text; RETURN;
 END IF;
 -- Lock a single budget row first, serializing competing operations and
 -- eliminating insert races for the same operation id in this prototype.
 INSERT INTO geoapify_disposable.budget(day_utc) VALUES(p_day)
 ON CONFLICT(day_utc) DO NOTHING;
 PERFORM 1 FROM geoapify_disposable.budget WHERE day_utc=p_day FOR UPDATE;
 SELECT * INTO existing FROM geoapify_disposable.reservation
 WHERE principal=p_principal AND operation_id=p_operation_id;
 IF FOUND THEN
   IF existing.payload_hash<>p_hash OR existing.credits<>p_credits OR existing.day_utc<>p_day THEN
     RETURN QUERY SELECT false,NULL::uuid,'IDEMPOTENCY_CONFLICT'::text;
   ELSE
     RETURN QUERY SELECT true,existing.reservation_id,'REPLAY'::text;
   END IF;
   RETURN;
 END IF;
 SELECT 2400-spent INTO remaining FROM geoapify_disposable.budget WHERE day_utc=p_day;
 IF remaining<p_credits THEN
   RETURN QUERY SELECT false,NULL::uuid,'DAILY_BUDGET_EXCEEDED'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.budget SET spent=spent+p_credits,updated_at=now() WHERE day_utc=p_day;
 INSERT INTO geoapify_disposable.reservation(principal,operation_id,payload_hash,day_utc,credits)
 VALUES(p_principal,p_operation_id,p_hash,p_day,p_credits)
 RETURNING geoapify_disposable.reservation.reservation_id INTO new_id;
 RETURN QUERY SELECT true,new_id,'RESERVED'::text;
END $$;
-- Read-only reconciliation after unknown COMMIT outcome: never blindly retry with a new operation ID.
CREATE OR REPLACE FUNCTION geoapify_disposable.lookup(
 p_principal text,p_operation_id text,p_hash text
) RETURNS TABLE(found boolean,matched boolean,reservation_id uuid)
LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
 SELECT true,(r.payload_hash=p_hash),r.reservation_id
 FROM geoapify_disposable.reservation r
 WHERE r.principal=p_principal AND r.operation_id=p_operation_id
$$;
REVOKE ALL ON SCHEMA geoapify_disposable FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA geoapify_disposable FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA geoapify_disposable FROM PUBLIC;
COMMIT;
