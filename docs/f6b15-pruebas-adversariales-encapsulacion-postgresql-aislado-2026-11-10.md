# F6-B15 — Pruebas adversariales aisladas de función encapsulada NORM-v1

Base `a7177c1b643eb64b946cc5b151e159532d9dcd05`. GitHub Actions #18 (42903109906) y #563 (42903110404) comprobadas **SUCCESS**.

## Frontera
Solo PostgreSQL 17 desechable de GitHub Actions, datos ficticios y scripts GitHub. **No hay conexión ni consulta a Supabase, clientes reales, producción, servicios, correos o pedidos.** No se modifica código operativo.

## Ensayos automatizados
La batería F6-B14 (30 vectores: 28 transportables y 2 rechazados en la frontera UTF-8) se amplía en `scripts/generate_f6b15_adversarial_sql.py`, que produce `/tmp/f6b15_adversarial_generated.sql`. Incluye:
1. Propiedad real de `SECURITY DEFINER` y `search_path` fijo; propietario sin BYPASSRLS y esquema sin CREATE para caller/owner.
2. RLS activado, una política de lectura para el owner; ningún SELECT directo para caller ni EXECUTE para no autorizado.
3. Pruebas negativas de escalada: membresía SET ROLE, CREATE en esquema, GRANT SELECT y EXECUTE sobre normalizador interno; solo SQLSTATE de permiso insuficiente es aceptado, evitando falsos positivos por captura de excepciones centinela.
4. **12 ejecuciones** con fila ficticia que contiene U+200B inválido y **12 ejecuciones** sin ella; la respuesta pública debe ser idéntica `SUPPRESSED`. Además, **12 ejecuciones** bajo caller y **5 intentos** denegados bajo rol no autorizado.
5. Todas las tablas, funciones, roles y políticas se crean dentro de transacción sintética con `ROLLBACK`; no hay persistencia.

## Evaluación de filtraciones indirectas — NO-GO
- **Tiempos:** igualdad de salida no significa tiempo constante. La presencia de errores, el plan, tamaño de tablas, cachés y locks pueden afectar duración. Las pruebas no demuestran indistinguibilidad estadística; no se publica latencia por estado ni se usa un umbral ficticio de seguridad. Repeticiones del test comprueban salida y autorización, **no resistencia a ataques de temporización**.
- **Logs:** `EXCEPTION WHEN OTHERS` solo controla la respuesta, no garantiza ausencia de datos en logs, telemetría, auditoría, SQL histórico o errores previos al wrapper. El CI usa exclusivamente datos inventados. Se requiere revisión independiente de logging real antes de staging.
- **Repetición:** la función permite llamadas repetidas en el fixture; el test demuestra precisamente que la salida sigue suprimida, pero no impone presupuesto de una consulta, rate limit ni control administrativo. No usar en producción.
- **RLS:** las políticas de la prueba no equivalen a las de staging; roles y herencias efectivas no han sido revisados allí en esta fase.
- **Errores:** salida uniforme `SUPPRESSED` puede ocultar errores operativos; no se ha demostrado detección interna segura de fallos sin filtrar datos.
- **Privacidad:** no existe todavía política de divulgación con umbral k aprobado; no retornar números, booleanos, hashes, grupos ni filas. Los datos históricos siguen desconocidos.

## Criterios y reversión
| Gate | Criterio |
|---|---|
| B15-01 | GitHub Actions base #18 y #563 PASS |
| B15-02 | PostgreSQL 17 aislado y fixture ficticio |
| B15-03 | Owner, search_path, RLS y permisos |
| B15-04 | Escalada CREATE/GRANT/SET ROLE denegada |
| B15-05 | EXECUTE interno y no autorizado denegado |
| B15-06 | Error sintético oculto en SUPPRESSED |
| B15-07 | Invocaciones repetidas sin variación de salida |
| B15-08 | Riesgos de tiempo/logs documentados NO-GO |
| B15-09 | ROLLBACK y costo sujeto a cuota de Actions |
| B15-10 | Staging, producción y clientes intactos |

El runner gratuito está sujeto a minutos y cuotas de GitHub Actions, sin servicio permanente. `ROLLBACK` elimina objetos sintéticos y `git revert` revierte los cambios de GitHub.

**Autorización A:** se requiere autorización específica futura para cualquier cambio de roles, funciones, grants o RLS en staging. **Autorización B:** otra autorización independiente para cualquier lectura histórica, incluso agregada. Ambas siguen **NO AUTORIZADAS**. **NO-GO** para staging y datos históricos.
