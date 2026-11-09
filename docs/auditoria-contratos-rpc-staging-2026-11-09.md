# Auditoría estática de contratos — staging (sin ejecución)

Verificado tras GitHub Actions #39 (run 42668461006, SUCCESS): pglast 7.22 analizó los SQL de RPC, esquema y pruebas; deno check y guards aprobaron.

## Bloqueos para una futura habilitación

1. **VERIFICADO EN STAGING POR CONSULTA READ-ONLY (2026-11-09):** `public.ed_cliente_limite_privado(p_clave text,p_max integer,p_ventana_seg integer) RETURNS boolean` ya existe, `SECURITY DEFINER`, propietario `postgres`, `search_path` vacío; `service_role` tiene EXECUTE y `anon`/`authenticated` no. La Edge Function invoca la firma correcta. Las cinco RPC propuestas en v4 aún no existen en staging. No se ejecutó ninguna función ni migración.
2. La Edge Function utiliza el rol de servicio para operaciones directas sobre `clientes_destinatarios` y `clientes_direcciones_entrega`. Los filtros por `cliente_numero` están presentes en las rutas de actualización y consulta, pero se requiere prueba funcional de aislamiento antes de habilitar.
3. La función de registro base `ed_cliente_registrar_privado` permite crear una cuenta sin residencia; la envoltura `ed_cliente_registrar_residencia_privado` impone residencia y dirección cubana. Evaluar restringir la función base para evitar invocación directa desde otros consumidores con rol de servicio.
4. El SQL v4 utiliza `CREATE OR REPLACE FUNCTION`, `SECURITY DEFINER` y grants para `service_role`; verificar propietario, search_path y privilegios efectivos antes de aprobar cualquier migración.
5. El analizador PostgreSQL valida sintaxis SQL externa, **no** ejecución ni validación semántica de cuerpos PL/pgSQL, dependencias o datos históricos.

## Restricciones

Sin migraciones, sin despliegues, sin correos reales, sin escrituras en staging ni producción y sin fusión del PR. La batería SQL de rollback no se ha ejecutado.

## Catálogo staging verificado con SELECT (2026-11-09)

- Existen `enlace_auth.cliente_credenciales`, `enlace_auth.cliente_sesiones`, `enlace_auth.solicitudes_limite` y `public.clientes_oficiales`. Las cuatro tienen RLS habilitado y SELECT denegado a anon, authenticated y service_role según has_table_privilege; las RPC SECURITY DEFINER operan como propietario, por lo que se requiere revisión de propietarios y permisos efectivos antes de migrar.
- `pgcrypto` y `uuid-ossp` están instaladas en esquema `extensions`.
- Cero filas actuales en clientes_oficiales, cliente_credenciales y cliente_sesiones; MAX(numero) NULL. No presupone que siga vacío en una migración futura.
- Las columnas de teléfono, correo, estado, provincia, municipio, barrio y dirección habitual aún no existen en clientes_oficiales; tampoco las tablas clientes_destinatarios ni clientes_direcciones_entrega. Dependen de la propuesta de esquema v4 no ejecutada.
- La función `ed_cliente_limite_privado` existe con retorno booleano y privilegio EXECUTE solo service_role de los tres roles consultados. Las cinco RPC nuevas aún no están instaladas.
- Estas son comprobaciones de catálogo; no se invocaron funciones ni se escribieron datos.
