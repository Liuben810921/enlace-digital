\set ON_ERROR_STOP on
-- Disposable PostgreSQL only; independent of Supabase staging and customer data.
CREATE SCHEMA synthetic_email;
CREATE TABLE synthetic_email.tokens(
 id bigint generated always as identity primary key,
 client_id int not null, purpose text not null,
 created_at timestamptz not null, expires_at timestamptz not null,
 consumed_at timestamptz, attempts int not null default 0
);
CREATE FUNCTION synthetic_email.can_issue(p_client int,p_purpose text,p_at timestamptz)
RETURNS boolean LANGUAGE sql STABLE AS $$
 SELECT NOT EXISTS (SELECT 1 FROM synthetic_email.tokens
 WHERE client_id=p_client AND purpose=p_purpose AND created_at>p_at-interval '10 minutes')
$$;
CREATE FUNCTION synthetic_email.consume(p_id bigint,p_at timestamptz)
RETURNS boolean LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 UPDATE synthetic_email.tokens SET consumed_at=p_at
 WHERE id=p_id AND consumed_at IS NULL AND expires_at>p_at AND attempts<5;
 RETURN FOUND;
END $$;
DO $$
DECLARE t timestamptz:='2026-11-12 12:00:00+00'; id1 bigint; id2 bigint;
BEGIN
 INSERT INTO synthetic_email.tokens(client_id,purpose,created_at,expires_at)
 VALUES(1,'recuperar_clave',t,t+interval '20 minutes') RETURNING id INTO id1;
 IF synthetic_email.can_issue(1,'recuperar_clave',t+interval '1 minute') THEN RAISE EXCEPTION 'cooldown bypass'; END IF;
 IF NOT synthetic_email.consume(id1,t+interval '2 minutes') THEN RAISE EXCEPTION 'valid consume rejected'; END IF;
 IF synthetic_email.consume(id1,t+interval '3 minutes') THEN RAISE EXCEPTION 'replay accepted'; END IF;
 IF synthetic_email.can_issue(1,'recuperar_clave',t+interval '3 minutes') THEN RAISE EXCEPTION 'consumed token bypassed cooldown'; END IF;
 IF NOT synthetic_email.can_issue(1,'recuperar_clave',t+interval '11 minutes') THEN RAISE EXCEPTION 'cooldown failed to expire'; END IF;
 INSERT INTO synthetic_email.tokens(client_id,purpose,created_at,expires_at)
 VALUES(1,'recuperar_clave',t,t+interval '20 minutes') RETURNING id INTO id2;
 IF synthetic_email.consume(id2,t+interval '20 minutes') THEN RAISE EXCEPTION 'expired token accepted'; END IF;
 UPDATE synthetic_email.tokens SET attempts=5 WHERE id=id2;
 IF synthetic_email.consume(id2,t+interval '5 minutes') THEN RAISE EXCEPTION 'attempt limit bypass'; END IF;
 IF NOT synthetic_email.can_issue(1,'verificar_correo',t+interval '1 minute') THEN RAISE EXCEPTION 'purpose isolation failed'; END IF;
END $$;
SELECT 'cooldown_consumed_expiry_replay_attempt_limit_purpose_isolation' AS suite,'PASS' AS result;
