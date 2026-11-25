# Cierre de preparación SQL y batería de staging — 2026-11-09

## Entregables
1. `sql/propuestas/staging_registro_destinatarios_no_ejecutar.sql`: secuencia ausente incorporada, columnas de perfil, destinatarios, direcciones y restricciones; RLS restrictiva.
2. `sql/propuestas/staging_auth_rpc_borrador_no_ejecutar.sql`: cinco RPC de registro base, registro residencia, login, sesión/revocación y dirección. Roles anon/authenticated sin EXECUTE; service_role explícito.
3. `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql`: **17 aserciones** en una única transacción `BEGIN/ROLLBACK`, con teléfonos y correos ficticios `.invalid`; NO ejecutado.
4. `sql/pruebas/staging_preflight_lectura.sql`: consultas de catálogo y conteos, solo lectura.
5. Workflow de PR ampliado para comprobar secuencia, rutas, presencia de 17 aserciones, rollback y deno check.

## Hechos verificados
Staging carece de `public.clientes_oficiales_numero_seq`; `pgcrypto` existe en esquema `extensions`; `clientes_oficiales` tenía 0 registros al consultar. Se recuperaron cuatro archivos de GitHub tras los cambios y se realizaron comprobaciones de contenido: 13/14 verificaciones genéricas positivas. La comprobación restante (`stagingOnly`) marcó falso porque el **workflow contiene el ID productivo exclusivamente como aserción negativa** (`assert 'ubrvuplslconfxwpfzxj' not in s`), no como URL operativa. No significa que el código conecte a producción.

## Alcance real de pruebas
Las 17 aserciones prueban registros Cuba/extranjero, dirección habitual, rechazo de datos incompletos/duplicados, hash de contraseña, contraseña incorrecta, login, perfil, bloqueo de cambio de dirección de extranjero, edición de dirección Cuba, no contaminación de otro cliente, FK destinatario, dirección de entrega, revocación, caducidad y permisos de login.

**No prueban todavía** propietario cruzado en la API `recipient-save`, límites IP, concurrencia de duplicados, carreras de sesión, RLS bajo todas las identidades ni historial inmutable de pedidos. Requieren pruebas Edge separadas y autorización. La batería es un borrador preparado, no validado mediante ejecución SQL; no se debe presentar como aprobada.

## Reversión y seguridad
Los tests terminan en `ROLLBACK`; para migraciones futuras se exige backup y un plan de reversión revisado. No eliminar datos de clientes ni tablas existentes. La propuesta de secuencia requiere verificar valores máximos si se crean datos entre preflight y aplicación. Los permisos de propietario de funciones SECURITY DEFINER y el `search_path` necesitan revisión final. La propuesta original de esquema añade constraint NOT VALID que debe revisarse frente a datos históricos.

## CI
El último cambio de workflow es `f4871b9`; al consultar sus runs inmediatamente después, no había ninguno devuelto. La ejecución anterior #5 sí pasó Deno check y las invariantes anteriores, pero **no cubre las nuevas aserciones**. Esperar el nuevo run de PR y revisar logs.

## Estado
Ningún SQL de escritura ejecutado; ninguna migración instalada, ningún despliegue, ningún merge. PR #2 sigue en borrador.
