# Auditoría de separadores Unicode en claves de idempotencia — 13 noviembre 2026

## Hallazgo
El prototipo `ed_rpc_lab.quote_preview` ya rechaza caracteres POSIX de control en `operation_key`, pero `U+2028` (separador de línea) y `U+2029` (separador de párrafo) no son caracteres de control POSIX y pueden alterar la presentación y correlación de claves al exportar registros. La validación anterior no contemplaba explícitamente estos separadores Unicode.

## Pruebas reproducibles
`tests/postgres-delivery-rpc-rls-lab.py` incorpora `order\\u2028forged` y `order\\u2029forged` como claves y exige `InvalidParameterValue` (SQLSTATE `22023`) sin nuevas filas de cotizaciones.

## Corrección mínima
`tests/postgres-delivery-rpc-rls-lab.sql` rechaza `position(chr(8232) in p_key)>0` y `position(chr(8233) in p_key)>0`. Se mantienen todas las restricciones y permisos previos.

## Evidencias
- Base autorizada `a00796b1c3c4a9fef9bdf3d254b6826ccb39a92d`, idéntica al inicio.
- Prueba: `0f0812b69d1b32c5fca14f98947be2b757632092`.
- Corrección SQL: `962b31c06f32a83851f78a29194091f1b88395b9`.

**Estado: cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Laboratorio PostgreSQL desechable exclusivamente; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.

## Cierre definitivo — GitHub Actions aprobada

Se verificó [GitHub Actions #43518697217](https://github.com/Liuben810921/enlace-digital/actions/runs/43518697217): `completed/success` para el commit `962b31c06f32a83851f78a29194091f1b88395b9`. El trabajo `test` (ID `132207167085`) también terminó `completed/success`.

La ejecución aprobó la batería reproducible que exige rechazar separadores Unicode U+2028 y U+2029 en claves de idempotencia sin crear nuevas cotizaciones ante solicitudes inválidas.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. Cierre exclusivamente documental; sin fusiones, despliegues ni acceso o modificaciones a Supabase, staging, producción, clientes reales o pedidos.
