# Intermediario de rutas — núcleo offline fail-closed, 24 de noviembre de 2026

## Rama y alcance
- Rama: `fix/delivery-batch-deactivation-order-20261120`.
- La entrada `supabase/functions/ed-staging-geoapify-route/index.ts` delega en `gateway.mjs`, un núcleo importable por Node y Deno.
- Solo preparación de código y pruebas offline. Sin despliegue, credenciales, conexiones de Supabase, transporte a Geoapify ni tarifas.

## Controles implementados
- Flags de staging y de red apagados por defecto. Sin adaptadores de autenticación o reserva, la entrada responde `PENDIENTE`.
- Método POST, JSON estricto, cuerpo máximo de 16 KiB y allowlist exacta de campos; requiere clave idempotente por operación.
- CORS opcional con coincidencia exacta de `ED_STAGING_ALLOWED_ORIGIN`; no se usa como autenticación.
- Hash SHA-256 canónico derivado en servidor de coordenadas, IDs, revisión y operación.
- Identidad admitida solo si un adaptador futuro la produce tras verificación de Supabase Auth y ACL privada.
- Reserva admitida solo con confirmación de RPC PostgreSQL, operación, usuario, revisión, hash y contexto confiable coincidentes.
- Incluso tras una reserva sintética válida, la respuesta se mantiene `PENDIENTE / PROVIDER_NOT_CONNECTED`, sin ruta ni tarifa. No existe llamada `fetch` a Geoapify.

## Evidencia offline
- `node --test supabase/functions/ed-staging-geoapify-route/gateway.test.mjs`: **14/14 PASS**.
- Se comprobó la entrada `index.ts` con un adaptador local de `Deno.serve`: con variables vacías responde `STAGING_GEOAPIFY_DISABLED`; con ambas flags en `true`, sigue en `GATEWAY_NOT_CONFIGURED` porque el código de servidor no suministra adaptadores.
- `node --check` pasó para el núcleo y la suite.
- Deno no está instalado; no se afirma ejecución ni empaquetado real de Supabase Edge.

## Bloqueos para la siguiente fase
- Falta identificar y validar el contrato real de ACL de administradores en el proyecto staging.
- Falta implementar un adaptador servidor que verifique el JWT contra Supabase Auth y consulte la ACL privada sin aceptar roles del navegador.
- Falta instalar en la base staging una RPC de reserva atómica ya revisada, vinculada a contexto confiable, idempotencia, hash y presupuesto. Los SQL de `experiments/havana-delivery-quote/postgres-disposable` son prototipos desechables; no están instalados ni son evidencia de la base real.
- No habilitar flags, desplegar ni hacer llamadas reales hasta autorización explícita de esa operación y confirmación del proyecto/contrato staging. No almacenar claves en GitHub Pages.
