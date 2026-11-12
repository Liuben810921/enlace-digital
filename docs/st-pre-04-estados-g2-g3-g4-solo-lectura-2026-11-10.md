# ST-PRE-04 — inspección adicional de estados/presencia G2–G4 (solo lectura)

Fecha: 2026-11-10. Base autorizada `d48b6eb4a26134151d5b58dce841f5948fca07ea`. Destino exclusivo `xqahthghvozeigbojhyi`. Esta revisión no autoriza pruebas sintéticas ni despliegues.

## Métodos realmente disponibles y ejecutados
- `get_project`: nombre `enlace-digital-staging`, ref coincidente, estado `ACTIVE_HEALTHY`, PostgreSQL 17.11.0.018.
- `list_edge_functions`: **0 funciones desplegadas**.
- `list_extensions`: inventario de **nombres, esquema y estado instalado/no instalado**. `pg_cron` y `pg_net` constan disponibles pero **no instaladas**; `pgcrypto`, `uuid-ossp`, `supabase_vault` sí instaladas. La presencia de Vault **no implica** que existan secretos concretos ni se consultó su contenido.
- Se contrastó el inventario de herramientas autorizadas: no se dispone de una operación administrativa que exponga exclusivamente **estados sin valores** de Auth providers, SMTP, Email Hooks, API gateway, secretos, backups/PITR, pagos, webhooks externos o banderas. No se invocaron endpoints alternativos, ni se usó una consulta que pudiera revelar valores.

## Subpuertas y evidencia
| Control | Estado | Evidencia y límite |
|---|---|---|
| G2.1 Edge/gateway | **PASS parcial / BLOCKED gateway** | 0 Edge Functions; gateway/API Auth y otros endpoints no certificados |
| G2.2 Correo/SMTP/SMS | **BLOCKED** | No hay herramienta de estado separado de Auth SMTP, Email Hooks o SMS; no inferir desactivación |
| G2.3 Pagos | **BLOCKED** | Sin evidencia administrativa de integraciones externas ni de aislamiento de pasarelas |
| G2.4 Pedidos/stock | **BLOCKED** | Sin evidencia de estados efectivos de pedidos o inventario fuera del esquema revisado |
| G2.5 Webhooks/colas/cron | **BLOCKED global; evidencia parcial** | `pg_cron` y `pg_net` no instaladas, 0 Edge Functions; no cubre webhooks, colas ni servicios externos |
| G3.1 Backup/PITR | **BLOCKED** | Sin interfaz que exponga exclusivamente disponibilidad/estado de backups y restauración |
| G3.2 FK/dependencias | **PASS parcial heredado** | 6 FK y cascadas/restrict catalogadas en ST-PRE-03; no se repitió consulta ni se verificó restauración |
| G3.3 Marcadores | **PASS documental / BLOCKED operativo** | Diseño GitHub, sin creación de registros ficticios |
| G3.4 Reversión | **BLOCKED** | Sin permisos de limpieza y recuperación demostrados; no se ejecutó rollback |
| G4.1 Auth/providers | **BLOCKED** | Sin operación segura de estados separados de valores |
| G4.2 Gateway/JWT | **PASS documental / BLOCKED operativo** | Contrato en GitHub, no hay gateway efectivo verificado |
| G4.3 Presencia de secretos | **BLOCKED** | `supabase_vault` instalada no prueba presencia/ausencia de variables ni seguridad del entorno |
| G4.4 Roles/ACL | **PASS de catálogo heredado** | ST-PRE-03: 10 RPC sin EXECUTE anon/authenticated; sin repetir lectura de permisos |
| G4.5 Banderas | **BLOCKED** | Sin vía de estado independiente; no se consultó valor alguno |
| G4.6 Antia-buso | **PASS documental / BLOCKED operativo** | Controlador GitHub y pruebas offline, sin prueba real de gateway/rate limiting |

## Criterio de decisión
- **G2 BLOCKED; G3 BLOCKED; G4 PARCIAL/BLOCKED. NO-GO** para escrituras ficticias, cambios, despliegues, correos, pagos o pedidos reales.
- Ausencia de Edge Functions y de ciertas extensiones **no demuestra** ausencia de todos los servicios externos.
- Para resolverlo sin ampliar acceso a valores: el **Owner** puede aportar evidencia privada redactada de pantallas que muestren *solo* estados (o una certificación administrativa firmada), para revisión posterior. No pedir capturas que muestren secretos o valores; si no se pueden separar, mantener BLOCKED y solicitar autorización independiente de otro método.
- Responsables: Owner staging (estados Auth/SMTP/backups), seguridad (validación de aislamiento), revisor técnico (gateway y permisos), responsable comercial (pagos y pedidos).
- Cualquier nueva comprobación administrativa no cubierta, prueba sintética, modificación o despliegue necesita autorización **separada**.

## Límites y reversión
No se leyeron filas de clientes, históricos, tablas de configuración, valores de variables, claves ni secretos; no se invocaron funciones operativas, SQL, endpoints HTTP de aplicación, ni se cambiaron datos o servicios. Único cambio: documentación y disparadores CI en GitHub. Reversión posible por `git revert`; **sin cambios en Supabase**.
