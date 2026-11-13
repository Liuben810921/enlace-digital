# Auditoría: controles bidireccionales Unicode en motivos de cambios de tarifa — 13 noviembre 2026

## Verificación y hallazgo
El HEAD inicial de `audit/delivery-map-readonly-20261113` coincidía exactamente con el commit autorizado `0dae90c098cc6fa0f80f2ded21a231e329fe6436`.

La RPC `ed_rpc_lab.update_rate` rechazaba controles POSIX y separadores Unicode, pero permitía controles de formato bidireccional U+202A–U+202E y U+2066–U+2069 dentro de `p_reason`. Estos caracteres pueden alterar la visualización de una razón almacenada y confundir la lectura de la bitácora de cambios de tarifa.

## Regresión y corrección mínima
- `tests/postgres-delivery-rpc-rls-lab.py`: prueba para U+202E, U+202A, U+2066 y U+2069 incrustados; exige error SQLSTATE 22023 y ausencia de cambios en tarifa, versión y auditoría.
- `tests/postgres-delivery-rpc-rls-lab.sql`: rechazo explícito de los nueve controles direccionales en `p_reason` usando una clase de caracteres construida con `chr`.
- Sin cambios en cálculo de tarifas, control de versiones, RLS, privilegios, cotizaciones, claves de idempotencia ni bloqueos.

## Evidencia
- Prueba de regresión: `69eff4d2e5ed04f6f91ef0cb0c5dd698e7a3fd90`.
- Corrección SQL: `999164806669751b790e1b9da3c49b868fe11b1b`.

**Estado: auditoría cerrada tras GitHub Actions `completed/success`.** Laboratorio PostgreSQL desechable y rama aislada únicamente; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — CI aprobada

Se verificó [GitHub Actions #43522992468](https://github.com/Liuben810921/enlace-digital/actions/runs/43522992468): workflow `completed/success`, commit probado `999164806669751b790e1b9da3c49b868fe11b1b`. El trabajo `test` (ID `132221635664`) terminó también `completed/success`.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. El cierre solo modifica este documento; no modifica SQL, pruebas, RLS ni permisos, no fusiona ni despliega y no accede ni modifica Supabase, staging, producción, clientes reales ni pedidos.
