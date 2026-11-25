# Revisión de reversibilidad antes de ejecutar SQL en staging

Fecha 2026-11-09. Alcance autorizado: ejecutar solo operaciones de integración cuyos efectos sean completamente reversibles. **No se ejecutó ninguna operación de escritura.**

## Verificaciones

- CI commit `601d7cc8d36109d8ed6bb665c07fdb70f55e994b`: GitHub Actions run `42711960592`, success.
- Inspección del script `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql`: ya advierte que `nextval()` no se revierte con `ROLLBACK`.
- Catálogo real de staging `xqahthghvozeigbojhyi`, lectura de `pg_get_functiondef`: `ed_cliente_registrar_residencia_privado` invoca `ed_cliente_registrar_privado`, que utiliza `nextval` sobre `public.clientes_oficiales_numero_seq`.
- Conteos solo lectura en staging al verificar: 0 clientes, 0 destinatarios, 0 direcciones de entrega, 0 sesiones.

## Decisión

**No ejecutar el script integral**: registrar clientes ficticios avanza de forma persistente la secuencia, aun si las filas se revierten. La autorización exigía reversibilidad de *todos* los efectos; la advertencia del script no constituye permiso para avanzar la secuencia. No se intentó resetear la secuencia.

## Alternativas para autorización futura

1. Autorizar expresamente el avance irreversible del contador de clientes **solo en staging** (sin reiniciarlo), conservando `BEGIN ... ROLLBACK` para los registros; verificar previamente efectos de funciones y triggers. Esto no autoriza despliegues Edge ni producción.
2. Mantener reversibilidad estricta y limitarse a comprobaciones de solo lectura y pruebas offline; no ejecutar registros ni operaciones de integración que creen sesiones.

Los permisos de eliminación de Edge Functions siguen siendo requisito **exclusivo del despliegue**. No se modificaron secretos, roles, producción, pedidos, correos, productos, departamentos ni administradores.
