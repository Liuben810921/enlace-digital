# ENLACE DIGITAL — revisión focalizada de roles y procesos, 2026-11-19

Base: `f721afd4131c86cd635b2fa0f7299a7a4b526fe4`. Comparación inicial: identical.

## Defectos corregidos por inspección
1. Antes del bootstrap solo se comprobaba el nombre de `session_user` del pool; ahora se consultan y exigen atributos de `pg_roles`: LOGIN, NOSUPERUSER, NOBYPASSRLS, NOINHERIT.
2. El seguimiento de procesos eliminaba el hijo del conjunto activo solo al evento `close`; ahora también contempla `error` de `spawn`.
3. Se revisó la escalada de SIGTERM a SIGKILL: el indicador `killed` significa que se envió una señal, no que el proceso terminó. La condición de escalada utiliza estado de salida/señal, evitando bloquearla por una petición SIGTERM previa.

## Evidencia
- Ejecutor GitHub blob `49213449f8392d8052d596465ce19004904412ba`.
- Análisis sintáctico JavaScript en V8: **PASS**.
- Scripts SQL de bootstrap revisados en GitHub, no ejecutados.
- **0 ejecuciones PostgreSQL, 0 psql, 0 ejecuciones del runner como proceso**.
- No se han verificado comportamientos reales de roles, aislamiento o cancelación; quedan pendientes pruebas en clúster local desechable.
- No se ejecutaron GitHub Actions ni se accedió a Supabase, staging, producción, pedidos reales; sin descargas, despliegues ni costos.
