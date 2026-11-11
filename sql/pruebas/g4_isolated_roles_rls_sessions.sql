-- G4 synthetic-only fixture. Disposable PostgreSQL 17, no Supabase credentials or data.
\set ON_ERROR_STOP on
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE ROLE g4_anon NOLOGIN NOBYPASSRLS;
CREATE ROLE g4_authenticated NOLOGIN NOBYPASSRLS;
CREATE ROLE g4_service NOLOGIN NOBYPASSRLS;
CREATE ROLE g4_owner NOLOGIN NOBYPASSRLS;
CREATE SCHEMA g4_synthetic;
REVOKE ALL ON SCHEMA g4_synthetic FROM PUBLIC;
GRANT USAGE ON SCHEMA g4_synthetic TO g4_owner,g4_service,g4_anon,g4_authenticated;
CREATE TABLE g4_synthetic.credentials (
 customer_id integer PRIMARY KEY, password_hash text NOT NULL,
 CHECK (password_hash LIKE '$2%')
);
CREATE TABLE g4_synthetic.sessions (
 token_hash text PRIMARY KEY, customer_id integer NOT NULL,
 expires_at timestamptz NOT NULL, revoked_at timestamptz
);
CREATE TABLE g4_synthetic.recipients (
 id integer PRIMARY KEY, customer_id integer NOT NULL, label text NOT NULL
);
ALTER TABLE g4_synthetic.credentials OWNER TO g4_owner;
ALTER TABLE g4_synthetic.sessions OWNER TO g4_owner;
ALTER TABLE g4_synthetic.recipients OWNER TO g4_owner;
ALTER TABLE g4_synthetic.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE g4_synthetic.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE g4_synthetic.recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE g4_synthetic.credentials FORCE ROW LEVEL SECURITY;
ALTER TABLE g4_synthetic.sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE g4_synthetic.recipients FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_cred ON g4_synthetic.credentials TO g4_owner USING (true) WITH CHECK (true);
CREATE POLICY owner_sessions ON g4_synthetic.sessions TO g4_owner USING (true) WITH CHECK (true);
CREATE POLICY owner_recipients ON g4_synthetic.recipients TO g4_owner USING (true) WITH CHECK (true);
INSERT INTO g4_synthetic.credentials VALUES (1,crypt('synthetic-one',gen_salt('bf'))),(2,crypt('synthetic-two',gen_salt('bf')));
INSERT INTO g4_synthetic.sessions VALUES
 (encode(digest('synthetic-session-one','sha256'),'hex'),1,now()+interval '1 hour',NULL),
 (encode(digest('synthetic-session-two','sha256'),'hex'),2,now()+interval '1 hour',NULL);
INSERT INTO g4_synthetic.recipients VALUES (11,1,'synthetic one'),(22,2,'synthetic two');
-- The privileged function validates the hashed session before scoped access.
CREATE FUNCTION g4_synthetic.recipient_label(p_token text,p_id integer)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER
SET search_path=pg_catalog,pg_temp AS $$
DECLARE v_customer integer; v_label text;
BEGIN
 SELECT customer_id INTO v_customer FROM g4_synthetic.sessions
 WHERE token_hash=encode(public.digest(p_token,'sha256'),'hex')
 AND revoked_at IS NULL AND expires_at>now();
 IF v_customer IS NULL THEN RAISE EXCEPTION 'invalid session' USING ERRCODE='28000'; END IF;
 SELECT label INTO v_label FROM g4_synthetic.recipients
 WHERE id=p_id AND customer_id=v_customer;
 RETURN v_label;
END $$;
ALTER FUNCTION g4_synthetic.recipient_label(text,integer) OWNER TO g4_owner;
REVOKE ALL ON FUNCTION g4_synthetic.recipient_label(text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION g4_synthetic.recipient_label(text,integer) TO g4_service;
DO $$
DECLARE r text;
BEGIN
 FOREACH r IN ARRAY ARRAY['g4_anon','g4_authenticated'] LOOP
  IF has_table_privilege(r,'g4_synthetic.credentials','SELECT')
   OR has_table_privilege(r,'g4_synthetic.sessions','SELECT')
   OR has_table_privilege(r,'g4_synthetic.recipients','SELECT')
   OR has_function_privilege(r,'g4_synthetic.recipient_label(text,integer)','EXECUTE')
  THEN RAISE EXCEPTION 'public privilege exposure: %',r; END IF;
 END LOOP;
 IF NOT (SELECT bool_and(relrowsecurity AND relforcerowsecurity)
  FROM pg_class WHERE oid IN ('g4_synthetic.credentials'::regclass,
  'g4_synthetic.sessions'::regclass,'g4_synthetic.recipients'::regclass))
 THEN RAISE EXCEPTION 'RLS missing'; END IF;
 IF (SELECT count(*) FROM g4_synthetic.credentials WHERE password_hash IN ('synthetic-one','synthetic-two'))<>0
 THEN RAISE EXCEPTION 'plaintext credential'; END IF;
 IF (SELECT count(*) FROM g4_synthetic.sessions WHERE token_hash IN ('synthetic-session-one','synthetic-session-two'))<>0
 THEN RAISE EXCEPTION 'plaintext token'; END IF;
 IF g4_synthetic.recipient_label('synthetic-session-one',11)<>'synthetic one'
 OR g4_synthetic.recipient_label('synthetic-session-two',22)<>'synthetic two'
 OR g4_synthetic.recipient_label('synthetic-session-one',22) IS NOT NULL
 OR g4_synthetic.recipient_label('synthetic-session-two',11) IS NOT NULL
 THEN RAISE EXCEPTION 'cross-customer isolation failure'; END IF;
 BEGIN
  PERFORM g4_synthetic.recipient_label('invalid-token',11);
  RAISE EXCEPTION 'invalid session accepted';
 EXCEPTION WHEN invalid_authorization_specification THEN NULL;
 END;
 UPDATE g4_synthetic.sessions SET revoked_at=now()
 WHERE token_hash=encode(digest('synthetic-session-one','sha256'),'hex');
 BEGIN
  PERFORM g4_synthetic.recipient_label('synthetic-session-one',11);
  RAISE EXCEPTION 'revoked session accepted';
 EXCEPTION WHEN invalid_authorization_specification THEN NULL;
 END;
 UPDATE g4_synthetic.sessions SET expires_at=now()-interval '1 minute'
 WHERE token_hash=encode(digest('synthetic-session-two','sha256'),'hex');
 BEGIN
  PERFORM g4_synthetic.recipient_label('synthetic-session-two',22);
  RAISE EXCEPTION 'expired session accepted';
 EXCEPTION WHEN invalid_authorization_specification THEN NULL;
 END;
 RAISE NOTICE 'G4 synthetic ACL, RLS, hashing, isolation, revoked and expired session checks PASS';
END $$;
ROLLBACK;
