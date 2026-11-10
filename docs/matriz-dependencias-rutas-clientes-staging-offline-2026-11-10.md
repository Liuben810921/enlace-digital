# Matriz de dependencias y pruebas funcionales futuras — staging (auditoría offline)

Fecha: 2026-11-10. Base autorizada: `4f119e80ade2c04129f82bf8b88c33c346164547`. Fuentes GitHub: `supabase/functions/enlace-cliente-auth-staging/index.ts`, `sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql`, `sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql`, `docs/conciliacion-rpc-controlador-staging-offline-2026-11-10.md`. Esta auditoría NO consulta Supabase, no ejecuta SQL ni activa servicios. El SQL v4 es propuesta histórica, **no una migración aplicable al staging actual**: su preflight exige ausencia de columnas/tablas que la auditoría anterior ya observó presentes.

## Dependencias reales del código y puertas de habilitación
| Ruta | RPC / acceso | Dependencias de esquema y seguridad | Prueba funcional futura, no ejecutada |
|---|---|---|---|
| Todas las acciones | `ed_cliente_limite_privado` | `service_role` EXECUTE, ventana de rate limit, IP y límite global; flag `ED_STAGING_CUSTOMER_AUTH_ENABLED`, origen y publishable key | F01: servicio apagado devuelve 503; origen/clave inválidos rechazados; 429 al exceder límites; fallos de RPC deniegan |
| register | `ed_cliente_registrar_residencia_privado` -> `ed_cliente_registrar_privado` en SQL propuesto | `clientes_oficiales`, `enlace_auth.cliente_credenciales`, secuencia de numero, pgcrypto; wrapper DEFINER; residencia Cuba con dirección | F02: Cuba con dirección válida; F03: extranjero sin dirección cubana; F04: duplicados, carrera de teléfono, rollback de registro parcial |
| login | `ed_cliente_login_privado` | credenciales, sesiones, crypt, bloqueo por intentos, hash SHA-256 de token | F05: contraseña válida/incorrecta, cooldown, bloqueo, token 30 días, sesiones independientes |
| session/logout | `ed_cliente_sesion_privada` | credenciales/sesiones/cliente, expiración y revocación | F06: token inválido/expirado/revocado; logout no reutilizable; sesión persistente |
| address-save | `ed_cliente_sesion_privada`, `ed_cliente_direccion_privada` | pertenencia a cliente, residencia Cuba, validación de dirección | F07: solo residente Cuba actualiza su dirección habitual; rechazo extranjero |
| recipient-save | `ed_cliente_sesion_privada` + `db.from("clientes_destinatarios")` | `service_role` DML; `cliente_numero` FK integer; ID bigint; update filtrado por id y cliente | F08: crear/editar propios; F09: ID ajeno rechazado sin fuga |
| delivery-location-save | `ed_cliente_sesion_privada` + `db.from("clientes_direcciones_entrega")` | `service_role` DML; coincidencia de provincia/municipio/barrio/dirección, lookup y update filtrados por cliente | F10: deduplicación, actualización propia, no mezcla entre clientes; F11: dos escrituras simultáneas |
| profile | `ed_cliente_sesion_privada` + SELECT destinatarios/direcciones | `service_role` SELECT; filtros `cliente_numero`, límites 100 y 50 | F12: aislamiento y paginación/limitación, sin exposición de otros clientes |
| Correo | Ninguna llamada RPC directa en este controlador | Funciones `ed_correo_*` y `enlace_auth.ed_*token_correo_privado` en metadatos previos; posibles otros consumidores | F13: inventario de consumidores antes de considerar eliminación; no enviar correo |

## Riesgos de seguridad y compatibilidad detectados
- **R01 — propuesta v4 incompatible con staging observado:** `staging_esquema_unico_v4_no_ejecutar.sql` abortaría si ya existen destinatarios/direcciones o columnas de clientes. El staging observado en P01–P08 sí las contiene. **NO-GO** ejecutar el borrador; futura migración incremental exige nueva inspección y autorización.
- **R02 — función interna de registro:** `ed_cliente_registrar_privado` es dependencia del wrapper `SECURITY DEFINER` en el borrador; ausencia de EXECUTE directo de service_role es intencional. No conceder permisos ni borrar función.
- **R03 — claves y límites:** `SUPABASE_SERVICE_ROLE_KEY` se obtiene solo del entorno de la función; la publishable key y CORS no sustituyen autenticación, autorización ni rate limiting. No registrar secretos.
- **R04 — servicio desactivado:** flag de autenticación por defecto falso y proyecto esperado fijo; las pruebas offline no demuestran configuración o despliegue.
- **R05 — validación telefónica:** registro/login aceptan E.164; destinatarios/direcciones de entrega aceptan solo 8 dígitos cubanos o +53. Alinear explícitamente UI y servidor; no asumir aceptación de teléfono internacional para destinatario cubano.
- **R06 — bigint en JavaScript:** ID de destinatarios/direcciones son bigint en BD pero `validId` y validaciones exigen `Number.isSafeInteger`; valores > MAX_SAFE_INTEGER requieren contrato seguro antes de operar.
- **R07 — deduplicación concurrente:** `delivery-location-save` realiza SELECT seguido de INSERT/UPDATE; sin UNIQUE o transacción/UPSERT no puede garantizar ausencia de duplicados bajo concurrencia. Probar y decidir restricción futura.
- **R08 — privilegios elevados:** uso de `service_role` para CRUD directo obliga a probar filtros de pertenencia en todas las rutas y verificar privilegios efectivos; RLS no reemplaza comprobaciones de ownership.
- **R09 — snapshots de pedidos:** cambios de destinatarios y direcciones no deben mutar pedidos históricos; depende de tablas futuras de pedidos aún ausentes.
- **R10 — dependencia de cuerpos:** `pg_depend` y SQL propuesto no prueban el cuerpo instalado de las RPC; esta auditoría no consulta Supabase ni afirma equivalencia del borrador con staging.
- **R11 — perfil limitado:** profile devuelve hasta 100 destinatarios y 50 direcciones; definir paginación futura si se supera el límite, sin confundir truncamiento con ausencia.
- **R12 — correo:** las cuatro funciones de correo no son llamadas directamente desde este controlador; no se concluye obsolescencia ni se autoriza activación.

## Criterios de aceptación antes de pruebas funcionales
| ID | Requisito |
|---|---|
| A01 | Staging confirmado y servicios apagados; datos ficticios aislados y autorización expresa |
| A02 | Inspección actualizada de tipos, PK/FK, secuencias, RLS, grants y firmas reales |
| A03 | Contrato de cinco RPC y permisos service_role conciliado con cuerpos instalados por vía autorizada |
| A04 | Registro Cuba/extranjero y duplicados atómicos |
| A05 | Login, límites, expiración y revocación reproducibles |
| A06 | Cliente A nunca puede leer/editar destinatarios/direcciones de B |
| A07 | Guardado concurrente de ubicación sin duplicación silenciosa |
| A08 | ID bigint y teléfono cubano/externo validados en los límites de UI |
| A09 | Perfil completo o paginado; snapshots de pedido inmutables cuando existan |
| A10 | Ningún correo real, pedido real, producción o despliegue activado |
| A11 | Pruebas con rollback de datos ficticios y sin alterar clientes existentes |
| A12 | GitHub Actions con run y job verificados; tests estáticos no equivalen a PASS funcional |

**Reversión actual:** revertir solamente commits documentales y de comprobaciones estáticas. **Reversión futura:** nueva autorización, copia/backup de staging, aislar datos ficticios, rollback comprobado y conservación de históricos. NO-GO para migraciones, SQL, cambios operativos, activación de correos o pedidos reales.
