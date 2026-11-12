\set ON_ERROR_STOP on
-- SYNTHETIC ONLY. No real tokens, users, or Supabase access.
CREATE SCHEMA token_guard;
CREATE TABLE token_guard.tokens (
 token_hash text PRIMARY KEY,
 expires_at timestamptz NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
 consumed boolean NOT NULL DEFAULT false
);
CREATE FUNCTION token_guard.verify_and_consume(p_hash text,p_candidate text,p_expected text,p_now timestamptz)
RETURNS boolean LANGUAGE plpgsql SET search_path='' AS $$
DECLARE t token_guard.tokens%ROWTYPE;
BEGIN
 SELECT * INTO t FROM token_guard.tokens WHERE token_hash=p_hash FOR UPDATE;
 IF NOT FOUND OR t.consumed OR t.expires_at<=p_now OR t.attempts>=5 THEN RETURN false; END IF;
 IF p_candidate IS DISTINCT FROM p_expected THEN
   UPDATE token_guard.tokens SET attempts=least(attempts+1,5) WHERE token_hash=p_hash;
   RETURN false;
 END IF;
 UPDATE token_guard.tokens SET consumed=true WHERE token_hash=p_hash;
 RETURN true;
END $$;
DO $$
DECLARE now_at timestamptz:='2026-11-12 12:00:00+00'; i int;
BEGIN
 INSERT INTO token_guard.tokens VALUES('tok1',now_at+interval '20 minutes',0,false);
 FOR i IN 1..5 LOOP
  IF token_guard.verify_and_consume('tok1','wrong','correct',now_at) THEN RAISE EXCEPTION 'invalid token accepted'; END IF;
  IF (SELECT attempts FROM token_guard.tokens WHERE token_hash='tok1')<>i THEN RAISE EXCEPTION 'attempt not counted'; END IF;
 END LOOP;
 IF token_guard.verify_and_consume('tok1','correct','correct',now_at) THEN RAISE EXCEPTION 'five-attempt lock bypassed'; END IF;
 IF (SELECT attempts FROM token_guard.tokens WHERE token_hash='tok1')<>5 THEN RAISE EXCEPTION 'attempt overflow'; END IF;
 INSERT INTO token_guard.tokens VALUES('tok2',now_at+interval '20 minutes',0,false);
 IF NOT token_guard.verify_and_consume('tok2','correct','correct',now_at) THEN RAISE EXCEPTION 'valid token rejected'; END IF;
 IF token_guard.verify_and_consume('tok2','correct','correct',now_at) THEN RAISE EXCEPTION 'replay accepted'; END IF;
 INSERT INTO token_guard.tokens VALUES('tok4',now_at+interval '20 minutes',0,false);
 IF token_guard.verify_and_consume('tok4','wrong','correct',now_at) THEN RAISE EXCEPTION 'wrong candidate accepted'; END IF;
 IF (SELECT consumed FROM token_guard.tokens WHERE token_hash='tok4') THEN RAISE EXCEPTION 'invalid candidate consumed token'; END IF;
 IF NOT token_guard.verify_and_consume('tok4','correct','correct',now_at) THEN RAISE EXCEPTION 'valid candidate rejected after one failure'; END IF;
 IF (SELECT attempts FROM token_guard.tokens WHERE token_hash='tok4')<>1 THEN RAISE EXCEPTION 'attempt history lost'; END IF;
 INSERT INTO token_guard.tokens VALUES('tok5',now_at+interval '20 minutes',0,false);
 IF token_guard.verify_and_consume('tok5',NULL,'correct',now_at) THEN RAISE EXCEPTION 'NULL candidate accepted'; END IF;
 IF (SELECT attempts FROM token_guard.tokens WHERE token_hash='tok5')<>1 THEN RAISE EXCEPTION 'NULL candidate not counted'; END IF;
 INSERT INTO token_guard.tokens VALUES('tok3',now_at,0,false);
 IF token_guard.verify_and_consume('tok3','correct','correct',now_at) THEN RAISE EXCEPTION 'expired token accepted'; END IF;
 IF token_guard.verify_and_consume('missing','correct','correct',now_at) THEN RAISE EXCEPTION 'unknown token accepted'; END IF;
END $$;
SELECT 'atomic_attempts_lock_replay_expiry' AS suite,'PASS' AS result;
