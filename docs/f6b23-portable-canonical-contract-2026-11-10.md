# F6-B23 — contrato de canonicalización portable (prototipo sintético)
Fecha: 2026-11-10. PR #3, rama audit/f6b21-identity-idempotency-20261110. NO DEPLOY.

## Gramática ED-OP-v1
Entrada JSONB con exactamente cuatro campos: `version` (literal `ED-OP-v1`), `action` (ASCII minúscula y guion bajo, 1–40), `currency` (tres letras ASCII mayúsculas), `amount_minor` (entero JSON no negativo, máximo 15 cifras, sin notación decimal ni exponente tras conversión JSONB). La clave de operación es ASCII alfanumérico, guion o guion bajo de 8–100 bytes. Se rechaza cualquier campo extra. La identidad no procede del JSON, sino del login sintético de PostgreSQL.

Secuencia exacta de bytes UTF-8 para SHA-256: `ED-OP-v1\n{action}\n{currency}\n{amount_minor}`, sin salto final. El contrato no admite texto libre Unicode: la política Unicode explícita es **rechazar** caracteres fuera del ASCII permitido, no normalizarlos de forma implícita. La comparación independiente de SHA-256 se efectúa en Python contra el digest generado en PostgreSQL.

Ejemplo: `ED-OP-v1\nreserve\nUSD\n12345` (los caracteres \n representan byte 0x0A). La igualdad de operaciones se determina por `(session_user, operation_key)`; un mismo identificador en otra identidad tiene espacio separado. Los payloads válidos con distinto orden JSON deben producir el mismo digest; los distintos importes, CONFLICT.

## Pruebas
Repetición, conflicto, aislamiento entre dos identidades, comparación SHA-256 independiente, invalidación de versiones, claves cortas, tipos incorrectos, importes negativos/fraccionarios o mayores de 15 cifras, Unicode no ASCII, action con salto de línea, currency en minúscula, campos extras, ausencia de campos, no consumo de clave tras error, rollback, SELECT/DELETE/TRUNCATE/SET ROLE y acceso por extraño denegados.

## Límites y NO-GO
Prototipo, no diseño final de dinero: no se ha definido la lista de monedas autorizadas, unidades fraccionarias por moneda, límites comerciales, semántica de negocio, reintentos de efectos externos, TTL, respuestas, JWT, gateways ni cuentas de clientes reales. JSONB puede normalizar formas de número antes de validarlas; esta gramática no garantiza rechazo de **toda** notación original ambigua (por ejemplo, exponentes transformados en entero). Para garantizarlo, validar bytes JSON originales antes de convertir a JSONB o usar parser contractual especializado. No se admite Unicode libre; si se necesitara, requeriría normalización explícita, versionada y pruebas interplataforma.

CI: pendiente de verificación del commit F6-B23. No afirmar PASS antes de revisar logs. Solo GitHub Actions con PostgreSQL 17 desechable; sin Supabase, staging, producción, datos reales/históricos, correos, pedidos ni despliegues. Requiere autorización independiente A para modificar staging y B para consultar datos históricos.
