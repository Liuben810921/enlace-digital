# Plan de validación integrada de seguridad — ENLACE DIGITAL (solo preparación)

Fecha: 2026-11-10. Base: auditoría sintética F6-B13–F6-B30, GitHub Actions #151. **Documento de planificación; no autoriza ni ejecuta cambios en Supabase.**

## Alcance y puertas de autorización
1. **Ahora, solo GitHub:** preparar matriz, fixtures ficticios, casos de aceptación, límites, procedimientos y reversión; PR #3 permanece borrador. Sin credenciales, datos históricos ni llamadas a staging.
2. **Siguiente autorización independiente:** ejecutar pruebas controladas **exclusivamente en Supabase staging**, previa identificación administrativa del proyecto y confirmación de entorno, permisos y respaldos. Prohibidos pedidos reales, correo saliente, servicios de pago, producción y migraciones destructivas.
3. **Otra autorización independiente:** leer datos históricos o ejecutar cambios en producción. Ninguna de esas acciones forma parte de este plan.

## Precondiciones obligatorias (NO-GO si faltan)
- Confirmar identificador de proyecto staging por vía administrativa autorizada; cotejar URL y entorno, sin publicar secretos.
- Obtener constancia de backup/reversión, migraciones aplicadas y propietarios de recursos; no alterar tablas compartidas ni datos existentes.
- Confirmar banderas de pedidos y correo reales desactivadas y ausencia de webhooks/pagos/efectos externos en las rutas ensayadas.
- Crear identidades ficticias aisladas, con prefijo y fecha de prueba; cuentas de Cuba y extranjero, roles cliente, gestor, supervisor, admin general y principal solo si están implementados en staging. No reutilizar clientes reales.
- Definir borrado seguro únicamente de registros ficticios creados por la prueba y documentar las referencias antes de ejecutar.
- Fijar límites de volumen, concurrencia, duración, rate limits y criterio de interrupción inmediata; no evadir defensas ni desactivar RLS.

## Matriz de validación integrada (ejecución futura sujeta a autorización)

| ID | Dominio | Prueba segura con datos ficticios | Criterio de aceptación | Reversión |
|---|---|---|---|---|
| ST-01 | Identidad/JWT | Registro e inicio de sesión por teléfono y contraseña, sesión persistente y cierre; token inválido, expirado, de otro usuario | Identidad de DB vinculada al sujeto autenticado, nunca a identidad indicada por cliente; tokens inválidos denegados | Revocar sesiones ficticias y borrar cuentas de ensayo si se autoriza |
| ST-02 | ACL/RLS | Leer/editar perfil, direcciones y destinatarios entre dos clientes ficticios, y probar privilegios de supervisor, admin general y principal | Denegación de acceso cruzado, de escalada y de escritura por supervisor; permisos mínimos | Restaurar permisos solo mediante migración aprobada |
| ST-03 | Registro Cuba/extranjero | Cuba requiere dirección habitual, extranjero no; nombre y al menos un apellido; teléfonos nacionales e internacionales | Validación coherente en frontend y backend; sin duplicados; errores seguros | Borrar perfiles ficticios y sus dependencias |
| ST-04 | Destinatarios | Añadir varios desde checkout ficticio; edición; aislamiento por cliente y snapshot histórico del pedido de prueba | Asociación correcta; modificación posterior no altera snapshot; ninguna escritura en pedidos reales | Borrar destinatarios y pedidos ficticios de ensayo |
| ST-05 | Contrato de entrada | JSON crudo duplicado, escapes, Unicode, exponentes, cantidades inválidas, claves largas, payload alterado | Rechazo antes de JSONB/efecto, sin consumir clave idempotente; canonicalización consistente | Sin efecto persistente salvo ensayos válidos identificados |
| ST-06 | Idempotencia | Misma identidad/clave/payload: NEW luego REPLAY; payload distinto: CONFLICT; dos identidades con misma clave | Una sola operación por identidad/clave, sin cruces | Borrar operaciones sintéticas del ensayo únicamente |
| ST-07 | Concurrencia | Reintentos simultáneos acotados con claves de ensayo y sin pagos ni correo | Un efecto autorizado; transacciones atómicas; sin duplicados ni bloqueo prolongado | Cancelar sesiones de prueba y limpiar datos ficticios |
| ST-08 | Recuperación | Cancelación, timeout, rollback, commit ambiguo y reconexión controlada | Reconciliación con misma clave; límites de reintento y no duplicación; logs sin secretos | Revertir transacciones y retirar datos ficticios |
| ST-09 | Sesión/recuperación | Recuperación por correo opcional solo con salida de correo desactivada/simulada; cooldown, caducidad, replay, revocación | Tokens de un solo uso, sin fuga de información y sin envío real | Invalidar tokens ficticios |
| ST-10 | Checkout sin activar pedidos | Validación de dirección, entrega propia/tercero, stock y precios en simulación o dry-run | Ningún pedido real, correo, pago ni efecto externo; estados y totales coherentes | Eliminar únicamente registros de prueba autorizados |
| ST-11 | Observabilidad | Revisar registros de ensayo sin exponer contraseñas, tokens, claves, teléfonos o direcciones completas | Auditoría suficiente para incidentes sin fuga de datos | Retención y eliminación según política aprobada |
| ST-12 | Resiliencia | Pruebas negativas de errores de red, fallos parciales, rate limiting y cancelación dentro de límites acordados | Denegación segura, no escalada y recuperación sin efectos duplicados | Detener carga de prueba y restaurar configuración autorizada |

## Secuencia de ejecución futura
- **Etapa A (solo lectura staging autorizada):** inventario de configuración y esquemas, políticas RLS, grants, JWT, banderas de servicios, migraciones y rollback. No extraer filas históricas.
- **Etapa B (escrituras sintéticas staging autorizadas por separado si hiciera falta):** ejecutar ST-01 a ST-12 con cuentas ficticias, aislamiento de transacciones, límites y registro de evidencias anonimizadas.
- **Etapa C:** limpiar exclusivamente los datos de ensayo identificados; verificar integridad y ausencia de efectos externos; CI de regresión; matriz PASS/FAIL/BLOCKED.
- **Etapa D:** aprobación explícita posterior para cambios operativos o habilitación de pedidos, nunca implícita por CI verde.

## Política de detención y recuperación
Parar inmediatamente ante acceso a datos reales, permisos inesperados, correo/pedido/pago saliente, cambios de producción, saturación, pérdida de aislamiento o imposibilidad de identificar datos de ensayo. No intentar eludir restricciones. Registrar identificadores de pruebas, revertir únicamente objetos de ensayo aprobados y presentar un informe antes de continuar.

## Evidencia y criterios de cierre
Cada prueba tendrá ID, fecha, versión/commit, entorno verificado, resultado esperado/observado, evidencia sin secretos, severidad, responsable, corrección y CI posterior. Un FAIL o BLOCKED crítico impide el cierre. Las pruebas sintéticas F6-B13–F6-B30 aprobadas **no sustituyen** la validación integrada ni certifican seguridad total.

**Estado:** PLAN PREPARADO; NO EJECUTADO EN STAGING. Sin autorización para acceso a Supabase, lectura de históricos, cambios operativos, despliegues, correos o pedidos.
