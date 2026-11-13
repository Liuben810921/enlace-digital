# Auditoría de motivos de tarifa formados solo por caracteres Unicode invisibles — 13 noviembre 2026

## Hallazgo
La validación de longitud significativa de `ed_rpc_lab.update_rate` descarta espacios ASCII y determinados espacios Unicode, pero no contempla caracteres de formato sin representación visual: U+200B (zero-width space), U+2060 (word joiner) y U+FEFF (zero-width no-break space/BOM). Tres de estos caracteres podían superar el mínimo de tres sin proporcionar una justificación legible al historial de cambios de tarifa.

## Regresión y corrección mínima
- `tests/postgres-delivery-rpc-rls-lab.py`: tres casos sintéticos exigen SQLSTATE 22023 y comprueban que no cambia la versión, la tarifa ni el número de entradas de auditoría.
- `tests/postgres-delivery-rpc-rls-lab.sql`: los tres caracteres se convierten en espacios ASCII **únicamente para calcular la longitud significativa**; no se modifica el texto de razones válidas ni los controles de longitud bruta, controles POSIX o separadores Unicode.
- No se alteran RLS, privilegios, bloqueos transaccionales ni funcionalidades operativas.

## Evidencia
- HEAD inicial `4d26182e15bf91a87635317bcbaa069d905c463d` verificado idéntico a la rama.
- Commit de pruebas `d30555d2088aab9db7c46ca6f2cf4e31b140d6bc`.
- Commit de corrección `91cf0a4999ce536572c8ac54db4f1048eee24707`.

**Estado: pendiente de GitHub Actions `completed/success`.** Exclusivamente GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.
