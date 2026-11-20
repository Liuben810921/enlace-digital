# Ejecución PostgreSQL desechable — bloqueo y alternativa concreta, 2026-11-20

Rama `plan/havana-osrm-benchmark-offline-20261114`, base `35cca827d5b5807b4035c78d9be78a7c905d1c20`, comparación inicial `identical`.

## Diagnóstico local, comprobado

No hay ejecutables `postgres`, `initdb`, `pg_ctl`, `psql`, `docker`, `podman` ni paquetes PostgreSQL en la caché APT. Tampoco hay un servidor PostgreSQL embebido instalado. Sin descarga o instalación no existe motor PostgreSQL local con el que realizar pruebas de transacciones reales. No se ha ejecutado ni se afirma ejecución de carreras reales.

## Alternativa preparada

`experiments/havana-delivery-quote/postgres-disposable/run_concurrency.py` es un arnés Python estándar que usa **dos procesos psql independientes**, transacción abierta con `pg_sleep(2)`, espera de bloqueo, replay idempotente, una sola reserva, conflicto de payload y lookup. Ejecuta antes el SQL de creación y las aserciones de `002_geoapify_ledger_tests.sql`. Está protegido por `ED_DISPOSABLE_PG_CONFIRMED=YES` y exige `PGHOST=localhost`, `127.0.0.1` o socket local. No admite hosts remotos.

Comando para un entorno **local desechable previamente autorizado** con PostgreSQL y psql instalados:
```sh
export PGHOST=127.0.0.1 PGPORT=5432 PGDATABASE=geoapify_test PGUSER=geoapify_test
export ED_DISPOSABLE_PG_CONFIRMED=YES
python3 experiments/havana-delivery-quote/postgres-disposable/run_concurrency.py
```
La base de datos debe estar vacía y creada para pruebas; no usar credenciales ni hosts de Supabase. El arnés es **reproducible pero NO EJECUTADO** aquí.

## Riesgos conocidos que requieren pruebas

- El bloqueo de fila debe comprobarse con dos sesiones reales, no simularse.
- El SQL usa fecha UTC actual; los reintentos posteriores al cambio de día necesitan una política explícita.
- La recuperación de commit desconocido se limita al `lookup`; falta reproducir desconexión tras envío de COMMIT y comprobar reconciliación.
- Falta límite atómico por minuto, prueba de 2400 créditos bajo saturación y permisos mínimos de rol técnico.
- El script de prueba crea esquema y tablas en el destino local seleccionado: **nunca ejecutarlo sobre una base existente de trabajo**.

## Próximo desbloqueo

Para ejecutar la batería real se necesita autorizar **una instalación local gratuita y aislada de PostgreSQL** o proporcionar un entorno local ya instalado; no utilizar Supabase ni GitHub Actions. No se ha descargado software, instalado paquetes, realizado despliegue ni generado costos.

La integración real con Geoapify sigue `PENDIENTE`, sin tarifas ni pedidos.
