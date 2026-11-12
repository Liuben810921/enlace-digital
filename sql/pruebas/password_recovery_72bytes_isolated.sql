\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA enlace_auth;
CREATE TABLE enlace_auth.tokens(id bigint generated always as identity primary key,token_hash text unique not null,consumido boolean default false);
CREATE TABLE enlace_auth.sessions(id bigint generated always as identity primary key,revocada boolean default false);
INSERT INTO enlace_auth.sessions DEFAULT VALUES;
CREATE FUNCTION enlace_auth.recover_synthetic(p_token text,p_password text) RETURNS boolean LANGUAGE plpgsql SET search_path='' AS $$
DECLARE valid boolean;
BEGIN
 IF p_password IS NULL OR length(p_password) NOT BETWEEN 8 AND 128 OR octet_length(p_password)>72 THEN RETURN false; END IF;
 SELECT true INTO valid FROM enlace_auth.tokens WHERE token_hash=p_token AND NOT consumido FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM crypt(p_password,gen_salt('bf',12));
 UPDATE enlace_auth.tokens SET consumido=true WHERE token_hash=p_token;
 UPDATE enlace_auth.sessions SET revocada=true WHERE NOT revocada;
 RETURN true;
END $$;
CREATE TABLE test_results(label text,passed boolean);
DO $$
DECLARE pw text; accepted boolean; tok text; i int:=0; r record;
BEGIN
 FOR r IN SELECT * FROM (VALUES
 ('ascii_8',repeat('a',8),true),('ascii_72',repeat('a',72),true),
 ('ascii_73',repeat('a',73),false),('unicode_72_bytes',repeat('€',24),true),
 ('unicode_75_bytes',repeat('€',25),false),('ascii_7',repeat('a',7),false),
 ('ascii_129',repeat('a',129),false)) AS v(label,password,expected)
 LOOP
  i:=i+1;tok:=lpad(i::text,64,'0');
  INSERT INTO enlace_auth.tokens(token_hash) VALUES(tok);
  UPDATE enlace_auth.sessions SET revocada=false;
  accepted:=enlace_auth.recover_synthetic(tok,r.password);
  IF accepted IS DISTINCT FROM r.expected THEN RAISE EXCEPTION 'Unexpected outcome %',r.label; END IF;
  IF NOT r.expected AND (SELECT consumido FROM enlace_auth.tokens WHERE token_hash=tok) THEN RAISE EXCEPTION 'Rejected token consumed %',r.label; END IF;
  IF NOT r.expected AND (SELECT bool_or(revocada) FROM enlace_auth.sessions) THEN RAISE EXCEPTION 'Rejected attempt revoked sessions %',r.label; END IF;
  IF r.expected AND NOT (SELECT bool_and(revocada) FROM enlace_auth.sessions) THEN RAISE EXCEPTION 'Valid attempt did not revoke sessions %',r.label; END IF;
  INSERT INTO test_results VALUES(r.label,true);
 END LOOP;
 IF enlace_auth.recover_synthetic(lpad('1',64,'0'),repeat('a',8)) THEN RAISE EXCEPTION 'Replay accepted'; END IF;
 INSERT INTO test_results VALUES('replay_denied',true);
 IF enlace_auth.recover_synthetic(lpad('999',64,'0'),repeat('a',8)) THEN RAISE EXCEPTION 'Unknown token accepted'; END IF;
 INSERT INTO test_results VALUES('unknown_token_denied',true);
END $$;
SELECT * FROM test_results ORDER BY label;
