# Matriz de permisos, procedencia de rutas y auditoría de tarifas

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **CI:** https://github.com/Liuben810921/enlace-digital/actions/runs/43500675818 — success.

## Implementación sintética
- `tests/delivery-manager-policy-route-audit-isolated.cjs`: matriz de permisos por rol, contrato de procedencia de rutas y simulación de actualización de tarifas con registro de auditoría y hash SHA-256.
- `tests/delivery-manager-policy-route-audit-isolated.test.cjs`: matriz de 16 combinaciones rol/acción, casos de aislamiento por asignación de clientes, 14 escenarios de procedencia de rutas y validaciones de cambio de parámetros/auditoría.
- Workflow `isolated-delivery-quote.yml` actualizado y verificado.

## Política propuesta
| Acción | gestor | administrador_general | supervisor | cliente |
|---|---|---|---|---|
| quote:preview | sí | sí | no | no |
| customer:assigned:read | solo asignados | solo asignados | no | no |
| delivery:settings:update | no | sí | no | no |
| delivery:audit:read | no | sí | sí | no |

La política de lectura de auditoría para supervisor es una **propuesta de prueba**, sujeta a aprobación de producto y a los permisos definitivos del panel. No se ha implementado ningún permiso real.

## Rutas
Se exigen identificadores de ruta, destino, cesta, almacenes, versión de tarifas, fecha de verificación y fuente de servidor. Se rechazan discrepancias, distancias no finitas y caducidad superior a 15 minutos (valor de prueba, no decisión comercial). El indicador `trustedByServer` debe ser generado por un backend autenticado: **una bandera suministrada por el cliente no es una garantía de procedencia**.

## Auditoría
La simulación de cambio solo autoriza `administrador_general`, valida umbral USD y múltiplo CUP, y devuelve un evento con actor, motivo, fecha, valores anteriores y nuevos, versiones y hash SHA-256. La operación indica `committed:false`: no modifica ningún dato. La huella detecta alteraciones accidentales del evento de prueba; no proporciona por sí sola autenticidad ni inmutabilidad. Para producción se requiere almacenamiento append-only, control transaccional de versión, protección de claves/firmas si procede, trazabilidad y autorización de lectura.

## Pendientes antes de staging
1. Identidad autenticada y permisos efectivos comprobados en backend.
2. Servicio real de rutas verificadas, con procedencia y vinculación a destino/orígenes.
3. Persistencia transaccional de configuraciones y auditoría, sin permitir cambios a gestores.
4. Revisión de roles y acceso del supervisor; límites de privacidad y conservación de registros.
5. Autorización específica antes de tocar Supabase staging o integrar datos reales.

**No se modificaron Supabase, producción, clientes reales ni pedidos.**
