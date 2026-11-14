-- Disposable PostgreSQL-only transactional quote gate. Independent of Supabase.
BEGIN;
DROP SCHEMA IF EXISTS ed_quote_race CASCADE;
CREATE SCHEMA ed_quote_race;
CREATE TABLE ed_quote_race.context(
 id text PRIMARY KEY, cart_version bigint NOT NULL DEFAULT 1,
 destination_version bigint NOT NULL DEFAULT 1, route_version bigint NOT NULL DEFAULT 1,
 warehouses_version bigint NOT NULL DEFAULT 1, assignments_version bigint NOT NULL DEFAULT 1,
 tariff_version bigint NOT NULL DEFAULT 1
);
CREATE TABLE ed_quote_race.quotes(
 id text PRIMARY KEY, context_id text NOT NULL REFERENCES ed_quote_race.context(id),
 cart_version bigint NOT NULL, destination_version bigint NOT NULL,
 route_version bigint NOT NULL, warehouses_version bigint NOT NULL,
 assignments_version bigint NOT NULL, tariff_version bigint NOT NULL,
 status text NOT NULL DEFAULT 'prepared' CHECK(status IN ('prepared','confirmed','rejected'))
);
CREATE TABLE ed_quote_race.audit(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,action text NOT NULL,quote_id text,field text);
INSERT INTO ed_quote_race.context(id) VALUES('fictional-cart-a'),('fictional-cart-b');
CREATE OR REPLACE FUNCTION ed_quote_race.prepare(p_id text,p_context text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO ed_quote_race.quotes(id,context_id,cart_version,destination_version,route_version,warehouses_version,assignments_version,tariff_version)
 SELECT p_id,id,cart_version,destination_version,route_version,warehouses_version,assignments_version,tariff_version
 FROM ed_quote_race.context WHERE id=p_context FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'missing_context'; END IF;
 INSERT INTO ed_quote_race.audit(action,quote_id) VALUES('prepare',p_id);
END $$;
CREATE OR REPLACE FUNCTION ed_quote_race.mutate(p_context text,p_field text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
 IF p_field NOT IN ('cart','destination','route','warehouses','assignments','tariff') THEN RAISE EXCEPTION 'invalid_field'; END IF;
 EXECUTE format('UPDATE ed_quote_race.context SET %I=%I+1 WHERE id=$1',p_field||'_version',p_field||'_version') USING p_context;
 IF NOT FOUND THEN RAISE EXCEPTION 'missing_context'; END IF;
 INSERT INTO ed_quote_race.audit(action,field) VALUES('mutate',p_field);
END $$;
CREATE OR REPLACE FUNCTION ed_quote_race.confirm(p_id text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE q ed_quote_race.quotes%ROWTYPE; c ed_quote_race.context%ROWTYPE;
BEGIN
 SELECT * INTO q FROM ed_quote_race.quotes WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RETURN 'unknown_quote'; END IF;
 IF q.status<>'prepared' THEN RETURN 'already_finalized'; END IF;
 SELECT * INTO c FROM ed_quote_race.context WHERE id=q.context_id FOR SHARE;
 IF (q.cart_version,q.destination_version,q.route_version,q.warehouses_version,q.assignments_version,q.tariff_version)
 IS DISTINCT FROM
 (c.cart_version,c.destination_version,c.route_version,c.warehouses_version,c.assignments_version,c.tariff_version) THEN
 UPDATE ed_quote_race.quotes SET status='rejected' WHERE id=p_id;
 INSERT INTO ed_quote_race.audit(action,quote_id) VALUES('reject',p_id);
 RETURN 'stale';
 END IF;
 UPDATE ed_quote_race.quotes SET status='confirmed' WHERE id=p_id;
 INSERT INTO ed_quote_race.audit(action,quote_id) VALUES('confirm',p_id);
 RETURN 'confirmed';
END $$;
REVOKE ALL ON SCHEMA ed_quote_race FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA ed_quote_race FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ed_quote_race FROM PUBLIC;
COMMIT;
