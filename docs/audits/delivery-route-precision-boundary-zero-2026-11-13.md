# Auditoría: frontera de precisión de rutas y cero explícito — 13 noviembre 2026

## HEAD inicial
Se verificó que `audit/delivery-map-readonly-20261113` coincidía exactamente con el commit autorizado `44016a47403fd2dbfbe9e9118c69eb5bfb132240`.

## Riesgo
La validación que rechaza distancias positivas redondeadas a cero debe preservar dos casos legítimos: `0.005` km, que PostgreSQL `numeric(10,2)` redondea a `0.01` km, y una distancia cero explícita. Un error de frontera podría rechazar entradas válidas o almacenar incorrectamente la distancia.

## Prueba reproducible
Se incorporó a `tests/postgres-delivery-rpc-rls-lab.py` una prueba que actualiza una ruta sintética con `0.005` km, verifica almacenamiento `0.01` km, actualiza después con `0` km y verifica almacenamiento `0.00` km. Ambas operaciones deben incrementar su versión de manera controlada.

Commit de regresión: `13bce75b70feeb29fa96be6eaee4940947113710`.

## Decisión
GitHub Actions confirmó el comportamiento de frontera: no se ha demostrado un fallo SQL y se mantiene el código actual sin cambios.

**Estado: auditoría cerrada satisfactoriamente tras GitHub Actions `completed/success`.** Exclusivamente rama aislada y PostgreSQL desechable; sin acceso ni modificación a Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo — CI aprobada

Se verificó [GitHub Actions #43525328426](https://github.com/Liuben810921/enlace-digital/actions/runs/43525328426): workflow `completed/success` sobre `13bce75b70feeb29fa96be6eaee4940947113710`. El trabajo `test` (ID `132229537269`) finalizó igualmente `completed/success`.

**Dictamen: auditoría cerrada satisfactoriamente, sin defecto reproducido ni corrección SQL necesaria.** El cierre modifica exclusivamente el informe. No se fusiona ni despliega, y no se accede ni modifica Supabase, staging, producción, clientes reales ni pedidos.
