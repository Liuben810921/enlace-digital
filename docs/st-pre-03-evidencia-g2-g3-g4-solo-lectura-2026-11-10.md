# ST-PRE-03 — ejecución administrativa G2/G3/G4, solo lectura

Fecha: 2026-11-10. Autorización: inspección de **metadatos y estados exclusivamente** sobre `xqahthghvozeigbojhyi` y revisión de GitHub; base `b3cb19bcb9d6737ec4f9a7f84f3bfef1c9214d50`. No autoriza leer valores de configuración, secretos, filas de clientes o históricos, ni ejecutar RPC, migraciones, escrituras, cambios de configuración o despliegues.

## Fuentes observadas
- Supabase `get_project`, `list_migrations`, `list_edge_functions`, `get_advisors(security)`: staging `ACTIVE_HEALTHY`, PostgreSQL 17.11, 7 migraciones, 0 Edge Functions, 8 avisos informativos `rls_enabled_no_policy`.
- `execute_sql` **SELECT solo de metadatos**: `pg_class`, `pg_namespace`, `pg_policy`, `pg_proc`, `pg_constraint`, `pg_trigger`, `pg_extension` y comprobaciones `has_*_privilege`. Sin SELECT a tablas de aplicación, `auth.users`, tablas de configuración ni tablas de jobs.
- GitHub: protocolo `docs/st-pre-02-protocolo-desbloqueo-g2-g3-g4-2026-11-10.md`, plan ST-01–ST-12 y workflow offline. Las comprobaciones administrativas no deben inferir estados de configuración a partir de código de GitHub.

## Resultados por subpuerta
| Subpuerta | Evidencia administrativa observada | Estado | Riesgo / dependencia pendiente |
|---|---|---|---|
| G2.1 Edge/gateway | `list_edge_functions` devuelve 0 funciones desplegadas. | **PASS limitado a Edge** | Exposición Data API, Auth y gateway no demostrada; no certificar aislamiento global |
| G2.2 Correo/SMTP/SMS | Metadatos: no triggers de usuario en 8 tablas; existen 2 RPC de correo en esquema público con EXECUTE restringido a `service_role`. | **BLOCKED** | Estados de Auth SMTP/Email Hooks/SMS y transporte de salida no accesibles sin valores por herramientas disponibles |
| G2.3 Pagos | Ninguna Edge Function desplegada; extensiones `http`, `pg_net`, `wrappers` no instaladas en la BD. | **BLOCKED** | Integraciones externas, enlaces de pago y webhooks de otros servicios no acreditados |
| G2.4 Pedidos/stock | Metadatos: no triggers de usuario en las 8 tablas revisadas; no `pg_cron` instalado. | **BLOCKED** | No se ha demostrado aislamiento de rutas web/clientes, sistemas externos o pedidos reales |
| G2.5 Webhooks/colas/cron | No existe esquema `cron`; extensiones `pg_cron`, `pg_net`, `http` ausentes; 0 triggers no internos en 8 tablas de aplicación. | **BLOCKED** | No cubre servicios administrados, colas fuera de BD, triggers en otros esquemas ni webhooks externos |
| G3.1 Backups/PITR | No hay una interfaz disponible que exponga **solo el estado** de backup, retención y restauración sin valores. | **BLOCKED** | Disponibilidad y ensayo de restauración no acreditados; no inferir backup por proyecto saludable |
| G3.2 Esquema/FK | 6 relaciones FK catalogadas: `correo_tokens → credenciales CASCADE`, `sesiones → credenciales CASCADE`, `credenciales → clientes_oficiales RESTRICT`, `destinatarios → clientes_oficiales CASCADE`, `direcciones → clientes_oficiales CASCADE`, `clientes_oficiales → auth.users NO ACTION`. | **PASS de inventario parcial** | Dependencia de `auth.users` y cascadas obligan a revisión de propiedad y secuencia de borrado; no hay limpieza autorizada |
| G3.3 Marcadores | Diseño de namespace y manifiesto de fixtures en plan GitHub; no se crearon registros. | **PASS documental / BLOCKED operativo** | Sin prueba de unicidad ni de marcadores persistidos |
| G3.4 Reversión | Diseño `ROLLBACK` o limpieza selectiva por IDs exactos, sin ejecutar. FK `RESTRICT` y `CASCADE` requieren orden seguro. | **BLOCKED** | Sin backup comprobado, sin permisos de limpieza verificados, sin ensayo de reversión en staging |
| G4.1 Auth/proveedores | No se leyeron valores ni listas de usuarios; no existe evidencia administrativa accesible de estado Auth/SMTP/providers. | **BLOCKED** | No asumir que Auth está deshabilitado |
| G4.2 Gateway/JWT | Código GitHub describe controlador de autenticación propia, `verify_jwt=false` y sesión propia; 0 Edge desplegadas. | **PASS documental / BLOCKED operativo** | Configuración efectiva del gateway no acreditada; clave publicable no identifica cliente |
| G4.3 Secretos | No se leyeron secretos ni nombres/valores desde paneles que puedan exponerlos. | **BLOCKED** | Presencia de banderas y protección de `service_role` no acreditadas |
| G4.4 Roles/ACL | 8 tablas RLS ON, 0 políticas, sin SELECT directo de `anon`/`authenticated`; 10 RPC no ejecutables por ambos roles. 8 `SECURITY DEFINER`; `ed_cliente_registrar_privado` no ejecutable por `service_role`, wrapper de residencia sí. | **PASS de catálogo** | Sin prueba de acceso cruzado; `service_role` puede eludir RLS y requiere comprobación de sesión |
| G4.5 Banderas operativas | Ningún valor consultado. No existe estado separado verificable mediante herramientas disponibles. | **BLOCKED** | No confirmar `ED_STAGING_CUSTOMER_AUTH_ENABLED` ni `ED_STAGING_ALLOWED_ORIGIN` sin evidencia |
| G4.6 Antia-buso | GitHub ST-00C conserva limitador global y cuotas por teléfono; pruebas simuladas previamente aprobadas. | **PASS documental / BLOCKED operativo** | Falta validación de abuso real, observabilidad y limitación de denegación colectiva |

## Interpretación y decisiones
- **G2 sigue BLOCKED.** Ausencia de Edge/cron/extensiones no prueba ausencia de efectos externos de Auth, pasarelas, webhooks o aplicación web.
- **G3 sigue BLOCKED.** El inventario FK mejora la planificación, pero no demuestra backup, PITR ni reversión. La relación `clientes_oficiales → auth.users` exige diseñar fixtures compatibles con Auth sin generar mensajes, y limpiar solo sus propios IDs.
- **G4 sigue PARCIAL/BLOCKED.** ACL/RLS documentados, pero gateway, Auth, presencia de secretos y banderas no verificables bajo alcance.
- **NO-GO** para escrituras ficticias, despliegue Edge, activación de correo, pagos o pedidos. No transformar un estado BLOCKED en PASS por inferencia.
- **Siguiente autorización independiente propuesta:** únicamente inspección guiada de estados administrativos de Auth, correo, webhooks, backups y gateway por una vía que no muestre valores, o aporte de capturas redactadas por Owner. Si la interfaz muestra secretos/valores inseparables, detener y mantener BLOCKED. La prueba de rollback y cualquier escritura requiere permiso diferente.
- Reversión de este trabajo: revertir solo commits documentales/CI en GitHub. **No hay cambios de Supabase que revertir**.

## Evidencia y privacidad
Registro público limitado a nombre de fuente, metadatos estructurales, estado de subpuerta y criterio. Sin capturas de secretos, datos de usuarios, filas de configuración, contenido de tablas, tokens, claves, direcciones ni números. No se ejecutaron funciones operativas.
