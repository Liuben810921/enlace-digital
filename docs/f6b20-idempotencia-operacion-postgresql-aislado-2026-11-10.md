# F6-B20 — Idempotencia por operación, separada de unicidad NORM-v1

**Fecha:** 2026-11-10. **Base:** `acdfdb3b88a42a5574e499c02930daab4faff206`. GitHub Actions #62 (42907129897) y #610 (42907129757): **SUCCESS**. Prototipo únicamente en GitHub Actions con PostgreSQL 17 desechable y datos ficticios. Ningún SQL ejecutado en Supabase.

## Modelo

La tabla auxiliar sintética `f6b20_synthetic.operations` utiliza **PRIMARY KEY(client_id,operation_key)** y almacena un digest ficticio de 64 caracteres y la dirección normalizada NORM-v1 en UTF-8 bytea. No impone unicidad por dirección. Dos operaciones diferentes pueden compartir dirección, mientras que la misma operación con igual contenido devuelve `REPLAY_SYNTHETIC`; una operación con la misma clave y payload diferente devuelve `CONFLICT_SYNTHETIC`. `INSERT ... ON CONFLICT DO NOTHING` y posterior lectura bajo la misma transacción serializan carreras por clave. No hay `SELECT` previo a `INSERT`.

**Importante:** el digest del fixture es un texto de 64 caracteres proporcionado por el cliente sintético, **no una firma, ni autenticación, ni hash verificado**. Un sistema real debe calcularlo en servidor sobre una representación canónica de toda la operación, con identidad autenticada, reglas de autorización y alcance de cliente. Este prototipo no procesa pedidos ni reserva direcciones reales. La respuesta revela estado y no se debe exponer como oráculo público.

## Pruebas y criterios

| Gate | Comprobación | Esperado |
|---|---|---|
| B20-01 | CI #62 y #610 previos | PASS |
| B20-02 | Repetir clave y payload | REPLAY_SYNTHETIC, una fila |
| B20-03 | Misma clave con digest o dirección diferente | CONFLICT_SYNTHETIC |
| B20-04 | Nueva operación con misma dirección | NEW_SYNTHETIC; independencia de NORM-v1 |
| B20-05 | Misma clave con distinto cliente | Independencia por cliente |
| B20-06 | ROLLBACK de operación no confirmada | Sin reserva fantasma; reintento válido |
| B20-07 | Dos sesiones concurrentes, mismo payload | Una nueva, una repetición |
| B20-08 | Dos sesiones concurrentes, payload distinto | Una nueva, un conflicto |
| B20-09 | RLS, permisos mínimos, invalidación de payload | SELECT/DELETE/EXECUTE no autorizado denegados |
| B20-10 | Expiración conceptual, costos y autorización | NO-GO TTL y staging |

## Expiración conceptual: NO-GO

Las claves **no caducan en el prototipo**. No hay cron, borrado, job, cola ni servicio. Una futura política de retención necesitaría una ventana de reintentos, estados de operación, prohibición de reutilizar claves expiradas de manera ambigua, tratamiento de fallos y límites de crecimiento. Eliminar una clave demasiado pronto puede permitir procesar dos veces una misma operación. Las pruebas verifican que una clave antigua sigue devolviendo `REPLAY_SYNTHETIC`; **no prueban TTL**.

## Seguridad, privacidad, costos y reversión

La función `SECURITY DEFINER` usa `search_path=pg_catalog,pg_temp`, owner `NOLOGIN` sin `BYPASSRLS`, RLS habilitado y policy específica; caller solo EXECUTE, sin SELECT/INSERT/DELETE directos. Se deniega EXECUTE a un rol extraño y a PUBLIC. El modelo real requerirá vincular `client_id` a la identidad autenticada: **el caller ficticio puede escoger cualquier ID**, lo que impide aprobarlo para staging. También faltan hash canónico de payload, límites de tasa, protección frente a logs/timing, revisión de exposición de respuestas, estados transaccionales de negocio y recuperación tras caídas.

Los costos de GitHub Actions están sujetos a cuota; no se garantiza costo cero de una implementación Supabase. No se modifica producción, staging, clientes, pedidos ni correos. El contenedor PostgreSQL es desechable; `git revert` revierte los archivos de GitHub.

**Decisión:** GO para análisis y pruebas offline; **NO-GO staging**, **NO-GO producción**, **NO-GO lectura histórica**, **NO-GO activación de TTL o servicios**. Se requiere **autorización A** explícita para cualquier modificación de staging y **autorización B independiente** para cualquier lectura histórica, incluso agregada. Ninguna está concedida.
