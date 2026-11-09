# Contratos Edge ↔ SQL y correcciones de respuestas — staging

PR #2; fecha 2026-11-09. **Solo GitHub; sin escrituras Supabase.**

## Verificaciones

- Commit documental anterior `d5fdc5565cdd065cc0ffdcd83cdf691dcec006be`: GitHub Actions `42707479680`, success.
- Cambios de controlador `7b065a8cee16adb8ad00be463cd9be6676c25774` y tests `e8864da9e194e044af5b433338a95734bc1593cb`: GitHub Actions `42707804038`, success.
- Test estático coteja los nombres y parámetros declarados de las cuatro RPC utilizadas por Edge contra `sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql`. **No** valida firmas de la base de datos en ejecución ni semántica PL/pgSQL.

## Defectos corregidos

1. `ed_cliente_direccion_privada` devuelve booleano. Antes, `false` sin error se traducía erróneamente en HTTP 500; ahora devuelve 403, manteniendo 500 para error real de RPC. Prueba de ambos caminos.
2. `ed_cliente_sesion_privada(..., p_revocar=true)` devuelve `{cerrada:true}`, no un perfil de cliente. Antes `logout` lo exponía como `cliente`; ahora devuelve `{closed:true}`. Prueba del contrato de respuesta.

## Límites

El proyecto no contiene autorización de despliegue. Permisos de eliminación de Edge pendientes exclusivamente para la etapa de despliegue/reversión. Mocks offline no prueban permisos RLS, concurrencia, persistencia ni sesión real. Sin despliegues, secretos, cambios de roles, correos, pedidos reales, producción ni datos modificados.
