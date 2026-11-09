-- ENLACE DIGITAL / STAGING ONLY / NEVER PRODUCTION
-- Run only in the Supabase SQL Editor of project xqahthghvozeigbojhyi
-- IMPORTANT: entire script must execute in ONE database session.
-- Expected: cooldown-after-consumption currently FAILS (known static finding).
-- No SMTP or Edge Functions exist in staging. No COMMIT anywhere.
BEGIN;
SET LOCAL statement_timeout = '60s';
CREATE TEMP TABLE ed_test_results (
  test_name text PRIMARY KEY,
  passed boolean NOT NULL,
  detail text NOT NULL
) ON COMMIT DROP;

DO $test$
DECLARE
  v_ok boolean;
  v_count integer;
  v_revoked integer;
  v_hash text;
BEGIN
  -- Preflight: never operate outside the known staging database.
  IF current_database() IS NULL OR
     to_regclass('public.clientes_oficiales') IS NULL OR
     to_regclass('enlace_auth.cliente_correo_tokens') IS NULL THEN
    RAISE EXCEPTION 'Required staging schema is absent';
  END IF;
  IF EXISTS (SELECT 1 FROM public.clientes_oficiales)
     OR EXISTS (SELECT 1 FROM enlace_auth.cliente_credenciales)
     OR EXISTS (SELECT 1 FROM enlace_auth.cliente_correo_tokens)
     OR EXISTS (SELECT 1 FROM enlace_auth.cliente_sesiones) THEN
    RAISE EXCEPTION 'Staging is not empty: abort without touching existing data';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM enlace_auth.configuracion_correo
    WHERE clave='principal' AND NOT envios_habilitados
      AND NOT verificacion_habilitada AND NOT recuperacion_habilitada
  ) THEN RAISE EXCEPTION 'Staging flags are not all disabled'; END IF;

  -- Fictional data only. No emails are dispatched by these SQL functions.
  INSERT INTO public.clientes_oficiales(numero,codigo,nombre,residencia)
  VALUES (910001,'STG-910001','Cliente ficticio verificacion','cuba'),
         (910002,'STG-910002','Cliente ficticio recuperacion','extranjero'),
         (910003,'STG-910003','Cliente ficticio caducidad','cuba');
  INSERT INTO enlace_auth.cliente_credenciales
    (cliente_numero,telefono_e164,password_hash,correo_recuperacion,correo_verificado_en)
  VALUES
    (910001,'+19995551001','STAGING_NOT_REAL_PASSWORD','verify@example.invalid',NULL),
    (910002,'+19995551002','STAGING_NOT_REAL_PASSWORD','recover@example.invalid',now()),
    (910003,'+19995551003','STAGING_NOT_REAL_PASSWORD','expired@example.invalid',now());
  INSERT INTO enlace_auth.cliente_sesiones(cliente_numero,token_hash,expira_en)
  VALUES
    (910001,repeat('1',64),now()+interval '1 hour'),
    (910002,repeat('2',64),now()+interval '1 hour');

  -- The flags are enabled ONLY within this uncommitted transaction.
  UPDATE enlace_auth.configuracion_correo
     SET envios_habilitados=true,verificacion_habilitada=true,
         recuperacion_habilitada=true
   WHERE clave='principal';

  v_ok := public.ed_correo_emitir_token_servicio(
    'verificar_correo','+19995551001','verify@example.invalid',repeat('a',64),repeat('1',64));
  INSERT INTO ed_test_results VALUES
    ('01_verification_issue',coalesce(v_ok,false),'Expected true');

  v_ok := public.ed_correo_emitir_token_servicio(
    'verificar_correo','+19995551001','verify@example.invalid',repeat('b',64),repeat('1',64));
  INSERT INTO ed_test_results VALUES
    ('02_pending_cooldown',v_ok IS FALSE,'Expected false for immediate repeat');

  v_ok := public.ed_correo_consumir_token_servicio(repeat('a',64),'verificar_correo',NULL);
  INSERT INTO ed_test_results VALUES
    ('03_verification_consume',coalesce(v_ok,false),'Expected true');

  SELECT correo_verificado_en IS NOT NULL INTO v_ok
    FROM enlace_auth.cliente_credenciales WHERE cliente_numero=910001;
  INSERT INTO ed_test_results VALUES
    ('04_email_marked_verified',coalesce(v_ok,false),'Expected verified timestamp');

  v_ok := public.ed_correo_consumir_token_servicio(repeat('a',64),'verificar_correo',NULL);
  INSERT INTO ed_test_results VALUES
    ('05_verification_replay',v_ok IS FALSE,'Expected false');

  v_ok := public.ed_correo_emitir_token_servicio(
    'recuperar_clave','+19995551002','recover@example.invalid',repeat('c',64),NULL);
  INSERT INTO ed_test_results VALUES
    ('06_recovery_issue',coalesce(v_ok,false),'Expected true');

  v_ok := public.ed_correo_consumir_token_servicio(
    repeat('c',64),'recuperar_clave','FicticiaSegura2026!');
  INSERT INTO ed_test_results VALUES
    ('07_recovery_consume',coalesce(v_ok,false),'Expected true');

  SELECT count(*) INTO v_revoked
    FROM enlace_auth.cliente_sesiones
   WHERE cliente_numero=910002 AND revocada_en IS NOT NULL;
  INSERT INTO ed_test_results VALUES
    ('08_session_revoked',v_revoked=1,'Expected exactly one revoked session');

  SELECT password_hash INTO v_hash
    FROM enlace_auth.cliente_credenciales WHERE cliente_numero=910002;
  INSERT INTO ed_test_results VALUES
    ('09_password_rehashed',v_hash <> 'STAGING_NOT_REAL_PASSWORD' AND
      v_hash = extensions.crypt('FicticiaSegura2026!',v_hash),
      'Expected bcrypt verification');

  v_ok := public.ed_correo_consumir_token_servicio(
    repeat('c',64),'recuperar_clave','FicticiaSegura2026!');
  INSERT INTO ed_test_results VALUES
    ('10_recovery_replay',v_ok IS FALSE,'Expected false');

  -- Deliberately test whether cooldown survives consumption.
  -- Static audit predicts this assertion FAILS in current code.
  v_ok := public.ed_correo_emitir_token_servicio(
    'recuperar_clave','+19995551002','recover@example.invalid',repeat('d',64),NULL);
  INSERT INTO ed_test_results VALUES
    ('11_cooldown_after_consumption',v_ok IS FALSE,
     'Expected false within 10 minutes even after token was consumed');

  v_ok := public.ed_correo_emitir_token_servicio(
    'recuperar_clave','+19995551003','expired@example.invalid',repeat('e',64),NULL);
  INSERT INTO ed_test_results VALUES
    ('12_expiry_issue',coalesce(v_ok,false),'Expected true');

  UPDATE enlace_auth.cliente_correo_tokens
     SET expira_en=now()-interval '1 second'
   WHERE token_hash=repeat('e',64);
  v_ok := public.ed_correo_consumir_token_servicio(
    repeat('e',64),'recuperar_clave','FicticiaSegura2026!');
  INSERT INTO ed_test_results VALUES
    ('13_expired_rejected',v_ok IS FALSE,'Expected false');

  -- Separate fictional rate-limit key, no live client/IP.
  v_ok := public.ed_cliente_limite_privado('staging-only-910001',2,60);
  INSERT INTO ed_test_results VALUES
    ('14_rate_first',coalesce(v_ok,false),'Expected true');
  v_ok := public.ed_cliente_limite_privado('staging-only-910001',2,60);
  INSERT INTO ed_test_results VALUES
    ('15_rate_second',coalesce(v_ok,false),'Expected true');
  v_ok := public.ed_cliente_limite_privado('staging-only-910001',2,60);
  INSERT INTO ed_test_results VALUES
    ('16_rate_third_rejected',v_ok IS FALSE,'Expected false');

  INSERT INTO ed_test_results VALUES
    ('17_anon_private_denied',
      NOT has_function_privilege('anon',
        'enlace_auth.ed_consumir_token_correo_privado(text,text,text)','EXECUTE'),
      'Expected false privilege');
  INSERT INTO ed_test_results VALUES
    ('18_authenticated_private_denied',
      NOT has_function_privilege('authenticated',
        'enlace_auth.ed_emitir_token_correo_privado(text,text,text,text,text)','EXECUTE'),
      'Expected false privilege');
END
$test$;

-- Record these results externally BEFORE the ROLLBACK.
SELECT test_name,CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END AS result,detail
FROM ed_test_results ORDER BY test_name;
SELECT count(*) FILTER (WHERE passed) AS passed,
       count(*) FILTER (WHERE NOT passed) AS failed
FROM ed_test_results;

-- CRITICAL: this line is mandatory. Never replace with COMMIT.
ROLLBACK;

-- After the rollback, execute separately in staging:
-- SELECT (SELECT count(*) FROM public.clientes_oficiales) clients,
--        (SELECT count(*) FROM enlace_auth.cliente_credenciales) credentials,
--        (SELECT count(*) FROM enlace_auth.cliente_correo_tokens) tokens,
--        (SELECT count(*) FROM enlace_auth.cliente_sesiones) sessions,
--        envios_habilitados,verificacion_habilitada,recuperacion_habilitada
-- FROM enlace_auth.configuracion_correo WHERE clave='principal';
