# Auditoría de claves de idempotencia con caracteres de formato invisibles — 13 noviembre 2026

## Alcance y hallazgo
HEAD inicial verificado idéntico al commit autorizado `5af53243c29596a1fd3d996da95b03a7566e46f2`. En el laboratorio PostgreSQL desechable, `ed_rpc_lab.quote_preview` rechazaba espacios ASCII y ciertos espacios Unicode, pero permitía claves de operación formadas solo por U+200B (zero-width space), U+2060 (word joiner) o U+FEFF (zero-width no-break space). Una clave sin contenido visible podía persistirse como identificador de idempotencia.

## Corrección limitada y pruebas
- `tests/postgres-delivery-rpc-rls-lab.py`: regresión para tres claves de caracteres invisibles, SQLSTATE 22023 y ausencia de nuevas cotizaciones.
- `tests/postgres-delivery-rpc-rls-lab.sql`: `translate` convierte U+200B, U+2060 y U+FEFF en espacios ASCII solo para la prueba de clave vacía; no modifica la clave original válida, su unicidad ni su hash.
- No se alteraron RLS, privilegios, bloqueos, cálculo de tarifas ni reglas de idempotencia para claves válidas.

## Evidencia de GitHub
- Pruebas: `12181acb526e76b30647f168b503d0d3c0c382e8`.
- Corrección: `78b1097ea121e7f6f46db2dfc762e16716433f57`.

**Estado: pendiente de GitHub Actions `completed/success`.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
