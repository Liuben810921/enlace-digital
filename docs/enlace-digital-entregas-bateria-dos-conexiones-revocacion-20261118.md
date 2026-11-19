# ENLACE DIGITAL — Batería offline de dos conexiones y revocación
Fecha: 2026-11-18. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Base `9efba3d192b59c63d6c6ae9b695c065eed468e73`; comparación inicial idéntica.

## Material publicado (hashes de GitHub verificados)
- `atomic_revocation_fixture.sql`: `269096b020d89fbb685201447bcca38631518318`
- `atomic_session_A_commit.sql`: `612653a4a309ab5acf939b7d07b76aeade294c48`
- `atomic_session_A_rollback.sql`: `14f02a0b14c8302a7c871c812fb5b68533df6d70`
- `atomic_session_B.sql`: `41e45752ee63037be03660b6b0e52d4bcfc90207`
- `atomic_postconditions.sql`: `cb6a7dea1a4b6ac57166f95c8b35bdc1cb089cec`
- `atomic_permission_assertions.sql`: `2e82169367f2e2c134e27b761bc82f3d1b21839d`

## Procedimiento reproducible en PostgreSQL desechable
1. DBA crea base local descartable; ejecutar `manual_approval.sql`, `shared_pool_intents.sql`, `shared_pool_atomic_lab.sql`, `atomic_disposable_roles.sql`, `atomic_two_connections_setup.sql`. Para revocación ejecutar también `atomic_revocation_fixture.sql`.
2. Obtener `intent_id` y `nonce_hash` de `synthetic-op-1` (aprobación) o `revoke_intent_id` y `revoke_nonce_hash` de `synthetic-revoke-1` (revocación). Usar como variables psql `-v intent_id=... -v nonce_hash=...`.
3. En conexión A ejecutar `atomic_session_A_commit.sql`; mientras A duerme 8 segundos, en conexión B ejecutar `atomic_session_B.sql`, usando **el mismo identificador y nonce**. Resultados esperados, NO observados: A `LAB_APPLIED_ONLY`, B `PENDIENTE`.
4. Repetir desde base/fixture restaurada usando `atomic_session_A_rollback.sql` y B. Esperado: A revierte todo, B puede confirmar el único efecto.
5. Repetir la invocación tras COMMIT: `PENDIENTE`. Consultar `atomic_postconditions.sql` como DBA y verificar consumo único, aprobación o revocación.
6. Ejecutar `atomic_permission_assertions.sql` como DBA. El archivo falla con EXCEPTION ante privilegios incompatibles. Complementar con `atomic_privileges_adversarial.sql` como rol pool, aislando el UPDATE que debe ser rechazado.
7. Ejecutar `atomic_two_distinct_intents.sql` en una base descartable aparte: el segundo INSERT de la misma clave debe fallar por UNIQUE. No tratar ese error esperado como prueba de éxito de toda la batería.

## Hallazgos y límites
- Los scripts anteriores declaraban LOGIN NOINHERIT, pero no indicaban SET ROLE en cada sesión. Los nuevos scripts sí lo hacen. **Esto corrige un defecto de reproducibilidad**, no prueba la seguridad del login.
- El fixture de revocación ahora crea una aprobación ficticia y su intención correspondiente, eliminando un paso manual ambiguo.
- Los scripts siguen requiriendo que el DBA configure autenticación local para las cuentas de prueba; no crean contraseñas ni cambian servicios.
- La batería es reproducible **manualmente**, no un orquestador automático: el arranque concurrente depende de ejecutar B durante la pausa de A.
- Los resultados esperados no se han observado: **0 ejecuciones PostgreSQL y 0 ejecuciones Node en esta etapa**. La verificación realizada fue lectura de archivos y hashes en GitHub.
- No se ha integrado gateway real, contexto autoritativo ni uso final de una cotización. El laboratorio devuelve `LAB_APPLIED_ONLY`, no autorización comercial.

**Estado operativo:** `PENDIENTE`. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
