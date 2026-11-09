# Propuesta de seguridad — intentos de tokens y staging

**Estado:** preparada, NO aplicada en producción. No existe staging independiente en la organización Supabase conectada.

## Diagnóstico confirmado
La función privada de consumo selecciona por hash exacto, `consumido_en IS NULL`, `expira_en > now()` e `intentos < 5`, pero nunca incrementa `intentos`. Una solicitud con hash incorrecto no identifica de forma segura un token al cual sumar intentos. Incrementar el contador de un token mediante un identificador proporcionado por el usuario permitiría dirigir ataques a tokens ajenos.

La función pública `enlace-correo-flujos` aplica un límite de **10 intentos en 900 segundos por hash de IP**, antes de llamar a la RPC. Esto es una defensa real pero no suficiente contra direcciones IP rotativas. La RPC de limitación tiene `SECURITY DEFINER`: verificar que `anon` y `authenticated` NO puedan invocarla con parámetros arbitrarios antes de considerarla robusta.

## Corrección propuesta, sin enumeración
1. Mantener respuestas idénticas para token inexistente, caducado, usado o bloqueado; no devolver identidad de cuenta ni token.
2. Aplicar antes de la búsqueda un límite atómico de consumo por origen confiable y ventana temporal, con límites adicionales por contexto de riesgo; no confiar en `x-forwarded-for` sin una cadena de proxies verificada.
3. Restringir `ed_cliente_limite_privado` al servicio interno o crear una función dedicada con límites fijados en servidor; ningún cliente debe elegir `p_clave`, `p_max` ni `p_ventana_seg`.
4. Conservar `intentos < 5` como defensa complementaria para tokens identificados por hash exacto, o retirar ese control engañoso después de demostrar que la limitación previa cubre el riesgo. Nunca aumentar intentos de un token basándose en un identificador no autenticado.
5. Probar concurrencia y transacciones en staging antes de migrar; mantener todos los interruptores de producción apagados.

## Plan de staging
- Proyecto separado, base vacía, esquema migrado sin datos reales, credenciales de prueba propias.
- Ejecutar `sql/staging_correo_preflight.sql` como preflight, siempre con ROLLBACK.
- Construir transacciones de prueba con registros ficticios y reversión explícita: emitir, enfriar, caducar, consumir una vez, rechazar repetición y revocar sesiones.
- No conectar SMTP real ni enviar correos durante las pruebas SQL.
- Promover solo cambios demostrados con evidencia y revisión de permisos.
