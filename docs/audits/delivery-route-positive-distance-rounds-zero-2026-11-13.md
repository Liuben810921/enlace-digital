# Auditoría de distancias positivas redondeadas a cero — 13 noviembre 2026

## HEAD inicial
Se comprobó que el HEAD de `audit/delivery-map-readonly-20261113` coincidía con el commit autorizado `64419bd9b3c5ec83dce936dcf82f449ae509ab9e`.

## Hallazgo y alcance
`ed_rpc_lab.mutate_context('route', ...)` acepta distancias numéricas positivas inferiores a `0.005` km, pero la columna `distance_km numeric(10,2)` las redondea a `0.00`. Esto pierde la distinción entre distancia medida positiva y cero real; el mínimo de facturación de 3 km impide un impacto monetario inmediato en este laboratorio, pero el registro de ruta pierde precisión semántica.

## Regresión y corrección
- `tests/postgres-delivery-rpc-rls-lab.py`: distancias positivas `0.001` y `0.004` km deben provocar `InvalidParameterValue`, sin cambios de versión ni auditoría de contexto.
- `tests/postgres-delivery-rpc-rls-lab.sql`: rechaza solo valores positivos que se almacenarían como cero tras `numeric(10,2)`. Se conserva la distancia cero explícita, las distancias válidas y la tarifa mínima.
- Commit de prueba: `a4ac9f9c8c749001aa2d0e4cc771eb0d756edb6f`.
- Commit de corrección: `e96b3a4c942dc63877ce7e0c5660b2d5b327eb21`.

**Estado: auditoría cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Cambios solo en rama aislada y laboratorio PostgreSQL desechable. No se ha accedido ni modificado Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — CI aprobada

Se verificó [GitHub Actions #43523901787](https://github.com/Liuben810921/enlace-digital/actions/runs/43523901787): workflow `completed/success`, commit probado `e96b3a4c942dc63877ce7e0c5660b2d5b327eb21`. El trabajo `test` (ID `132224761594`) finalizó también `completed/success`.

**Dictamen: auditoría cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. El cierre modifica exclusivamente este informe; no cambia SQL, pruebas, permisos o RLS, no fusiona ni despliega y no accede ni modifica Supabase, staging, producción, clientes reales ni pedidos.
