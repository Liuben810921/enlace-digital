# Auditoría consolidada F6-B13 a F6-B30 — alcance sintético

Fecha: 2026-11-10. PR #3 (borrador). **Este documento no certifica staging ni producción.**

## Matriz de cobertura

| Fases | Propiedad comprobada | Evidencia reproducible | Estado |
|---|---|---|---|
| B13–B15 | Encapsulación SQL, vectores NORM-v1, entradas adversariales y controles estáticos | `sql/pruebas/f6b13_encapsulated_synthetic_isolated.sql`, `scripts/generate_f6b14_synthetic_sql.py`, `scripts/generate_f6b15_adversarial_sql.py`, workflow | Probado en CI aislado |
| B16–B17 | Continuidad de controles estáticos y documentación de la serie | Workflow, documentos previos de la rama; **no existe una prueba independiente etiquetada B16/B17 en el workflow actual** | Evidencia específica limitada |
| B18–B19 | Concurrencia prospectiva, deduplicación, interrupciones y rollback | `scripts/run_f6b18_concurrency_isolated.py`, `scripts/run_f6b19_recovery_isolated.py` | Probado en CI aislado |
| B20–B21 | Idempotencia por operación separada de NORM-v1; aislamiento por identidad | `scripts/run_f6b20_operation_idempotency_isolated.py`, `scripts/run_f6b21_identity_operation_isolated.py` | Probado en CI aislado |
| B22 | Transición a contrato portable; sin paso de CI con etiqueta propia | Evidencia integrada en B23; **no se acredita una prueba independiente B22** | Evidencia específica limitada |
| B23–B25 | Contrato portable ED-OP-v1, JSON crudo, duplicados, Unicode, canonicalización, concurrencia adversarial | `sql/pruebas/f6b23_portable_contract_isolated.sql`, `scripts/run_f6b23_portable_contract_isolated.py`, `scripts/run_f6b24_raw_json_contract_isolated.py`, `scripts/run_f6b25_adversarial_contract_isolated.py` | Probado en CI aislado |
| B26–B27 | Interrupción de sesiones, reintentos concurrentes, cancelación y ACL/RLS | `scripts/run_f6b26_crash_retries_isolated.py`, `scripts/run_f6b27_transient_cancellation_isolated.py` | Probado en CI aislado |
| B28 | Deadlock 40P01, serialización 40001, timeout 57014 y 55P03, rollback | `scripts/run_f6b28_deadlock_serializable_isolated.py` | Probado en CI aislado |
| B29 | Clasificación SQLSTATE, presupuesto y jitter deterministas simulados, identidad | `scripts/run_f6b29_retry_budget_isolated.py` | Probado en CI aislado |
| B30 | COMMIT desconocido para cliente, reconciliación por clave, CONFLICT, aislamiento | `scripts/run_f6b30_ambiguous_commit_isolated.py` | Probado en CI aislado; prueba de presupuesto reforzada en auditoría |

## Hallazgos concretos de auditoría y correcciones

1. **Cobertura de presupuesto B30:** el script previo decía «bounded reconciliations» pero solo verificaba concurrencia; no contenía una aserción explícita de máximo de intentos para reconciliar. Se incorporó `reconcile(...,max_attempts=3)` y aserciones REPLAY/CONFLICT. Esto es una política sintética, no un controlador desplegado.
2. **Limpieza de cliente B30:** el `finally` ejecutaba `kill()` sin comprobar si el proceso ya había terminado. Se condicionó a `poll() is None` para evitar una terminación innecesaria.
3. **Prueba de integración pendiente:** la función `f6b23_synthetic.reserve` usa `session_user` de roles sintéticos LOGIN; no demuestra que el usuario autenticado por JWT, el pooler o un backend real propaguen una identidad equivalente. **Bloqueante antes de considerar el control operativo validado.**
4. **Contrato de JSON crudo:** la validación de bytes se hace en Python sintético antes de JSONB; no se ha demostrado su ejecución obligatoria en todos los puntos de entrada reales. **Bloqueante para adoptar el protocolo.**
5. **Idempotencia externa:** NEW/REPLAY/CONFLICT garantiza un registro sintético por identidad/clave, no exactly-once de inventario, pago, entrega o correo. **Bloqueante antes de pedidos reales.**
6. **Ambigüedad de red:** B30 termina un backend desechable alrededor de COMMIT, no prueba cortes de HTTP, failover, WAL ni recuperación de disco. **Riesgo residual; requiere estrategia de pruebas integrada.**
7. **Pruebas de seguridad negativas:** RLS y ACL son los del fixture, no políticas vigentes de Supabase. **Bloqueante para certificar staging/producción.**
8. **Presupuesto temporal:** B29 simula demoras y jitter sin espera real; no verifica el deadline de un request HTTP ni cancelación propagada a efectos externos. **Pendiente para integración.**

## Criterios verificables de cierre

**Cierre de fase sintética:** (a) workflow completo exitoso en commit final; (b) todas las pruebas B13–B30 presentes y sin fallos; (c) hallazgos documentados con estado y limitación; (d) PR #3 en borrador, sin merge ni despliegue. No confundir este cierre con certificación integral.

**Para autorizar ensayos en staging:** aprobación específica del usuario para entorno, operaciones permitidas y credenciales/roles; plan de reversión, pruebas de JWT/RLS/funciones/entradas, sin correos ni pedidos reales. Lectura de históricos requiere autorización independiente.

**Para habilitar pedidos reales:** no-go hasta validar integración real, permisos, trazabilidad, comportamiento bajo concurrencia y recuperaciones, además de revisión operacional de inventario/pagos y autorización explícita.

## Registro de CI

GitHub Actions #141 en commit `786662808f0cbaeb1e7847dd02a103fd3cf20b17`: SUCCESS antes de los ajustes de auditoría. **La nueva ejecución de CI debe constar en comentario final del PR; no afirmar éxito hasta verificarla.**

Se ha trabajado exclusivamente en GitHub, sobre fixtures y scripts sintéticos de PostgreSQL desechable. No se ha consultado ni modificado Supabase, staging, producción, datos históricos, código operativo, clientes, pedidos, servicios ni correo.
