# Auditoría estática de compatibilidad RPC / Edge / esquema — PR #2

**Estado:** no ejecutado; análisis de archivos del PR y contratos, no pruebas de base de datos.

## Dependencias de las cinco RPC

1. `ed_cliente_registrar_privado`: `public.clientes_oficiales`, `enlace_auth.cliente_credenciales`, `public.clientes_oficiales_numero_seq`, `extensions.crypt` y `extensions.gen_salt`. La secuencia aún no está instalada y su propuesta START WITH 1 no es segura sin sincronización previa.
2. `ed_cliente_registrar_residencia_privado`: llama a la RPC anterior; requiere columnas `residencia`, `provincia`, `municipio`, `barrio` y `direccion_habitual`.
3. `ed_cliente_login_privado`: consulta y actualiza `enlace_auth.cliente_credenciales`, inserta en `enlace_auth.cliente_sesiones` y consulta `public.clientes_oficiales`. Depende de columnas de bloqueo y expiración y de bcrypt en `extensions`.
4. `ed_cliente_sesion_privada`: consulta sesiones no caducadas/no revocadas, une clientes oficiales y puede revocar el token. Requiere `revocada_en`, `expira_en` y datos de perfil.
5. `ed_cliente_direccion_privada`: invoca la RPC de sesión y actualiza exclusivamente el cliente derivado del token.

## Compatibilidad con Edge Function

La función Edge staging, desactivada por defecto, llama a registro, login, sesión, dirección y limitador de intentos; utiliza `service_role` para operaciones de destinatarios y direcciones. Las inserciones fijan `cliente_numero` desde la sesión; las actualizaciones por ID incluyen el mismo filtro. El script `scripts/check_staging_isolation.py` verifica ahora columnas utilizadas en las dos tablas propuestas, junto con contratos de aislamiento, privilegios propuestos y presencia de RLS.

## Hallazgos que impiden desplegar

- **Secuencia:** falta una inicialización atómica, idempotente y compatible con los IDs existentes. No ejecutar el borrador sin resolverla.
- **Migración no completamente idempotente:** `ALTER TABLE public.clientes_oficiales ADD CONSTRAINT ed_cliente_cuba_direccion_ck` carece de guardia para una ejecución repetida; podría fallar al reaplicar el esquema. Requiere revisión de catálogo y migración controlada, no una sustitución ciega.
- **Permisos de tablas nuevas:** habilitar RLS no otorga privilegios SQL. La propuesta revoca a roles públicos, pero debe comprobarse que `service_role` tenga los permisos necesarios para SELECT/INSERT/UPDATE sobre destinatarios y direcciones, y acceso a sus secuencias IDENTITY. No se asume que los privilegios predeterminados sean suficientes.
- **Semántica PL/pgSQL:** el parser CI valida solo SQL exterior. No se han compilado las funciones ni resuelto todas sus dependencias en una base aislada.
- **Aislamiento real:** las pruebas de mutación son estáticas; faltan solicitudes de dos cuentas ficticias y pruebas negativas con tokens caducados/revocados.

Se mantienen las restricciones: sin SQL con efectos, migraciones, despliegues, escrituras en Supabase, producción o fusión del PR.

## Correcciones verificadas en borrador — CI #100

- La creación de `ed_cliente_cuba_direccion_ck` está condicionada a su ausencia en `pg_catalog.pg_constraint`; evita el error por nombre duplicado al repetir el borrador. **Límite:** si ya existe una restricción con el mismo nombre pero expresión diferente, el guard no valida su equivalencia. Antes de instalar habrá que inspeccionar su definición y estado de validación.
- Se declaran `GRANT SELECT,INSERT,UPDATE` a `service_role` para las dos tablas nuevas y `GRANT USAGE,SELECT` para sus secuencias IDENTITY. La compatibilidad de estos permisos se ha comprobado estáticamente, **no** contra el catálogo de una base migrada.
- `scripts/check_staging_isolation.py` ahora exige el guard y los permisos. CI #100 (commit `8a5de05`) terminó `success`: TypeScript, análisis de 9/17/3 sentencias SQL y controles estáticos aprobados.
- Sigue bloqueada la secuencia `clientes_oficiales_numero_seq`: `START WITH 1` no demuestra compatibilidad con IDs existentes. No ejecutar migración hasta su inicialización segura y aprobación.

No se ejecutó SQL con efectos, migración ni despliegue.

## Inspección directa de staging — 2026-11-09 (solo lectura)

- Existen `public.clientes_oficiales`, `enlace_auth.cliente_credenciales` y `enlace_auth.cliente_sesiones`.
- `pgcrypto` está instalada en `extensions`; la referencia explícita `extensions.crypt` / `extensions.gen_salt` concuerda con el esquema observado.
- De las RPC `public.ed_cliente_*`, únicamente existe `ed_cliente_limite_privado(text, integer, integer)`. Las cinco RPC propuestas en el PR **no están instaladas**.
- No existen todavía `public.clientes_destinatarios`, `public.clientes_direcciones_entrega` ni `public.clientes_oficiales_numero_seq`.
- `public.clientes_oficiales` sigue vacía (`COUNT(*)=0`, `MAX(numero)=NULL`) en la lectura anterior. Este dato es temporal y debe reconfirmarse en la ventana de migración.

**Conclusión:** el borrador sigue siendo una propuesta incompleta, no una migración aplicable automáticamente. No hay evidencia de compilación de los cuerpos PL/pgSQL ni de pruebas de integración. Para avanzar se requiere una revisión de columnas/privilegios y una migración de staging autorizada, con preflight de secuencia y CHECK, antes de habilitar Edge.

## Auditoría de columnas y permisos de autenticación — staging (lectura 2026-11-09)

- `public.clientes_oficiales`: columnas actuales `numero`, `codigo`, `nombre`, `auth_user_id`, `residencia`, `creado_en`. **No** existen todavía `telefono`, `correo`, `estado`, `provincia`, `municipio`, `barrio`, `direccion_habitual`; se proponen en el borrador de esquema. Por ello, las RPC de registro/perfil no se pueden instalar aisladamente antes de dicho esquema.
- `enlace_auth.cliente_credenciales`: verificadas `cliente_numero`, `telefono_e164`, `password_hash`, `correo_recuperacion`, `intentos_fallidos` (default 0), `bloqueado_hasta` y `actualizado_en`; concuerdan con el borrador RPC.
- `enlace_auth.cliente_sesiones`: verificadas `cliente_numero`, `token_hash`, `expira_en`, `revocada_en`; `id` tiene default `gen_random_uuid()`. Concuerdan con el borrador RPC.
- Las tres tablas existentes tienen RLS activo y propietario `postgres`; `relforcerowsecurity=false`. En la lectura, `service_role` no tenía privilegios directos SELECT/INSERT/UPDATE sobre ellas y `anon`/`authenticated` no tenían SELECT. Esto es coherente con acceso por RPC `SECURITY DEFINER` **si las RPC se instalan con propietario privilegiado apropiado**. El rol propietario y los privilegios EXECUTE deben comprobarse después de la instalación autorizada.
- La Edge Function propuesta usa RPC para clientes/credenciales/sesiones, y acceso directo por `service_role` solamente a las dos tablas nuevas de destinatarios/direcciones, cuyos GRANT se incluyen en la propuesta.

**Bloqueos restantes:** instalación del esquema antes de las RPC, verificación de propietario efectivo y permisos tras instalación, compilación PL/pgSQL real y pruebas de integración con dos clientes ficticios. Los resultados de CI no equivalen a pruebas de ejecución SQL.

## Revisión posterior a instalación de esquema — 2026-11-09

El esquema de staging está instalado y se verificaron por lectura siete columnas de clientes, `pgcrypto` en `extensions`, cero clientes y cero de las cinco RPC propuestas. La migración de RPC permanece **sin ejecutar**.

**Hallazgos corregidos solo en GitHub:** la RPC interna de registro ahora rechaza contraseñas cuyo tamaño UTF-8 supere 72 bytes (límite de bcrypt), con validación equivalente en el borrador Edge. La RPC de registro con residencia limita la longitud de los campos de dirección. Se añadió `REVOKE EXECUTE ... FROM service_role` explícito para la función auxiliar de registro; `CREATE OR REPLACE` puede preservar privilegios existentes y la mera ausencia de un GRANT no es suficiente.

**Contrato de seguridad:** cinco `SECURITY DEFINER` con `search_path` vacío; cuatro RPC externas para `service_role`, auxiliar interna sin EXECUTE directo para `service_role`, `anon` ni `authenticated`. Registro y actualización de residencia son operaciones transaccionales dentro de una función; login usa `FOR UPDATE` para intentos fallidos y bloqueo; sesiones usan hash de token, caducidad y revocación; direcciones se limitan al número de cliente resuelto por token. El control de tasa de Edge depende de `ed_cliente_limite_privado` existente. Se requiere comprobar privilegios efectivos, integración y concurrencia tras cualquier futura instalación autorizada.

**Límites de verificación:** revisión estática y CI no equivalen a ejecución real de PL/pgSQL, pruebas de login, seguridad dinámica o despliegue. No se han ejecutado pruebas que creen usuarios ni se han habilitado pedidos/correos. La futura instalación de RPC necesita autorización separada y preflight actualizado.
