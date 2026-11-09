-- SOLO PARA PROYECTO STAGING INDEPENDIENTE. NUNCA PRODUCCION.
-- Ejecutar como una transaccion en staging; toda alteracion se revierte.
BEGIN;
DO $$
DECLARE c int; n int; e boolean; x boolean;
BEGIN
 SELECT count(*) INTO c FROM enlace_auth.cliente_credenciales;
 IF c<>0 THEN RAISE EXCEPTION 'Staging must have zero existing customers'; END IF;
 SELECT count(*) INTO n FROM enlace_auth.cliente_correo_tokens;
 IF n<>0 THEN RAISE EXCEPTION 'Staging must have zero existing tokens'; END IF;
 SELECT envios_habilitados INTO e FROM enlace_auth.configuracion_correo WHERE clave='principal';
 IF e IS DISTINCT FROM false THEN RAISE EXCEPTION 'Staging baseline must have mail disabled'; END IF;
 -- Real function calls with switches off: no client or token can be modified.
 SELECT public.ed_correo_emitir_token_servicio('recuperar_clave','+19995550001','nobody@example.invalid',repeat('a',64),NULL) INTO x;
 IF x IS DISTINCT FROM false THEN RAISE EXCEPTION 'Issuance fail-closed regression'; END IF;
 SELECT public.ed_correo_consumir_token_servicio(repeat('a',64),'recuperar_clave','NotARealPassword2026!') INTO x;
 IF x IS DISTINCT FROM false THEN RAISE EXCEPTION 'Consumption fail-closed regression'; END IF;
END $$;
ROLLBACK;

-- Próxima fase: crear cliente y sesión ficticios exclusivamente en staging,
-- activar solo configuración de staging dentro de BEGIN/ROLLBACK y probar
-- emisión, expiración, cooldown, consumo único y revocación con funciones reales.
-- No copiar clientes, credenciales ni secretos de producción.
