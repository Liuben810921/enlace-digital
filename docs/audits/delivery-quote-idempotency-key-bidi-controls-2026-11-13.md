# Auditoría de controles bidireccionales Unicode en claves de idempotencia — 13 noviembre 2026

## HEAD y riesgo
Se verificó que el HEAD de la rama `audit/delivery-map-readonly-20261113` coincidía exactamente con el commit autorizado `e6b2171efc9838ecc6e297a4984ea10b90c4d4e2`.

La validación de `ed_rpc_lab.quote_preview` rechaza controles POSIX, separadores Unicode y claves vacías, pero no rechazaba caracteres de formato bidireccional (U+202A–U+202E, U+2066–U+2069) incrustados en claves de operación. Estos caracteres pueden alterar el orden visual del identificador en registros o herramientas, dificultando auditoría y diagnóstico de reintentos.

## Prueba y corrección
- `tests/postgres-delivery-rpc-rls-lab.py`: casos reproducibles para U+202E, U+202A, U+2066 y U+2069 incrustados; exige SQLSTATE 22023 y ausencia de cotizaciones persistidas.
- `tests/postgres-delivery-rpc-rls-lab.sql`: rechazo explícito de los nueve controles direccionales mediante una clase de caracteres construida con `chr`. La validación solo afecta a `p_key`.
- No se modifican el contenido de claves válidas, hash, unicidad, cotización, RLS, privilegios ni bloqueos.

## Evidencia
- Commit de regresión: `843187376157ad51e865bb26bf02106c0d1aaf67`.
- Commit de corrección: `f0016f474b68d31c41e558ad7f957739e5aac4fa`.

**Estado: pendiente de GitHub Actions `completed/success`.** Solo rama aislada y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
