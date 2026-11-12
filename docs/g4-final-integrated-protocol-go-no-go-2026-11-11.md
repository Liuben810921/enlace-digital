# G4 — Protocolo final de pruebas integradas y decisión GO/NO-GO (NO EJECUTAR)
Fecha: 2026-11-11 · Alcance: **preparación exclusiva en GitHub** · Proyecto objetivo futuro: `xqahthghvozeigbojhyi` (`enlace-digital-staging`). Producción `ubrvuplslconfxwpfzxj` **excluida**.

## 1. Evidencia actual, clasificación
| Condición | Evidencia | Estado |
|---|---|---|
| SQL RLS/ACL | 8 tablas con RLS, sin políticas; anon/authenticated sin permisos directos; 10 funciones sin EXECUTE público; 8 SECURITY DEFINER con search_path local (auditoría de metadatos) | PASS para metadatos, no para comportamiento |
| Edge Functions | Inventario administrativo: 0 desplegadas | PASS como aislamiento actual; **BLOCKED** para HTTP integrado |
| Correo propio | Flags envios/verificacion/recuperacion = false, comprobados en staging | PASS |
| SMTP personalizado | Panel de staging: interruptor desactivado, captura del propietario 2026-11-11 | PASS |
| Auth Hooks | Panel de staging: lista vacía, captura del propietario 2026-11-11 | PASS |
| SMTP integrado de Supabase Auth | Documentación confirma existencia posible aun sin SMTP personalizado; no hay prueba administrativa de que no pueda enviar a miembros del equipo | **BLOCKED** |
| Proveedor email de Auth / confirmación | Estado operativo de proveedor y rutas de invitación, recuperación, OTP, enlaces mágicos y confirmación no demostrado de modo integral | **BLOCKED** |
| Extensiones/red DB | No pg_net/pg_cron/http/vault/pgsodium, sin triggers de aplicación en esquemas inspeccionados | PASS en alcance inspeccionado |
| CI aislado | G4 PostgreSQL #3 SUCCESS y G4 offline #1 SUCCESS según capturas; no equivalen a staging | PASS offline |
| Datos y reversión | 2 fixtures sintéticos propuestos; identificadores no enrutables y procedimiento de limpieza aún no validados en staging | **BLOCKED** |
| Despliegue | Borrador Edge únicamente en GitHub, no desplegado | **BLOCKED**, requiere autorización independiente |

**Decisión general: NO-GO para cualquier escritura, prueba HTTP o despliegue en staging. GO solo para preparación offline y revisiones de metadatos autorizadas.**

## 2. Dos identidades ficticias (no crear)
- Tanda: `ED-G4-YYYYMMDD-<nonce-aleatorio>`, nonce >= 12 bytes; registrar en manifiesto privado de la tanda, **nunca en GitHub/logs públicos**.
- A, residente Cuba: nombre ficticio con apellido, dirección habitual ficticia obligatoria (provincia, municipio, calle), email omitido, contraseña efímera generada en ejecución futura.
- B, residente extranjero: nombre ficticio con apellido, sin dirección cubana habitual, email omitido, contraseña distinta efímera.
- Teléfonos: **no asignar números reales ni arbitrarios**; el controlador exige E.164 en cuentas y teléfonos cubanos en destinatarios. Un prefijo de prueba solo se admite tras verificar que sea no enrutable y aceptado por validadores. Si no existe opción segura, NO-GO y rediseño aislado autorizado.
- A1/A2 y B1/B2: hasta 2 destinatarios y 2 direcciones de entrega por cliente, marcados inequívocamente por tanda. No usar correo ni teléfono de terceros.
- No persistir contraseñas, tokens, encabezados Authorization, claves, PII ni valores de secretos en evidencia.

## 3. Matriz de pruebas futura (no ejecutar)
| ID | Operación/caso negativo | Esperado | Evidencia mínima |
|---|---|---|---|
| G4-01 | A registro Cuba sin dirección / B registro extranjero sin dirección | A 400 sin persistencia; B 201 | status + IDs ficticios |
| G4-02 | Login A/B correcto e incorrecto | 200 con sesión propia; incorrecto 401, sin sesión | resultado redactado |
| G4-03 | Perfil A y B | cada uno ve exclusivamente su ficha | aserción IDs |
| G4-04 | B intenta actualizar destinatario A1 mediante ID | 404, A1 sin cambios | snapshot solo de fixture A1 |
| G4-05 | A/B guardan direcciones iguales | propietarios separados; sin fusión | IDs de fixture |
| G4-06 | Token malformado, inválido, caducado, revocado | 401; ninguna escritura | status y correlación |
| G4-07 | Logout A y reutilización token | revocado; reuso 401 | estado token ficticio |
| G4-08 | Acceso directo anon/authenticated a tablas/RPC | denegado, sin bypass | resultados por rol |
| G4-09 | JSON duplicado, Unicode inválido, >4096 bytes | 400/413 antes de RPC | status |
| G4-10 | Límite por teléfono y global | 429 controlado sin afectar terceros | contadores sintéticos |
| G4-11 | Registro duplicado | 409 sin duplicación | IDs exactos |
| G4-12 | No efectos externos | 0 correos/SMS/webhooks/pagos/pedidos | configuración y telemetría autorizada |

**Advertencias:** los casos G4-01 a G4-12 están NOT RUN. Las pruebas ST-06/07/08 de idempotencia siguen restringidas a PostgreSQL desechable. No confundir `service_role` con un usuario RLS ni certificar aislamiento usando solo funciones privilegiadas.

## 4. Puertas obligatorias de GO antes de cada etapa
- **G0 autorización:** permisos separados y expresos para (a) despliegue mínimo, (b) escrituras de fixtures y pruebas HTTP, (c) limpieza selectiva; especificar vigencia, volumen y rollback. Ninguno está concedido.
- **G1 entorno:** doble comprobación de project ref, URL, rama/commit y ausencia de referencias a producción.
- **G2 efectos externos:** demostrar por vía administrativa que *todas* las rutas de Auth (SMTP integrado, OTP, recuperación, invitación, confirmación) están bloqueadas o aisladas; no basta con SMTP custom off. Sin certeza: NO-GO.
- **G3 datos:** teléfonos ficticios no enrutables válidos, sin PII, manifiesto privado con IDs y dependencias, procedimiento de limpieza validado; sin backups garantizados en plan gratuito.
- **G4 gateway:** borrador fail-closed, `ED_STAGING_CUSTOMER_AUTH_ENABLED=false` hasta permiso de activación; origen permitido y `SUPABASE_PUBLISHABLE_KEYS` solo por presencia, sin exponer valores; `service_role` solo servidor.
- **G5 permisos:** comprobar RLS y ACL de roles no privilegiados y el IDOR con A/B; no relajar GRANT ni políticas para hacer pasar casos.
- **G6 presupuesto:** máximo 2 clientes, 2 destinatarios/cliente, 2 direcciones/cliente, 10 operaciones/caso, 2 concurrentes, 15 min/tanda, 3 reintentos controlados; detener ante 429 persistente.
- **G7 evidencia:** log redactado `run_id|commit|project_ref|autorizacion|caso|esperado|observado|estado|rollback` sin datos personales ni secretos.

## 5. Orden de ejecución y limpieza (solo si se autorizara posteriormente)
1. Confirmar G0–G7; congelar commit, comprobar aislamiento y desactivar toda salida externa. Si no se puede probar bloqueo de correo Auth, **NO-GO**.
2. Obtener **autorización específica de despliegue** antes de instalar Edge Function, si se requiere; despliegue no implica habilitar ni probar.
3. Obtener **autorización específica de escrituras** antes de crear A/B; comenzar por un caso mínimo reversible, sin contactos reales.
4. Para transacciones SQL sintéticas autorizadas, `BEGIN`/aserciones/`ROLLBACK`; para HTTP persistente no prometer rollback transaccional entre solicitudes.
5. Antes de escribir, generar manifiesto privado de IDs de A/B y dependencias; anotar IDs creados al instante. Nunca consultar ni borrar registros fuera de esos IDs.
6. Limpieza autorizada por separado: revocar sesiones ficticias, retirar tokens, límites y destinatarios/direcciones sintéticas según FK, después credenciales y clientes de la tanda. Usar WHERE con IDs exactos y verificar solo esos IDs. Si una dependencia es incierta, **detenerse sin borrar**.
7. Prohibido `TRUNCATE`, `DROP`, DELETE masivo, cambio de políticas, activación de correo, pedidos o producción. Ante fallo de limpieza, registrar incidente y solicitar autorización.

## 6. Riesgos que no se pueden cerrar solo con documentación
- El correo integrado de Supabase Auth puede enviar a destinatarios autorizados aun sin SMTP personalizado; Auth Hooks vacíos no lo desactivan.
- Los métodos `auth.signUp`, `resetPasswordForEmail`, OTP, invitaciones y cambios de correo pueden generar eventos independientes del correo propio de ENLACE DIGITAL. No invocarlos.
- `service_role` puede saltarse RLS; el controlador depende de filtros por cliente y validación de sesión.
- El límite global de emergencia compartido puede afectar pruebas concurrentes; no aumentar cuotas sin aprobación.
- La recuperación ante fallo de limpieza no puede asumir PITR/backups de plan gratuito.
- El controlador no está desplegado; las aserciones offline no sustituyen pruebas integradas.

## 7. Decisión y próximo permiso
**GO:** continuar revisiones de código, documentación y CI offline sin staging.
**NO-GO:** desplegar, activar, escribir, registrar clientes, invocar Auth, enviar correo, crear pedidos o ejecutar pruebas integradas en staging.
**Próxima autorización recomendada:** exclusivamente inspección administrativa de solo lectura del estado del proveedor email de Supabase Auth y vías de envío integradas, sin exponer secretos; si la herramienta no lo ofrece, solicitar comprobación visual específica. Una autorización posterior de despliegue sería distinta, y una de escritura/limpieza también.

Fuentes oficiales: https://supabase.com/docs/guides/auth/auth-smtp y https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook.
