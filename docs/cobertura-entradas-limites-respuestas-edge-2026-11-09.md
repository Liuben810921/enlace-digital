# Cobertura offline: entradas, límites y respuestas Edge

PR #2, proyecto staging `xqahthghvozeigbojhyi`. Fecha 2026-11-09.

## GitHub Actions

- Commit previo `d56b1a605d9521abbd336d10ef48a2fba9a387ed`: run `42707015344`, `success`.
- Commit de pruebas `159269f2fec2ef3f038646f110a5cd5c5348538f`: run `42707363042`, `success`.

## Cambios y resultados

Se añadieron cuatro pruebas Deno offline al controlador real con cliente Supabase simulado: entradas inesperadas y validación, rate limit global fail-closed previo a RPC privadas, cabeceras de seguridad y CORS, y rechazo de cuerpos JSON inválidos. La suite pasa en GitHub Actions. No se modificó el controlador Edge porque no se demostró un fallo de código que exigiera corregirlo en esta ronda.

## Limitaciones

Los tests no prueban persistencia real, RLS, permisos de eliminación de Edge, configuración de red, concurrencia, autenticación real ni despliegue. La revisión de permisos de eliminación sigue pendiente **solo como condición para desplegar**; no bloquea desarrollo offline. No se realizaron escrituras en Supabase ni cambios de secretos, roles, correos, pedidos reales o producción.
