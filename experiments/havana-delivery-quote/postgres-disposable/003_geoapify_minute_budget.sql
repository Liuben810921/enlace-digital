-- Apply after 001_geoapify_ledger.sql in a DISPOSABLE local PostgreSQL only.
-- Adds an atomic UTC minute window and safe cross-midnight idempotency.
BEGIN;
CREATE TABLE geoapify_disposable.minute_budget (
 minute_utc timestamptz PRIMARY KEY,
 spent integer NOT NULL DEFAULT 0 CHECK (spent BETWEEN 0 AND 30)
);
REVOKE ALL ON geoapify_disposable.minute_budget FROM PUBLIC;
CREATE OR REPLACE FUNCTION geoapify_disposable.reserve(
 p_principal text,p_operation_id text,p_hash text,p_credits integer,p_day date
) RETURNS TABLE(committed boolean,reservation_id uuid,reason text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,geoapify_disposable AS $$
DECLARE existing geoapify_disposable.reservation%ROWTYPE;
DECLARE remaining integer;
DECLARE minute_start timestamptz := date_trunc('minute', clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
DECLARE new_id uuid;
BEGIN
 IF p_principal IS NULL OR length(p_principal) NOT BETWEEN 1 AND 128
    OR p_operation_id IS NULL OR p_operation_id !~ '^[A-Za-z0-9_-]{12,80}$'
    OR p_hash IS NULL OR p_hash !~ '^[0-9a-f]{64}$'
    OR p_credits IS NULL OR p_credits NOT BETWEEN 1 AND 8
    OR p_day IS NULL THEN
   RETURN QUERY SELECT false,NULL::uuid,'INVALID_INPUT'::text; RETURN;
 END IF;
 -- Serialize all operations using a stable advisory lock for this disposable prototype.
 -- Unlike an absent budget row, the lock also protects replay across UTC midnight.
 PERFORM pg_advisory_xact_lock(7342291,1);
 SELECT * INTO existing FROM geoapify_disposable.reservation
 WHERE principal=p_principal AND operation_id=p_operation_id;
 IF FOUND THEN
   IF existing.payload_hash<>p_hash OR existing.credits<>p_credits THEN
     RETURN QUERY SELECT false,NULL::uuid,'IDEMPOTENCY_CONFLICT'::text;
   ELSE
     RETURN QUERY SELECT true,existing.reservation_id,'REPLAY'::text;
   END IF;
   RETURN;
 END IF;
 IF p_day IS DISTINCT FROM (clock_timestamp() AT TIME ZONE 'UTC')::date THEN
   RETURN QUERY SELECT false,NULL::uuid,'INVALID_INPUT'::text; RETURN;
 END IF;
 INSERT INTO geoapify_disposable.budget(day_utc) VALUES(p_day) ON CONFLICT(day_utc) DO NOTHING;
 INSERT INTO geoapify_disposable.minute_budget(minute_utc) VALUES(minute_start) ON CONFLICT(minute_utc) DO NOTHING;
 SELECT 2400-spent INTO remaining FROM geoapify_disposable.budget WHERE day_utc=p_day;
 IF remaining<p_credits THEN
   RETURN QUERY SELECT false,NULL::uuid,'DAILY_BUDGET_EXCEEDED'::text; RETURN;
 END IF;
 SELECT 30-spent INTO remaining FROM geoapify_disposable.minute_budget WHERE minute_utc=minute_start;
 IF remaining<p_credits THEN
   RETURN QUERY SELECT false,NULL::uuid,'MINUTE_BUDGET_EXCEEDED'::text; RETURN;
 END IF;
 UPDATE geoapify_disposable.budget SET spent=spent+p_credits,updated_at=clock_timestamp() WHERE day_utc=p_day;
 UPDATE geoapify_disposable.minute_budget SET spent=spent+p_credits WHERE minute_utc=minute_start;
 INSERT INTO geoapify_disposable.reservation(principal,operation_id,payload_hash,day_utc,credits)
 VALUES(p_principal,p_operation_id,p_hash,p_day,p_credits)
 RETURNING geoapify_disposable.reservation.reservation_id INTO new_id;
 RETURN QUERY SELECT true,new_id,'RESERVED'::text;
END $$;
REVOKE ALL ON FUNCTION geoapify_disposable.reserve(text,text,text,integer,date) FROM PUBLIC;
COMMIT;
