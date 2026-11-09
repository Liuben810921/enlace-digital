# Propuesta NO EJECUTAR — secuencia de clientes staging

**Estado:** revisión de diseño; no es migración autorizada. Solo staging. No ejecutar SQL de este documento ni en SQL Editor ni en producción.

## Riesgo comprobado

La propuesta de esquema crea `public.clientes_oficiales_numero_seq AS integer START WITH 1`, mientras la tabla `public.clientes_oficiales` ya existe y su `numero` es clave primaria. Si hay registros con identificadores positivos, el primer `nextval` podría reutilizar un número. La existencia de un índice UNIQUE no evita el fallo de registro; solamente impide la colisión silenciosa. `CREATE SEQUENCE IF NOT EXISTS` por sí solo tampoco sincroniza el contador.

## Procedimiento de futura instalación, sujeto a aprobación

1. Deshabilitar nuevas altas y cualquier otro escritor que asigne `numero`; confirmar que el bloqueo de escritura se mantiene hasta terminar la inicialización. No confiar únicamente en una lectura previa de MAX.
2. Abrir una ventana de mantenimiento y verificar en catálogo la secuencia, su propietario, dependencias, incremento, mínimo/máximo y valor de estado, además de `MAX(numero)` y la posibilidad de números asignados fuera del contador.
3. Bajo exclusión de escrituras concurrentes, crear o inspeccionar la secuencia. Calcular un siguiente número seguro **mayor que el máximo de la tabla y que cualquier valor ya reservado por la secuencia**. Si está vacía, respetar el mínimo y comenzar por 1. Si existe, no retrocederla. Confirmar capacidad del tipo `integer`.
4. Ajustar la secuencia únicamente mediante una operación autorizada, teniendo en cuenta que `setval` y `nextval` no se revierten con ROLLBACK. Una migración SQL idempotente debe comparar el estado real cada vez y jamás reiniciar el contador a 1 en una repetición.
5. Validar los permisos de USAGE/SELECT y propietario, que `nextval` sea invocable por el propietario efectivo de la RPC SECURITY DEFINER, y que las tablas mantengan RLS y restricciones. Rehabilitar altas solo después de pruebas controladas y aprobación.

**No se incluye aquí un bloque `setval` ejecutable**: la implementación concreta requiere confirmar la estrategia de exclusión de concurrencia y el estado real de la secuencia en la ventana de migración. Se evita una receta que pudiera bajar el contador o colisionar.

## Aislamiento y verificación

El script `scripts/check_staging_isolation.py` y GitHub Actions inspeccionan las rutas de destinatarios y direcciones sin conectarse a una base de datos. Las pruebas de integración negativas futuras deben incluir: token de A con ID de destinatario de B (404 y ninguna modificación), perfil de A sin registros de B, token revocado o caducado (401 y ninguna escritura), dirección ocasional de B no reutilizada ni actualizada por A, y registro con teléfono duplicado. Las comprobaciones de código no sustituyen esas pruebas.

No se ha ejecutado ningún SQL de efectos, migración ni despliegue.

## Evidencia de staging vacío (2026-11-09; lectura solamente)

- Consulta directa a `public.clientes_oficiales`: `COUNT(*) = 0`, `MAX(numero) = NULL`.
- Consulta de catálogo `to_regclass('public.clientes_oficiales_numero_seq')`: `NULL` (no instalada).
- El borrado de clientes ficticios ocurrió **solo en la base anterior**, no en staging; no se transfirieron datos.
- En este estado observado, `CREATE SEQUENCE ... START WITH 1` es compatible con la tabla vacía. **No autoriza ejecutarlo aún**: la ausencia de datos y secuencia debe volver a comprobarse en la misma ventana de instalación, bajo exclusión de escritores. Si cambia cualquiera de esas condiciones, detener y aplicar el procedimiento conservador anterior.
- El control estático de CI rechaza reinicios destructivos de la secuencia en la propuesta y exige sus privilegios explícitos; **no demuestra** ausencia de concurrencia ni compila los cuerpos PL/pgSQL.

**Puerta de aprobación:** migración y despliegue continúan prohibidos hasta autorización explícita y verificación de prerrequisitos. No activar pedidos ni correo reales.

## Preflight incorporado al borrador (commit 230b13a)

El archivo `sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql` ahora inicia su transacción con un bloque `DO $preflight$` que aborta si (1) ya existen clientes, (2) ya existe la secuencia de clientes o (3) existe una restricción Cuba con el nombre reservado que requiere comprobar equivalencia. Esto evita aplicar a ciegas el `START WITH 1` sobre un estado distinto del observado y evita ignorar un CHECK no equivalente. El preflight **no sustituye** la exclusión operativa de escritores concurrentes: una transacción sola no impide que otro proceso registre clientes entre las verificaciones. La instalación sigue sin autorización.

## Orden de instalación controlada — NO EJECUTAR

1. Obtener autorización específica para **staging** y confirmar proyecto `xqahthghvozeigbojhyi`. Mantener la Edge Function deshabilitada, sin correo ni pedidos reales. Prohibir escritores concurrentes de clientes durante toda la operación.
2. Antes de modificar datos, consultar catálogo y comprobar que `public.clientes_oficiales` está vacía, que la secuencia no existe y que no hay una restricción `ed_cliente_cuba_direccion_ck` previa. Verificar propietario de las tres tablas y que `pgcrypto` está en `extensions`. Si alguna condición falla, abortar y revisar, sin reiniciar contadores.
3. Revisar el SQL completo de `sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql`, incluyendo su preflight transaccional, columnas, CHECK, RLS, GRANT de tablas nuevas y secuencias. La ejecución real requiere autorización adicional. No aplicar automáticamente sobre un esquema existente con definiciones diferentes.
4. Solo después de validar el esquema, revisar `sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql` y el propietario efectivo de las cinco funciones `SECURITY DEFINER`. La función auxiliar `ed_cliente_registrar_privado` **no debe tener EXECUTE para `service_role`**; únicamente el wrapper de residencia puede registrar clientes desde Edge. `anon` y `authenticated` no deben ejecutar ninguna de las cinco RPC.
5. Verificar tras instalación autorizada los permisos efectivos mediante `has_function_privilege`, las columnas y CHECK con `pg_get_constraintdef`, el estado de secuencia y que el propietario puede acceder a las tablas RLS. No habilitar Edge todavía.
6. Con autorización separada para pruebas, ejecutar la batería ficticia con ROLLBACK, confirmar sus aserciones y comprobar aislamiento entre dos clientes. **Advertencia:** operaciones `nextval` no se revierten con ROLLBACK; la secuencia puede avanzar aunque se reviertan filas. No prometer estado numérico idéntico.
7. No desplegar ni habilitar la Edge Function hasta revisar los resultados de integración, origen CORS, controles de tasa y ausencia de accesos entre clientes. El despliegue requiere autorización propia.

**Estado de esta guía:** preparación y análisis de GitHub solamente; no se ha ejecutado la instalación.

## Preflight actualizado — comprobación de solo lectura, 2026-11-09

- Staging `xqahthghvozeigbojhyi`: clientes `COUNT(*)=0`, `MAX(numero)=NULL`; secuencia `to_regclass(...)=NULL`; restricción `ed_cliente_cuba_direccion_ck`: 0; cinco RPC privadas propuestas instaladas: 0.
- Las tablas `public.clientes_oficiales`, `enlace_auth.cliente_credenciales` y `enlace_auth.cliente_sesiones` tienen RLS activo y propietario `postgres`.
- Los requisitos de catálogo observados son compatibles con una instalación inicial **solo en staging**. No demuestran que el SQL sea seguro para ejecutar ni garantizan que el estado permanezca igual.
- CI del commit `d3f0ab3` falló por una aserción textual heredada sobre el mensaje de permisos; el borrador de prueba conserva ahora el marcador esperado sin retirar las verificaciones ampliadas (commit `cc4bd50`). Confirmar CI verde antes de proponer autorización.

**Autorización pendiente (no concedida):** una vez que CI esté verde y se haya completado revisión manual de las cinco RPC, solicitar permiso explícito para ejecutar exclusivamente el esquema revisado en staging, sin Edge Function, correo ni pedidos reales. Antes de cualquier ejecución, volver a comprobar catálogo y exclusión de escritores. La instalación de RPC, pruebas con datos ficticios y despliegue se autorizarán por separado.
