# Auditoría de separadores Unicode en motivos de tarifa — 13 noviembre 2026

## Hallazgo
`ed_rpc_lab.update_rate` rechaza controles POSIX, motivos vacíos y longitud excesiva, pero la expresión `[[:cntrl:]]` no contempla explícitamente U+2028 (separador de línea) ni U+2029 (separador de párrafo). Ambos podían introducir saltos visuales en el texto `ed_rpc_lab.audit.reason`, dificultando trazabilidad de auditoría.

## Prueba y corrección
- Regresión en `tests/postgres-delivery-rpc-rls-lab.py`: se exige SQLSTATE 22023 para ambos separadores y se verifica que versión/tarifa y número de registros de auditoría no cambian.
- SQL en `tests/postgres-delivery-rpc-rls-lab.sql`: `position(chr(8232) in p_reason)>0` y `position(chr(8233) in p_reason)>0` en la validación de `update_rate`.
- Se conservan controles anteriores, permisos, RLS y bloqueos transaccionales.

## Evidencia
- Base autorizada `00fadd7ea16abd3cdfc4480ad5ef55255a3bc566`, idéntica al inicio.
- Prueba `2c0dfe0820279ff093725fa8df68cc561932f6a9`.
- Corrección `64b1ce50080d6a24c7f6809ae239f09e53199775`.

**Estado: cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Exclusivamente rama aislada y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales o pedidos.

## Cierre definitivo — GitHub Actions aprobada

Se verificó [GitHub Actions #43518896347](https://github.com/Liuben810921/enlace-digital/actions/runs/43518896347): estado `completed`, conclusión `success`, commit probado `64b1ce50080d6a24c7f6809ae239f09e53199775`. El trabajo `test` (ID `132207835166`) también terminó `completed/success`.

La ejecución aprobó la batería reproducible que rechaza U+2028 y U+2029 en los motivos de tarifa, preservando versión, tarifa y registros de auditoría ante solicitudes inválidas.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. Cierre exclusivamente documental; sin fusiones, despliegues ni acceso o modificaciones a Supabase, staging, producción, clientes reales o pedidos.
