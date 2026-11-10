# ST-PRE — verificación administrativa G1–G5 (solo lectura)

Fecha: 2026-11-10. Base autorizada: commit `3dc3854a2b5af0576361f74ffcb2f3e3f5d15bc9`, GitHub Actions run `42921042249` SUCCESS. Proyecto autorizado: `xqahthghvozeigbojhyi`. **No se han ejecutado pruebas ST-01–ST-12.**

## Método y límites
- Exclusivamente herramientas administrativas de Supabase para `get_project`, `get_project_url`, `list_migrations`, `list_edge_functions`, `get_advisors(security)` y un `SELECT` de metadatos sobre `pg_class`, `pg_namespace`, `pg_policy`, `pg_proc` y funciones `has_*_privilege`.
- Sin lectura de filas de tablas de negocio, clientes, direcciones, credenciales, sesiones, correo, pedidos o datos históricos. Sin consulta a valores de configuración, secretos, tokens o claves. Sin RPC operativa ni modificación de Supabase.
- No se ha consultado producción ni alterado código operativo.

## Matriz de puertas (evidencia y resultado)
| Puerta | Evidencia observada | Estado |
|---|---|---|
| G1 Identidad | `get_project`: `enlace-digital-staging`, ref `xqahthghvozeigbojhyi`, `ACTIVE_HEALTHY`, región `us-east-1`, PostgreSQL `17.11.0.018`. `get_project_url`: `https://xqahthghvozeigbojhyi.supabase.co`. 7 migraciones registradas (listadas abajo). | **PASS** para identidad/metadatos. No certifica aislamiento de red o de secretos |
| G2 Efectos externos | `list_edge_functions`: `[]` (ninguna desplegada). **No existe evidencia administrativa suficiente**, sin leer valores de configuración, para demostrar que correo saliente, SMTP, webhooks, pasarelas de pago, colas y pedidos estén físicamente aislados. | **BLOCKED** para autorización de escrituras o HTTP |
| G3 Datos y reversión | Catálogo confirma 8 tablas de aplicación, pero no hay evidencia de respaldo verificado, inventario completo de dependencias, permisos de limpieza selectiva ni rollback probado. No se consultaron datos. | **BLOCKED** |
| G4 Autenticación y configuración | 10 funciones catalogadas; 8 `SECURITY DEFINER`, 2 `SECURITY INVOKER`. Ninguna ejecutable por `anon`/`authenticated`. El wrapper `ed_cliente_registrar_residencia_privado` sí ejecutable por `service_role`; la función base `ed_cliente_registrar_privado` no, conforme al encapsulamiento observado en ST-00B. Banderas reales, proveedor Auth/gateway, estado de secretos y origen no verificables con evidencia permitida. | **PASS parcial de ACL; BLOCKED en configuración** |
| G5 Aislamiento ACL/RLS | Las 8 tablas tienen `relrowsecurity=true`, `relforcerowsecurity=false`, cero políticas; `anon` y `authenticated` sin SELECT ni INSERT/UPDATE/DELETE sobre ellas. `enlace_auth` sin USAGE para ambos; `public` con USAGE pero sin privilegios sobre las tablas. Asesor: 8 INFO `rls_enabled_no_policy`. | **PASS en metadatos; BLOCKED para prueba de comportamiento de acceso cruzado** |

## Migraciones verificadas (solo nombres/versiones)
1. `20261109150251` isolated_mail_token_harness
2. `20261109150922` revoke_private_mail_function_execution
3. `20261109151138` align_mail_harness_constraints_indexes
4. `20261109151152` align_mail_harness_rls_and_table_grants
5. `20261109151259` add_minimal_official_client_parent_and_fk
6. `20261109204134` enlace_digital_staging_schema_only_v4_20261109
7. `20261109205341` enlace_digital_staging_five_customer_rpcs_20261109

## Inventario de seguridad
- Tablas: `enlace_auth.cliente_correo_tokens`, `cliente_credenciales`, `cliente_sesiones`, `configuracion_correo`, `solicitudes_limite`; `public.clientes_destinatarios`, `clientes_direcciones_entrega`, `clientes_oficiales`.
- Las 8: RLS habilitado, FORCE RLS desactivado, 0 políticas, sin SELECT/escritura directa para `anon` ni `authenticated`. RLS sin políticas es denegación por defecto, no hallazgo de fuga demostrada; no se recomienda añadir políticas sin necesidad de diseño.
- 10 funciones: `ed_consumir_token_correo_privado`, `ed_emitir_token_correo_privado`, `ed_cliente_direccion_privada`, `ed_cliente_limite_privado`, `ed_cliente_login_privado`, `ed_cliente_registrar_privado`, `ed_cliente_registrar_residencia_privado`, `ed_cliente_sesion_privada`, `ed_correo_consumir_token_servicio`, `ed_correo_emitir_token_servicio`. Ninguna ejecutable por `anon` o `authenticated`.
- **No se ha probado la denegación efectiva** mediante llamadas bajo roles de cliente; `service_role` puede sobrepasar RLS y requiere validación de propiedad por sesión en controlador, aún no desplegado.

## Criterios para avanzar y autorización
- **NO-GO** para ST-01–ST-12 con escrituras: G2, G3 y G4 siguen BLOCKED; G5 no tiene pruebas funcionales. No desplegar Edge Function ni habilitar servicios.
- Próximo paso seguro: elaborar en GitHub un checklist de evidencias verificables para G2/G3/G4, con responsables y rutas administrativas que muestren **estados sin valores secretos ni filas**, o solicitar una autorización independiente y acotada para esa inspección si exige ampliar el acceso.
- **No solicitar todavía ejecución de escrituras ficticias** sin prueba de ausencia de efectos externos y rollback selectivo. Una futura autorización de despliegue controlado de Edge y otra de escritura serían independientes.
- No inferir aprobación integral de seguridad por CI verde.

**Resultado general: G1 PASS; G2 BLOCKED; G3 BLOCKED; G4 PASS parcial/BLOCKED; G5 PASS catálogo/BLOCKED funcional.** Sin cambios en staging o producción.
