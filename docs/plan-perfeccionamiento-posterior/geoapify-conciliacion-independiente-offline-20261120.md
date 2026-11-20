# ENLACE DIGITAL — conciliación independiente y congelación segura (2026-11-20)

Base `fb0bed5872246aff89f8763463c91a5b25de86be`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial de GitHub: `identical`.

## Defecto confirmado por inspección
La función `finish_dispatch` en 021 aceptaba SUCCEEDED/FAILED_CHARGED con solo el claim_token y liberaba `context_freeze_audit` sin una comprobación de autorización independiente ni evidencia. Era una vía de liberación indebida.

## Cambio
- `023_geoapify_independent_reconciliation.sql` crea allowlist vacía `reconciliation_reviewer` y tabla `reconciliation_evidence`, ambas sin privilegios PUBLIC.
- Reemplaza `finish_dispatch` para admitir solo UNKNOWN; cualquier intento terminal devuelve `RECONCILIATION_REQUIRED`.
- `record_reconciliation_evidence` requiere rol SQL expresamente autorizado, token válido, resultado terminal, digest de 64 hex y referencia externa.
- `reconcile_dispatch` exige dos identidades de base de datos distintas con evidencia, resultado y referencia idénticos; rechaza discrepancias y no libera congelación hasta que ledger y outbox se cierren en la misma transacción.
- Sin altas de revisores ni GRANTs: configuración fail-closed, ninguna reconciliación terminal está habilitada.
- `024_geoapify_independent_reconciliation_tests.sql` prueba rechazo del cierre heredado, rechazo de revisión sin allowlist, preservación de congelación tras UNKNOWN y bloqueo de reenvío.
- `run_concurrency.py` incluye 023 y 024 al final de la secuencia.

## Comprobaciones realmente ejecutadas
GitHub exacto:
- 023 blob `36fff529366577c826ae0cded1bb52481d67ab5d`: 5/5 inspecciones textuales.
- 024 blob `4b0bd4e5a5477fb43a45391f1baf9fa39cce1af8`: 5/5 inspecciones textuales.
- runner blob `044e1dd1bf57430f1073411c109d58940883cf99`: 3/3 referencias y orden.
**Total 13/13 comprobaciones estructurales. No se ejecutaron SQL, PostgreSQL, Node.js ni carreras reales.**

## Pendientes y riesgos
- La presencia de dos firmas SQL no autentica por sí misma evidencia del proveedor; debe establecerse cadena de custodia y verificación independiente, sin credenciales en la tabla.
- No se han creado roles, otorgado privilegios ni probado `current_user` con roles reales. La ruta positiva de doble revisión y los casos de conflicto quedan pendientes de PostgreSQL desechable autorizado.
- La prueba de commit desconocido simula relectura y rechazo de reenvío, pero no reproduce pérdida real de ACK ni dos sesiones simultáneas.
- PostgreSQL Read Committed puede ver distintas instantáneas entre comandos; las operaciones de escritura deben respetar el mismo advisory lock y la misma transacción. Referencia: https://www.postgresql.org/docs/current/transaction-iso.html
- El propietario de tablas o un rol privilegiado puede eludir la interfaz; requieren control de GRANT, RLS si procede, y separación operativa verificable antes de cualquier activación.
- Las migraciones anteriores 022 prueban conciliación directa mediante la interfaz antigua y se ejecutan ANTES de 023. No deben interpretarse como permiso de producción para ese flujo.
- El proveedor sigue desconectado; no hay atomicidad entre PostgreSQL y HTTP externo.

No se instaló PostgreSQL ni se utilizaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
