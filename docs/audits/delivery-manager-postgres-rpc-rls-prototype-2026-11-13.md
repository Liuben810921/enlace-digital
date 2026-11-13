# ENLACE DIGITAL — Prototipo aislado PostgreSQL de RPC, permisos, RLS y auditoría

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **GitHub Actions:** [43504193014](https://github.com/Liuben810921/enlace-digital/actions/runs/43504193014) — **completed/success**.

## Entregables

- `tests/postgres-delivery-rpc-rls-lab.sql`: esquema `ed_rpc_lab` en PostgreSQL 16 desechable; roles ficticios `ed_lab_gestor_a`, `ed_lab_gestor_b`, `ed_lab_admin`, `ed_lab_supervisor`; tablas sintéticas de cestas, rutas, configuración, cotizaciones y auditoría; políticas RLS de lectura; privilegios mínimos de acceso directo; funciones RPC `quote_preview` y `update_rate`.
- `tests/postgres-delivery-rpc-rls-lab.py`: batería de consultas con `SET ROLE`, comprobaciones positivas y negativas, ocho solicitudes concurrentes con la misma clave, control de versiones y auditoría.
- `.github/workflows/isolated-delivery-quote.yml`: ejecución del prototipo junto a las pruebas Node y PostgreSQL anteriores.

## Evidencia de pruebas

| Caso | Resultado |
|---|---|
| RLS: gestor A solo lee su cesta; gestor B solo la suya | PASS |
| Acceso de gestor B a cesta/cliente de gestor A vía RPC | DENEGADO |
| Supervisor sin permisos de lectura de cesta o cotización | DENEGADO |
| Gestores sin permiso de modificación de tarifas | DENEGADO |
| Administrador general puede cotizar y actualizar tarifa | PASS |
| Actualización con versión obsoleta | DENEGADO |
| Cambio de tarifa crea evento de auditoría con valores anterior y nuevo | PASS |
| Lectura de auditoría por gestor y modificación directa de auditoría por administrador | DENEGADAS |
| Repetición de misma operación y rechazo de cotización obsoleta tras cambio | PASS |
| Ocho solicitudes concurrentes con misma clave y una fila final | PASS |
| Separación de importe bruto, cobro al cliente y promoción | PASS |

**Corrección verificada:** primera ejecución falló por una función de prueba llamada `concurrent` que ocultaba el módulo `concurrent.futures`. Se renombró a `parallel_quote`. Segunda ejecución: `success`.

## Límites de seguridad: no apto para staging

1. **El propietario de las funciones `SECURITY DEFINER` es `postgres` (superusuario del laboratorio).** Puede eludir RLS: las políticas RLS se comprueban en las lecturas directas de roles sintéticos, mientras que las RPC realizan su propia comprobación de identidad/asignación. **No se ha demostrado una RPC con propietario no privilegiado sometido a RLS.** Antes de staging se exige propietario dedicado sin `BYPASSRLS`, políticas revisadas y pruebas de privilegios efectivos.
2. **La identidad se obtiene de `current_setting('role')` y `SET ROLE` del laboratorio.** No constituye autenticación web. En integración se debe usar identidad validada en servidor y autorización vinculada a la sesión, sin permitir impersonación.
3. **Rutas `server_fixture` y datos sintéticos.** No se ha verificado un proveedor externo, una dirección real ni una procedencia criptográfica. Falta vincular evidencia de ruta a destino, conjunto de almacenes, cesta y versión de tarifas.
4. **Huella `md5` solo de laboratorio.** No utilizar como digest de integridad de seguridad ni canonización definitiva. Falta incorporar el contexto completo, caducidad de clave y estado de operación.
5. **Tarifa simplificada.** El prototipo calcula tarifa desde kilómetros sintéticos, mínimos y gratuidad por umbral; no incluye todas las variantes comerciales ni tarifas especiales.
6. **Auditoría limitada.** Una fila transaccional por versión de tarifa, sin almacenamiento inmutable, firma ni política de retención.
7. **Concurrencia probada para misma clave**, pero no para todas las carreras de modificación de cesta, destinatario, almacén y ruta en la misma RPC.

## Criterios de avance

- Reemplazar el propietario privilegiado por un rol técnico de privilegios mínimos, con RLS efectivamente aplicada o límites de acceso equivalentes y demostrados.
- Probar funciones con roles reales de conexión simulados sin posibilidad de asumir identidades ajenas.
- Vincular versión de cesta, destino, almacenes, tarifa y evidencia de ruta en una transacción.
- Implementar digest canónico fuerte, operaciones con estado, expiración, recuperación de commit incierto y auditoría resistente a alteraciones.
- Ejecutar matriz A01–A15 completa en PostgreSQL desechable antes de solicitar autorización independiente para staging.

**Dictamen:** avance de laboratorio aprobado; **NO-GO para staging**. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
