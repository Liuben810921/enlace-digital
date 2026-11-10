# ST-PRE-02 — protocolo de desbloqueo G2, G3 y G4 (preparación exclusiva en GitHub)

Fecha: 2026-11-10. Base `0bc948ebcc7ec7d295cb0011e576c3c0d3c0f450`. Proyecto objetivo **solo** `xqahthghvozeigbojhyi` (enlace-digital-staging). Producción fuera de alcance. Este protocolo **no es autorización para ejecutar inspecciones adicionales ni pruebas con datos ficticios**.

## Regla de evidencia y segregación
- Estado actual heredado de ST-PRE: G1 PASS; G2 BLOCKED; G3 BLOCKED; G4 PASS parcial/BLOCKED; G5 PASS catálogo/BLOCKED funcional. Ningún estado se convierte en PASS por preparar este documento.
- Toda comprobación futura requiere autorización específica; operadores: **Owner de Supabase staging** (certificación de controles administrativos), **revisor técnico** (contraste con GitHub), **responsable de seguridad** (GO/NO-GO), **responsable comercial** (confirmación de no pedidos/pagos reales). Una misma persona puede ocupar varios roles, pero cada función debe quedar identificada y firmada en acta; el Owner no delega aprobación de cambios.
- Capturas o registros de **estado y presencia** únicamente: redactar tokens, secretos, valores de configuración, direcciones, correos, teléfonos, identificadores de clientes y registros históricos. Guardar evidencias privadas con control de acceso; en GitHub solo estado, fecha, referencia y hash del acta redactada.
- No ejecutar SQL sobre filas de aplicación, funciones RPC operativas, endpoints HTTP, migraciones, despliegues, escrituras, cambios de configuración, creación de usuarios, envío de correo ni pedidos.
- La inspección no debe revelar **valores** de `ED_STAGING_CUSTOMER_AUTH_ENABLED`, `ED_STAGING_ALLOWED_ORIGIN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEYS` ni parámetros de proveedores. Si una pantalla muestra el valor junto al estado, **no capturarla**; usar un indicador administrativo que solo revele presencia/activación o marcar BLOCKED.

## G2 — aislamiento verificable de efectos externos
| Subpuerta | Vía administrativa futura (solo lectura) | Evidencia mínima redactada | Responsable | PASS / NO-GO |
|---|---|---|---|---|
| G2.1 Edge y gateway | Panel de Edge Functions, inventario de endpoints y configuración de exposición (solo estado) | Lista de nombres/estados, 0 Edge Functions observado previamente; fecha/ref | Revisor técnico | PASS si no hay rutas operativas expuestas; NO-GO si hay ruta desconocida |
| G2.2 Correo/SMTP/SMS | Panel de Auth Providers, SMTP y Email Hooks; inventario de triggers y funciones de correo por metadatos, sin ejecutar ni leer filas | Estado deshabilitado o aislamiento verificable de salida; evidencia de bloqueo de transporte, no solo flag UI | Owner + seguridad | NO-GO si existe una vía de envío real o estado no verificable |
| G2.3 Pagos | Inventario de integraciones y webhooks, secretos **solo por nombre/presencia**, rutas de cobro y proveedores externos | Diagrama de salida sin endpoint ni clave real; constancia de inexistencia o desconexión física | Responsable comercial + seguridad | NO-GO si cualquier operación ficticia puede capturar dinero |
| G2.4 Pedidos y stock | Revisión de rutas, triggers, colas y cron jobs por metadatos; GitHub para rutas operativas | Matriz de puntos de entrada y efectos, interruptores efectivos y dependencias | Revisor técnico + comercial | NO-GO si un caso de prueba puede crear pedido, descontar stock o avisar a cliente real |
| G2.5 Webhooks/colas/cron | Paneles administrativos y catálogo de jobs/triggers, **nombres y estados**, sin leer payloads | Inventario de salidas externas y prueba documental de aislamiento | Owner + seguridad | NO-GO ante salida no inventariada o no aislada |

**Importante:** 0 Edge Functions desplegadas no certifica que SMTP, Auth, webhooks o triggers estén desactivados. Si no hay una forma autorizada de acreditar aislamiento sin inspeccionar valores, conservar **BLOCKED** y solicitar una autorización independiente de inspección más amplia, nunca presumir PASS.

## G3 — respaldo, dependencias y reversión selectiva
| Subpuerta | Vía administrativa futura (solo lectura) | Evidencia mínima | Responsable | PASS / NO-GO |
|---|---|---|---|---|
| G3.1 Backups/PITR | Panel de Database Backups y documentación del plan de recuperación, solo **disponibilidad y estado** | Fecha/estado de último backup disponible si el plan lo permite, retención y capacidad de restauración documentada sin datos | Owner | NO-GO si no existe recuperación verificable o no se conoce su alcance |
| G3.2 Esquema/FK | `pg_catalog` (`pg_constraint`, `pg_class`, `pg_namespace`, `pg_trigger`) solo metadatos | Grafo de dependencias de fixtures, restricciones y cascadas, triggers que produzcan efectos | Revisor técnico | NO-GO si borrar un fixture puede afectar registros ajenos |
| G3.3 Marcadores | Diseño en GitHub de manifiesto privado de IDs ficticios; sin crear cuentas | Namespace único de prueba, claves exactas, inventario de dependencias | Seguridad | NO-GO si los fixtures son indistinguibles de datos reales |
| G3.4 Plan de reversión | Revisión de procedimiento transaccional `ROLLBACK` vs RPC con `COMMIT` propio, sin ejecutarlo | Orden de borrado por FK, permisos mínimos, verificación por IDs exactos y contingencia si falla | Revisor técnico + Owner | NO-GO si se necesita DELETE masivo, TRUNCATE, DROP o acceso a filas ajenas |
| G3.5 Ensayo | Solo **en PostgreSQL desechable de CI**, nunca staging en esta fase | CI de rollback y limpieza selectiva con fixtures sintéticos | Seguridad | PASS documental de diseño; **no equivale** a reversión ensayada en staging |

No garantizar restauración a partir de backup sin conocer límites del plan y sin un ensayo autorizado. La limpieza selectiva futura requiere permiso explícito que incluya eliminación **solo de fixtures creados por la prueba**. No acceder a filas históricas.

## G4 — autenticación, gateway, roles y banderas
| Subpuerta | Vía administrativa futura (solo lectura) | Evidencia mínima | Responsable | PASS / NO-GO |
|---|---|---|---|---|
| G4.1 Auth y proveedores | Panel de Authentication, proveedores, URLs permitidas, políticas de sesión y recuperación, **estados únicamente** | Configuración habilitada/deshabilitada por categoría, sin valores ni listas de usuarios | Owner | NO-GO si flujos reales pueden disparar mensajes o usuarios no ficticios |
| G4.2 Gateway/JWT | Panel Edge/API y documentación del contrato `verify_jwt=false`; sin desplegar | Diagrama: `apikey` no autentica usuario; sesión propia y RPC `service_role` obligatoriamente protegidas | Seguridad | NO-GO si se equipara publishable key a autorización de cliente |
| G4.3 Secretos | Panel Secrets o inventario de **nombres/presencia** que no revele valores | Presencia/ausencia de `ED_STAGING_CUSTOMER_AUTH_ENABLED`, `ED_STAGING_ALLOWED_ORIGIN`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEYS`; sin copiar contenido | Owner | NO-GO si falta control de entorno o hay secreto expuesto a navegador |
| G4.4 Roles/ACL | `pg_proc`, `pg_namespace`, `has_function_privilege`, `pg_class` solo metadatos; comparar con ST-PRE | ACL de wrapper y función base, RLS, 0 grants a anon/authenticated, propietario y search_path | Revisor técnico | NO-GO si aparecen grants inesperados o `SECURITY DEFINER` expuesto |
| G4.5 Banderas operativas | Solo indicadores administrativos de **estado**, no valores; si no existe esa vía, BLOCKED | Certificación firmada de que auth de staging no está expuesta y correo/pedidos/pagos permanecen inactivos | Owner + seguridad | NO-GO si el estado no puede verificarse bajo restricciones |
| G4.6 Controles de abuso | GitHub ST-00C y documentación de límites; sin solicitudes reales | Límite global compartido, cuota por teléfono y riesgo de denegación colectiva residual | Seguridad | NO-GO público si no hay estrategia de protección y observabilidad |

## Secuencia de cierre y autorización independiente
1. **Fase A — presente:** documento y pruebas de consistencia en GitHub. Ninguna inspección adicional a Supabase.
2. **Fase B — autorización nueva de solo lectura:** recopilar evidencias G2.1–G2.5, G3.1–G3.4, G4.1–G4.6 mediante paneles y catálogos administrativos, sin valores ni filas. Si la UI no permite separar estado y valor, marcar BLOCKED. Registrar fecha, operador, fuente, evidencia redactada y subpuerta.
3. **Fase C — revisión de evidencias:** responsable de seguridad valida independencia y cobertura. Cada subpuerta es PASS / FAIL / BLOCKED / NOT RUN; sin convertir ausencia de prueba en PASS.
4. **Fase D — autorizaciones separadas:** una para eventual despliegue controlado de Edge (si se necesita), otra para escrituras sintéticas acotadas, otra para cambios de configuración o permisos. No se autorizan por el presente documento.
5. **Fase E — pruebas integradas ST-01–ST-12:** solo los casos aplicables y explícitamente autorizados, con criterios del plan definitivo. ST-06–08 siguen offline mientras no exista integración operativa aprobada.

## Formato de acta por subpuerta
`fecha_UTC | proyecto_ref | subpuerta | responsable | fuente_admin | estado_observado_sin_valores | evidencia_privada_ref | hash_evidencia_redactada | PASS/FAIL/BLOCKED/NOT_RUN | dependencia | autorizacion_independiente | revisor`

## Decisión GO/NO-GO
- **GO solo para proponer una fase de pruebas ficticias** si G2.1–G2.5, G3.1–G3.4 y G4.1–G4.6 están sustentadas; el ensayo G3.5 en CI no sustituye una prueba futura de reversión de staging.
- **NO-GO** ante cualquier subpuerta BLOCKED/FAIL crítica, correo/SMTP/SMS posible, webhook externo, pago real, pedido real, reversión sin alcance conocido, claves expuestas, rutas públicas no inventariadas o datos de clientes potencialmente alcanzables.
- **Estado al crear este documento:** G2 BLOCKED, G3 BLOCKED, G4 parcial/BLOCKED. No hay permiso para desplegar, escribir, activar, consultar filas ni ampliar inspecciones.

## Reversión
Solo archivos de GitHub añadidos a este PR; revertir los commits de documentación y tests si fuera necesario. **Sin cambios en Supabase que revertir.**
