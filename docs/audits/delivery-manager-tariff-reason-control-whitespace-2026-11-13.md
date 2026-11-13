# Auditoría de motivos de actualización de tarifa con espacios de control — 13 noviembre 2026

## Hallazgo y riesgo
La función sintética `ed_rpc_lab.update_rate` exigía un motivo de 3 a 160 caracteres tras `trim(p_reason)`. En PostgreSQL, el recorte predeterminado elimina espacios ordinarios, pero no tabulaciones ni saltos de línea. Por tanto, motivos compuestos exclusivamente por caracteres de control podían satisfacer la longitud mínima y generar una entrada de auditoría sin explicación sustantiva.

## Regresión reproducible
En `tests/postgres-delivery-rpc-rls-lab.py` se añadieron casos con tabulaciones, saltos de línea y combinaciones de espacios/tabulaciones. Cada uno debe generar `InvalidParameterValue` (`22023`). Se comprueba además que ni la versión/tarifa ni el número de eventos de auditoría cambien.

## Corrección mínima
En `tests/postgres-delivery-rpc-rls-lab.sql` se sustituyó el recorte predeterminado por `btrim(p_reason, ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13))`, manteniendo los límites 3–160 y el resto de validaciones.

## Evidencias y estado
- Base autorizada: `053f5b6bcd36d4f85caf4fdbacd2f64ab93683c9`, rama idéntica antes de los cambios.
- Prueba: `10cb212d4c9a4573adbea9904b65da6844252d9e`.
- Corrección: `a05d2e9e3528f5d15075cd9cead06b729c5de650`.
- CI: **pendiente de confirmación de éxito sobre el commit que incluye corrección y regresión**.

**Estado:** abierto hasta que GitHub Actions valide el conjunto. Alcance restringido a GitHub y laboratorio PostgreSQL desechable; sin acceso ni modificaciones de Supabase, staging, producción, clientes reales o pedidos.
