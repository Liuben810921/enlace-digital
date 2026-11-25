# Conciliación offline de llamadas RPC — controlador staging y metadatos documentados

Fecha: 2026-11-10. Base `564684afa799717378c7795fc64431675a874ad6`. Inspección **exclusiva de GitHub**, sin consultas a Supabase en esta etapa. Evidencia de permisos y propietarios procede de `docs/auditoria-funciones-auth-staging-metadatos-2026-11-10.md`, que registra la lectura previa. Fuente operativa de contrato: `supabase/functions/enlace-cliente-auth-staging/index.ts`; propuesta SQL **no ejecutada por esta auditoría**: `sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql`.

## Cinco RPC invocadas por el controlador
| RPC | Acción/ruta | EXECUTE service_role observado previamente | Conciliación |
|---|---|---|---|
| `public.ed_cliente_limite_privado` | rate limiting compartido | Sí | Contrato directo activo en código |
| `public.ed_cliente_registrar_residencia_privado` | register | Sí | Contrato directo activo en código |
| `public.ed_cliente_login_privado` | login | Sí | Contrato directo activo en código |
| `public.ed_cliente_sesion_privada` | address-save, delivery-location-save, recipient-save, session, logout, profile | Sí | Contrato directo activo en código |
| `public.ed_cliente_direccion_privada` | address-save | Sí | Contrato directo activo en código |

El controlador realiza **ocho apariciones sintácticas** de `db.rpc(...)` para **cinco nombres únicos**. Utiliza cliente Supabase con `SUPABASE_SERVICE_ROLE_KEY` del entorno del servidor y no una clave privilegiada en navegador. Esto verifica **contrato de código**, no despliegue, conectividad, acceso real ni habilitación del servicio.

## Cinco funciones registradas previamente que NO invoca directamente el controlador
| Función | Clasificación | Permisos / dependencia |
|---|---|---|
| `public.ed_cliente_registrar_privado` | Función base de registro, **dependencia indirecta**, no RPC directa del controlador | `service_role` sin EXECUTE según auditoría de metadatos; el SQL v4 propone invocarla desde `ed_cliente_registrar_residencia_privado` como `SECURITY DEFINER` del propietario `postgres`. No confundir con código muerto ni conceder EXECUTE sin revisión |
| `enlace_auth.ed_emitir_token_correo_privado` | Servicio interno de correo; no llamada directa en este controlador | `service_role` con EXECUTE; cualquier dependencia indirecta requiere inspección de cuerpos autorizada |
| `enlace_auth.ed_consumir_token_correo_privado` | Servicio interno de correo; no llamada directa en este controlador | `service_role` con EXECUTE; cualquier dependencia indirecta requiere inspección de cuerpos autorizada |
| `public.ed_correo_emitir_token_servicio` | Wrapper correo `SECURITY INVOKER`; no llamada directa en este controlador | `service_role` con EXECUTE; no equivale a activación de correos |
| `public.ed_correo_consumir_token_servicio` | Wrapper correo `SECURITY INVOKER`; no llamada directa en este controlador | `service_role` con EXECUTE; no equivale a activación de correos |

## Discrepancias y riesgos
- **D01 — función base y permiso:** `ed_cliente_registrar_privado` sin EXECUTE para service_role es compatible con la llamada interna desde el wrapper DEFINER propietario `postgres` en el borrador v4. El wrapper debe verificar residencia/dirección; **no ampliar permisos** ni declarar la función antigua eliminable. El cuerpo instalado no fue inspeccionado.
- **D02 — dependencia de rate limiting:** `ed_cliente_limite_privado` está invocada, pero no es una de las cinco definiciones CREATE OR REPLACE FUNCTION del borrador v4. Su existencia/permiso previo son precondiciones del controlador.
- **D03 — correo:** cuatro funciones de correo existen según auditoría anterior, pero ninguna es llamada directamente por `index.ts`. Pueden depender de otros controladores o SQL interno. No asumir que son obsoletas ni habilitar servicios.
- **D04 — acceso a tablas:** además de RPC, el controlador accede directamente con `db.from` a `clientes_destinatarios` y `clientes_direcciones_entrega`. El permiso `service_role` sobre esas tablas fue observado; el aislamiento depende también de filtros `cliente_numero`, comprobación de sesión y validación funcional aún pendiente.
- **D05 — seguridad:** ocho funciones SECURITY DEFINER observadas previamente, todas con propietario postgres y search_path vacío. La ACL y las referencias de catálogo no prueban semántica ni ausencia de dependencias internas.
- **D06 — documentación histórica:** `docs/auditoria-contratos-rpc-staging-2026-11-09.md` indica que las cinco RPC propuestas aún no estaban instaladas **en aquella fecha/consulta**. La auditoría de metadatos posterior enumera esas funciones como presentes. No usar el texto histórico como estado actual ni modificarlo retroactivamente.
- **D07 — CI:** no equiparar falta de runs en el método limitado a PR con fallo de pruebas; comprobar jobs de cualquier ejecución asociada antes de declarar PASS. Los tests estáticos no ejecutan SQL ni prueban acceso efectivo.

## Matriz de aceptación
| Caso | Evidencia exigida |
|---|---|
| C01 | Exactamente cinco nombres únicos de RPC invocados por el controlador |
| C02 | Exactamente ocho apariciones `db.rpc` y presencia de las cinco rutas |
| C03 | Las cinco RPC tienen EXECUTE service_role en metadatos documentados |
| C04 | Función base `ed_cliente_registrar_privado` NO invocada directamente y sí referenciada en el borrador SQL v4 |
| C05 | Las cuatro funciones de correo no aparecen como llamadas RPC directas |
| C06 | Rate limiting es dependencia existente y no una de las cinco definiciones v4 |
| C07 | Acceso a destinatarios y direcciones conserva filtros por `cliente_numero` |
| C08 | Ninguna prueba estática afirma haber ejecutado SQL, autenticación ni correo |

**NO-GO:** cambios de grants, migraciones, ejecución de RPC, activación de servicios o pedidos reales. Reversión actual: revertir exclusivamente commits documentales y tests estáticos de GitHub; Supabase y producción permanecen sin cambios.
