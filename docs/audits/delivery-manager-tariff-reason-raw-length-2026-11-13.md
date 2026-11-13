# Auditoría de longitud real del motivo de tarifa — 13 noviembre 2026

## Hallazgo
En el laboratorio aislado, `ed_rpc_lab.update_rate` validaba la longitud de `btrim(p_reason,...)` (3–160 caracteres), pero guardaba el valor original `p_reason` en `ed_rpc_lab.audit.reason`. Un motivo de más de 160 caracteres con relleno al inicio o final superaba la validación y se almacenaba íntegro, contradiciendo el límite declarado y permitiendo crecimiento innecesario de los registros de auditoría.

## Reproducción
`tests/postgres-delivery-rpc-rls-lab.py` contiene casos de 161 espacios posteriores, 161 espacios anteriores y 161 tabulaciones anteriores a `valid reason`. Cada caso debe rechazar la operación con SQLSTATE `22023` (`InvalidParameterValue`) y dejar intactos versión, tarifa y número de registros de auditoría.

## Corrección mínima
`tests/postgres-delivery-rpc-rls-lab.sql`: se añade `length(p_reason)>160` a la validación existente, conservando el mínimo de tres caracteres significativos y el rechazo de motivos solo de espacios de control. Se valida el tamaño del texto que realmente se persiste, sin normalizar ni reescribir el motivo.

## Evidencias
- Base verificada idéntica al commit autorizado `6f8c61f5f4ee8aa4bac20c4d8dc631225b379baa`.
- Regresión: `73cfe863450197834451059a24339362f3c9535b`.
- Corrección SQL: `0a12d5c438fb95e2bc1274f0f8f87a1a68862cd1`.

**Estado: pendiente de GitHub Actions `completed/success` para cerrar.** Alcance exclusivamente laboratorio PostgreSQL desechable en GitHub, sin Supabase, staging, producción, clientes reales o pedidos.
