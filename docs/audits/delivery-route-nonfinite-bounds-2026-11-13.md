# Auditoría: entradas no finitas y fuera de rango en distancia de ruta — 13 noviembre 2026

## Alcance y HEAD inicial
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con el commit autorizado `f6374bbea36c80603530d30c335e5a89be53e1c1`. Solo se revisó el laboratorio PostgreSQL desechable.

## Riesgo prioritario comprobable
Una distancia `NaN`, `Infinity`, `-Infinity`, negativa muy pequeña o superior al máximo permitido podría introducir estados inválidos o modificar la versión de ruta antes del rechazo. El SQL actual de `mutate_context('route',...)` compara contra `0` y `10000` antes de actualizar. En PostgreSQL, `numeric 'NaN'` ordena por encima de los números finitos, por lo que la comparación `>10000` lo rechaza. Se incorpora regresión para verificar el comportamiento real en CI.

## Prueba reproducible
`tests/postgres-delivery-rpc-rls-lab.py` comprueba el rechazo `InvalidParameterValue` de `NaN`, `Infinity`, `-Infinity`, `-0.001` y `10000.001` en la RPC de rutas; también verifica que no cambian la versión de ruta ni el contador de auditoría de contexto.

Commit de pruebas: `a694ce38bdead2afb5e72b1cc6fb72784f5de244`.

## Decisión
No se modifica SQL sin evidencia de un fallo reproducido. La regresión se ejecutó satisfactoriamente en GitHub Actions: las validaciones existentes cubren el riesgo examinado y no se requiere cambio SQL.

**Estado: auditoría cerrada satisfactoriamente tras CI `completed/success`.** No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — CI aprobada

Se verificó [GitHub Actions #43524951416](https://github.com/Liuben810921/enlace-digital/actions/runs/43524951416): workflow `completed/success` sobre `a694ce38bdead2afb5e72b1cc6fb72784f5de244`. El trabajo `test` (ID `132228280422`) finalizó igualmente `completed/success`.

**Dictamen: auditoría cerrada satisfactoriamente, sin defecto reproducido ni corrección SQL necesaria.** Este cierre modifica exclusivamente el informe. No se fusiona ni despliega, y no se accede ni modifica Supabase, staging, producción, clientes reales ni pedidos.
