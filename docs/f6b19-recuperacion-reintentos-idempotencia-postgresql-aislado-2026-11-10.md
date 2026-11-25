# F6-B19 — Recuperación e idempotencia transaccional sintética NORM-v1

**Fecha:** 2026-11-10. **Base:** `5b4542e162a416c2cbf232f2611dd6ea770671c0`. GitHub Actions #45 (42906037930) y #593 (42906037946): **SUCCESS**, sin pasos fallidos. **Solo PostgreSQL 17 desechable de GitHub Actions, datos ficticios y scripts de GitHub**; no se consulta ni modifica Supabase, staging, producción o clientes reales.

## Método y pruebas

El runner `scripts/run_f6b19_recovery_isolated.py` reutiliza la tabla auxiliar y la función `reserve_new` de F6-B18, sin tocar tablas operativas. Abre sesiones independientes `psql`, comprueba el estado de una transacción sintética y verifica conteos exactos de filas de la tabla auxiliar ficticia.

| Gate | Caso | Resultado esperado |
|---|---|---|
| B19-01 | GitHub Actions base #45 y #593 | PASS |
| B19-02 | Proceso terminado después de INSERT pero antes de COMMIT | Rollback automático; cero claves fantasma |
| B19-03 | Reintento tras éxito confirmado y respuesta hipotéticamente perdida | `DUPLICATE_SYNTHETIC`; exactamente una clave |
| B19-04 | `ROLLBACK` explícito y `ROLLBACK TO SAVEPOINT` | Ninguna clave residual |
| B19-05 | Validación de dirección corta fallida y posterior petición válida | Error sin reserva; nueva operación funciona |
| B19-06 | Dos sesiones: reserva sin commit y reintento concurrente | UNIQUE serializa; una reserva, un duplicado |
| B19-07 | Separación por cliente y equivalencia NORM-v1 de NBSP | Cliente distinto permitido; clave equivalente rechazada |
| B19-08 | SELECT/INSERT directo, EXECUTE no autorizado y función interna | Denegados por permisos; RLS activo |
| B19-09 | Contenedor PostgreSQL desechable y costo de CI | Solo fixture; sujeto a cuota de Actions |
| B19-10 | Staging, histórico, producción y servicios sin cambios | NO-GO para implementación y lectura |

## Interpretación y límites

- **Atomicidad:** matar una conexión antes de `COMMIT` revierte la reserva. No demuestra recuperación de infraestructura completa ni garantías ante caídas del servidor, WAL o corrupción.
- **Idempotencia:** se verifica unicidad por **clave normalizada**; no se implementa un token de idempotencia de negocio ni se prueba reenvío de órdenes. `DUPLICATE_SYNTHETIC` no distingue un reintento legítimo de otro intento con igual dirección.
- **Concurrencia:** dos sesiones y una carrera controlada; no prueba alta contención, deadlocks de otras transacciones, starvation, disponibilidad ni rendimiento bajo carga.
- **Privacidad:** `RESERVED_SYNTHETIC` y `DUPLICATE_SYNTHETIC` son respuestas **solo del fixture**. En un sistema público pueden actuar como oráculo de pertenencia. No equivalen al protocolo histórico `SUPPRESSED`.
- **NORM-v1:** NFC, 25 espacios y comparación UTF-8 bytea provienen del fixture F6-B18. Esta fase verifica un caso NBSP y no reemplaza los 30 vectores Unicode de F6-B14.
- **RLS y permisos:** se comprueban roles sintéticos NOLOGIN, denegación de acceso directo y función interna, y RLS habilitado. No se infieren permisos efectivos de Supabase.
- **Histórico:** una tabla auxiliar prospectiva vacía no detecta duplicados entre registros nuevos y antiguos no inspeccionados. No se puede aplicar UNIQUE global ni migración real sin proceso separado.
- **Costos y reversión:** runner de GitHub Actions sujeto a cuotas; no se promete costo cero en Supabase. El contenedor se destruye al terminar; los cambios de GitHub se revierten con `git revert`. No hay nada que revertir en staging.

## Decisión

**GO exclusivamente para continuar pruebas sintéticas y revisión offline. NO-GO para despliegue, cambios de staging, lecturas históricas, deduplicación global y pedidos reales.** Una futura **autorización A** debe delimitar cambios de staging (roles, funciones, políticas, tablas, grants e índices). Otra **autorización B** distinta es obligatoria antes de cualquier lectura histórica, incluso agregada. A no implica B y ninguna se ha concedido.

## Resultados CI verificados
- Commit probado: `b8876d4ae71bcc01b8796dcfc5c40f9f4cbab7dd`.
- PostgreSQL aislado **#60**, run `42906955621`: **SUCCESS**, sin pasos fallidos.
- Validación estática **#608**, run `42906955609`: **SUCCESS**, sin pasos fallidos.
- Durante la depuración, el primer ensayo de terminación del proceso cliente no garantizaba abortar la transacción del servidor. Se corrigió para identificar una sesión activa en `pg_sleep(15)` y terminar **el backend PostgreSQL antes de COMMIT**; después se comprueba ausencia de clave y reintento exitoso. Los primeros CI fallidos no constituyen evidencia de aprobación; únicamente la versión corregida aprobada.
