# Preflight de efectos irreversibles en staging — 2026-11-09

## Estado
- GitHub Actions sobre `187b82932e88c103494b2686c4b83a6e2846221a`: run `42712299122`, success.
- Inspección **solo lectura** en staging `xqahthghvozeigbojhyi` de cuerpos `pg_get_functiondef`, triggers de las tablas del circuito y dependencias de secuencias.
- `ed_cliente_registrar_residencia_privado` invoca `ed_cliente_registrar_privado`, que usa `nextval('public.clientes_oficiales_numero_seq')`: incremento autorizado explícitamente.
- `public.clientes_destinatarios.id` es `GENERATED ALWAYS AS IDENTITY` respaldado por `public.clientes_destinatarios_id_seq`.
- `public.clientes_direcciones_entrega.id` es `GENERATED ALWAYS AS IDENTITY` respaldado por `public.clientes_direcciones_entrega_id_seq`.
- Las secuencias identity también avanzan con INSERT y no revierten su valor con ROLLBACK. **No están cubiertas por la autorización**, que nombra solo la secuencia de clientes.
- No se encontraron triggers no internos en las tablas de clientes, destinatarios, direcciones, credenciales y sesiones revisadas. Inspección de funciones SQL no mostró llamadas externas de red; esto no sustituye una auditoría exhaustiva de extensiones o funciones fuera del circuito.

## Decisión

**No ejecutar la batería integral** `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql`, ya que incluye INSERT de destinatario y dirección, con efectos irreversibles en dos secuencias no autorizadas. Ninguna operación de escritura se realizó en esta revisión. No se reiniciaron secuencias.

## Siguiente autorización específica

Permitir avance de `public.clientes_destinatarios_id_seq` y `public.clientes_direcciones_entrega_id_seq` **solo en staging**, además del contador de clientes previamente autorizado, sin resetear contadores. Entonces ejecutar la batería con BEGIN/ROLLBACK, comprobar conteos y que no queden registros ficticios. No autoriza despliegues Edge, secretos, roles, producción, correos ni pedidos reales. Los permisos de eliminación de Edge Functions siguen siendo bloqueo exclusivo de despliegue.
