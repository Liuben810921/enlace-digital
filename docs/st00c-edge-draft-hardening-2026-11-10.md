# ST-00C — endurecimiento del borrador Edge de staging, sin despliegue

Fecha: 2026-11-10. Autorización: modificar **solo GitHub**; staging, producción y datos reales fuera de alcance.

## Cambios de seguridad
- Se elimina el pseudo-identificador `unverified-proxy` y las cuotas `reg-ip` (3/h) y `login-ip` (20/15 min) que se compartían por todos los visitantes y producían denegación colectiva. **No se confía en X-Forwarded-For ni otros encabezados manipulables.**
- Se conserva el presupuesto global de emergencia (`staging-auth-global`, 300/min), los límites por teléfono (`reg-phone` 3/día y `login-phone` 10/15 min) y el bloqueo de credenciales en SQL. Si el RPC del limitador falla, la solicitud se deniega.
- Se sustituye `JSON.parse` directo por un escáner de gramática JSON con rechazo de claves duplicadas a cualquier profundidad (también equivalentes mediante escape Unicode), profundidad máxima 16 y detección de contenido sobrante, antes de invocar cualquier RPC. Se conserva UTF-8 estricto y máximo de 4096 bytes. El JSON válido se decodifica finalmente con `JSON.parse`.
- Se mantiene `ED_STAGING_CUSTOMER_AUTH_ENABLED` fail-closed, comprobación de proyecto exacto, origen HTTPS y clave pública; `service_role` permanece únicamente del lado servidor.

## Cobertura CI
- `tests/edge_auth_mock_test.ts`: pruebas de registro Cuba/extranjero, login, cierre de sesión, destinatarios y direcciones con aislamiento por cliente, errores RPC, límites, tamaños, JSON duplicado (plano, escapado, anidado), JSON malformado, profundidad, dos teléfonos concurrentes, bloqueo global. Se ejecutan con un cliente Supabase simulado, sin red, credenciales ni base de datos.
- `.github/workflows/staging-edge-draft-security.yml`: nuevo job offline Deno v2 y comprobaciones estáticas de seguridad; no utiliza secretos ni ejecuta llamadas Supabase.
- El CI PostgreSQL F6-B13–B30 permanece separado.

## Riesgos residuales y NO-GO
1. El límite global 300/min **sigue siendo compartido** por diseño como freno de emergencia; puede denegar temporalmente a usuarios legítimos bajo tráfico excesivo. Sin procedencia verificable del proxy no es seguro imponer cuotas IP individuales. Antes de habilitar acceso público debe aprobarse una estrategia de rate limiting resistente a abuso y denegación de servicio.
2. El límite por teléfono no previene por sí solo intentos distribuidos sobre múltiples teléfonos. SQL, observabilidad y pruebas integradas son obligatorios.
3. Rechazo de claves duplicadas no equivale al contrato léxico estricto ED-OP-v1 usado en fixtures sintéticos de idempotencia. El controlador de autenticación no procesa ese contrato.
4. La verificación de autenticación, gateway, RLS, sesiones, revocación, concurrencia y seguridad de `service_role` en staging real **no está autorizada ni ejecutada**.
5. No desplegar ni habilitar Edge, correo, pagos o pedidos. PR #3 debe permanecer borrador.

## Reversión
Revertir los commits de endurecimiento de `index.ts`, pruebas y workflow en GitHub, sin tocar staging ni producción. No hay migración de datos ni configuración que revertir.
