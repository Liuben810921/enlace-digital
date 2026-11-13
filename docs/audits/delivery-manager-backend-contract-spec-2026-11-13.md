# ENLACE DIGITAL — Contrato técnico de backend para cotizador de gestores (diseño offline)

**Versión:** DRAFT-1, 13 noviembre 2026. **Estado:** diseño revisable, **no es migración ejecutable**. **Rama:** `audit/delivery-map-readonly-20261113`. **Decisión:** NO-GO para staging hasta satisfacer B01–B07 del [informe de preparación](delivery-manager-staging-readiness-final-2026-11-13.md).

## 1. Límites de confianza y principios

El navegador envía **solo** una solicitud de vista previa con `operation_key`, `cart_id`, `customer_id` opcional, `destination_ref` (ID de dirección guardada o dirección alternativa temporal) y `expected_cart_revision`. No acepta `role`, `manager_id`, `amount`, `rate`, `road_distance`, `verified`, `route_source`, `origin_ids`, `settings_version` ni `promotion_covered` como autoridad. Identidad, permisos, cesta, destino, almacenes, tarifas, promociones y ruta proceden de servicios del servidor y tablas confiables. **Fail-closed** ante campos desconocidos, contexto ambiguo, permisos ausentes, cambios de versión, ruta caducada o error de proveedor.

La API es de **solo cotización**, sin crear pedidos, cobrar, enviar correos o activar mensajería.

## 2. Contratos RPC propuestos (no desplegados)

| RPC | Entrada permitida | Autorización | Salida |
|---|---|---|---|
| `ed_quote_preview_v1` | `operation_key`, `cart_id`, `customer_id?`, `destination_ref`, `expected_cart_revision` | Gestor activo con cesta propia y cliente asignado; administrador general bajo política explícita | `quote_id`, `quote_version`, `expires_at`, `gross_delivery_cup`, `customer_fee_cup`, `promotion_covered_cup`, `replayed`, `preview_only=true` |
| `ed_quote_status_v1` | `operation_key` | Mismo sujeto autenticado y ámbito de operación | Estado `pending/completed/failed/expired`, respuesta inmutable si existe |
| `ed_delivery_settings_update_v1` | `expected_settings_version`, campos de tarifas permitidos, `reason`, `operation_key` | Solo administrador general; segunda verificación en SQL | Versión nueva y `audit_event_id` |
| `ed_delivery_audit_read_v1` | cursor, límite acotado, rango de fechas | Administrador general; supervisor solo si se aprueba formalmente | Eventos sin secretos ni direcciones privadas |

Los nombres son **propuestas de interfaz**, no funciones existentes. Las RPC de cotización no deben aceptar distancias ni importes calculados por el cliente. La dirección alternativa se valida y normaliza en servidor y se representa mediante un token opaco efímero vinculado al actor, no texto crudo como clave pública. No devolver direcciones completas en respuestas o trazas.

## 3. Modelo SQL conceptual

**Esquema privado `ed_delivery`**; no publicar tablas por PostgREST. Las columnas siguientes son diseño, no DDL listo para ejecutar.

- `settings(singleton PK, version bigint, rate_cup_per_km, min_km, min_fee_cup, round_to_cup, free_threshold_usd, changed_at)`; `CHECK` de rangos y precisión; versionado monotónico con CAS.
- `cart_snapshots(cart_id, revision, owner_id, canonical_cart_hash, subtotal_usd, origin_set_hash, created_at)`; no confiar en snapshots enviados por el navegador.
- `destination_snapshots(destination_token, owner_id, customer_id?, destination_version, canonical_destination_hash, expires_at)`; privacidad y TTL; los destinos persistentes se consultan por identidad/relación.
- `route_evidence(route_id, cart_id, cart_revision, destination_hash, origin_set_hash, settings_version, source, provider_reference, distances_json, verified_at, expires_at, verification_digest)`; solo escrituras del adaptador de rutas servidor; jamás confiar en un booleano `trustedByServer` del cliente.
- `quote_operations(actor_id, operation_key, payload_digest, status, quote_id?, snapshot_digest, result_json?, expires_at, created_at, updated_at, PRIMARY KEY(actor_id, operation_key))`; índices para estado y expiración; `result_json` solo generado por servidor; transiciones controladas.
- `quote_previews(quote_id PK, actor_id, cart_id, cart_revision, destination_hash, origin_set_hash, settings_version, route_id, gross_delivery_cup, customer_fee_cup, promotion_covered_cup, expires_at)`; `CHECK (gross_delivery_cup = customer_fee_cup + promotion_covered_cup)` si toda cobertura promocional es explícita; costo real del transportista se registra aparte.
- `settings_audit(event_id PK, actor_id, operation_key UNIQUE, previous_version, next_version UNIQUE, old_values, new_values, reason, created_at, previous_digest, digest)`; append-only y escritura únicamente por RPC autorizada; digest no sustituye permisos, respaldo ni controles de integridad.

**No crear relaciones con tablas reales hasta inspeccionar el esquema de staging bajo autorización independiente.** Identificadores, nombres, índices y precisión final requieren revisión de migraciones y modelo de datos existente.

## 4. Política de roles, RLS y privilegios mínimos

| Acción | Cliente | Gestor | Supervisor | Administrador general |
|---|---|---|---|---|
| Vista previa de cesta propia/asignada | Denegado | Permitido con asignación verificada | Denegado | Sujeto a alcance administrativo explícito |
| Lectura de cliente asignado | Solo datos propios mediante otros contratos | Solo asignado | Denegado | Según política administrativa |
| Cambio de tarifas | Denegado | Denegado | Denegado | Permitido con CAS y auditoría |
| Lectura de auditoría | Denegado | Denegado | **Pendiente aprobación** | Permitido |

**RLS por defecto:** `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY` donde corresponda; `REVOKE ALL` en tablas y funciones por defecto para `PUBLIC`, `anon`, `authenticated` salvo RPC autorizadas. Las tablas privadas no tienen SELECT/INSERT/UPDATE/DELETE directos desde clientes. El ejecutor de RPC debe validar identidad en el servidor y revalidar asignación en la misma transacción. `SECURITY DEFINER` solo si imprescindible, propietario dedicado sin `BYPASSRLS`, `search_path` fijado, nombres de objetos cualificados, sin SQL dinámico y auditoría de privilegios; evitar confiar en claims de rol editables por el cliente. Separar el rol de servicio de rutas del rol de consulta y del rol de administración. El backend no debe tratar el ID del actor recibido en payload como identidad.

## 5. Integridad de ruta y versiones

1. Resolver cesta y propietario desde servidor; bloquear/validar `cart_revision` y líneas. Obtener conjunto canónico **sin duplicados** de orígenes de despacho y la versión de almacenes.
2. Resolver destino autorizado; normalizarlo, generar hash interno estable y versión. Un cambio de dirección, destinatario o provincia invalida la ruta previa.
3. Obtener evidencia de proveedor o caché verificada en servidor, con `source`, referencia, distancia finita no negativa por cada origen, fecha y expiración. No aceptar datos del cliente como evidencia.
4. Verificar vinculación exacta `(cart_id,cart_revision,destination_hash,origin_set_hash,settings_version)` y caducidad. Cualquier cambio exige recotización.
5. Calcular en servidor tarifa de La Habana, mínimos, redondeo y promociones sobre un snapshot coherente; distinguir `gross_delivery_cup`, `customer_fee_cup` y `promotion_covered_cup`; no mezclar gasto real de mensajero.
6. Guardar vista previa y operación atómicamente. El precio mostrado caducado **nunca** se actualiza silenciosamente: exigir confirmación de nueva cotización.

## 6. Idempotencia, aislamiento y fallos

- Ámbito `(actor_id,operation_key)` con clave opaca validada, única en base de datos. El digest canónico incluye versión de contrato, actor, cart ID/revisión, destino/token, asignación, orígenes y operación; no incluye campos arbitrarios no verificados del cliente.
- La primera operación crea estado `pending` dentro de una transacción. Operaciones concurrentes sobre misma clave deben bloquearse o resolverse con `INSERT ... ON CONFLICT` y consulta de estado; el mismo digest puede recuperar resultado inmutable, otro digest da conflicto. Nunca devolver un resultado caducado.
- CAS para cambios de tarifas; versiones monotónicas. Cesta/destino/ruta y tarifas se revalidan antes de confirmar. `READ COMMITTED` con bloqueos explícitos o `SERIALIZABLE` según pruebas, sin prometer serialización sin verificar orden de bloqueos.
- SQLSTATE `40P01` y `40001`: reintentar **toda la transacción** con backoff exponencial, jitter y máximo de intentos. `55P03` (lock timeout) y `57014` (cancelación) requieren clasificación y política explícita; no reintentar indefinidamente.
- Commit con resultado desconocido: consultar `ed_quote_status_v1` con misma clave; si `completed` devolver respuesta almacenada; si `pending` esperar/reintentar acotado; si no existe, repetir bajo misma clave. No duplicar efectos externos.
- TTL comercial de ruta/cotización y TTL de retención de clave son **decisiones pendientes**. La eliminación de claves no puede permitir duplicación de efectos. El laboratorio de cinco/quince minutos no constituye política comercial aprobada.

## 7. Auditoría y reversión

Cada cambio administrativo registra actor autenticado, motivo, configuración previa y posterior, versión y operación en la **misma transacción**. No se permite UPDATE/DELETE de eventos desde RPC cliente. Rotación de permisos y exportación/backup se definen antes de staging. La reversión de tarifa es **un nuevo evento compensatorio** con nueva versión, no borrar auditoría; invalidar cotizaciones anteriores. Desactivar la bandera del cotizador ante incidente, conservar trazas sintéticas, restaurar código conocido y evaluar migraciones inversas antes de ejecutarlas. No habilitar pedidos ni servicios externos.

## 8. Matriz de aceptación previa a staging

| ID | Prueba exigida | Resultado esperado |
|---|---|---|
| A01 | Actor anónimo, rol falsificado o inactivo | Rechazo sin información sensible |
| A02 | Gestor A intenta cliente, cesta o dirección de gestor B | Rechazo y sin filtración |
| A03 | Supervisor intenta editar tarifa | Rechazo |
| A04 | Dos administradores actualizan misma versión | Una confirma; otra conflicto; auditoría única |
| A05 | Ruta con fuente cliente, origen alterado o caducada | Rechazo |
| A06 | Cambia cesta, dirección, almacén o tarifa | Invalidación y nueva cotización |
| A07 | Repetición idéntica y concurrente de clave | Una operación persistida, resultado consistente |
| A08 | Misma clave con payload distinto | Conflicto sin sobrescritura |
| A09 | Deadlock, timeout, cancelación y backend terminado | Rollback/reintento acotado, sin duplicados |
| A10 | Respuesta perdida tras commit | Consulta de estado recupera resultado |
| A11 | Pedido gratis por umbral o promoción | Bruto conservado, cliente cero, cobertura explícita |
| A12 | Auditoría manipulada, permiso insuficiente | Escritura denegada, detección según controles |
| A13 | Direcciones alternativas y clientes del extranjero | Privacidad y aislamiento; no sobrescribir dirección habitual |
| A14 | Desactivación/reversión | Cotizador inaccesible; datos y auditoría preservados |
| A15 | Logs, errores, límites y secretos | Sin datos personales/secretos; límites comprobados |

**Criterio de aprobación:** evidencias reproducibles para A01–A15, revisión de RLS y privilegios, decisiones pendientes firmadas y autorización independiente de staging. Las pruebas actuales son evidencias parciales de A04, A06–A11, no certificación completa.

## 9. Validación offline y decisiones abiertas

La validación de este documento verifica la presencia de contratos y controles en la especificación, **no ejecuta migraciones ni demuestra que RLS funcione en Supabase**. La integración debe adaptarse al esquema existente solo después de una revisión autorizada.

**Decisiones pendientes de dirección:** permisos de supervisor, TTL de cotización/clave, proveedor de rutas y política de indisponibilidad, alcance de administrador general sobre cestas, tarifa especial por producto, reglas de gratuidad y redondeo. No se alteran por defecto los acuerdos comerciales vigentes.

**Restricciones:** no acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos; no desplegar ni activar servicios.
