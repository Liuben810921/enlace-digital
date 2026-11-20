# PostgreSQL desechable — intento de instalación local, 2026-11-20

Base `c535d731efdfa161d9f89bd2871bb029ad71ca1d`; comparación inicial con rama aislada: `identical`. Autorización: instalación local gratuita, PostgreSQL desechable, pruebas reales; prohibidos Supabase, GitHub Actions, Geoapify, staging y producción.

## Evidencia obtenida en entorno local

- `id`: usuario root, por lo que los permisos administrativos no son el bloqueo.
- `command -v postgres` y `command -v psql`: sin ejecutables.
- `command -v apt-get`: `/usr/bin/apt-get`.
- `/usr/lib/postgresql`: ausente.
- `/var/cache/apt/archives/*postgres*`: no hay paquetes descargados.
- `/var/lib/apt/lists`: sin índices de paquetes, solo carpetas auxiliares y archivo lock.
- `apt-get update -qq`: intento efectuado con límite de 25 segundos; **agotó tiempo de espera**. No se obtuvieron índices ni se instaló PostgreSQL.
- Búsqueda local de binario `postgres`: no encontrado.

**Conclusión:** no hay motor PostgreSQL ejecutable y la ruta de instalación mediante APT no funcionó en esta sesión. No se ejecutaron pruebas SQL ni concurrencia real. No se afirma defecto reproducido del registro transaccional: el bloqueo es del entorno.

## Alternativa concreta sin Supabase ni GitHub Actions

Ejecutar `postgres-disposable/run_concurrency.py` en un equipo local con PostgreSQL ya disponible o donde APT pueda descargar paquetes. El ejecutor exige `ED_DISPOSABLE_PG_CONFIRMED=YES` y `PGHOST` local. Para mayor aislamiento, usar una instancia temporal de PostgreSQL creada específicamente para esta prueba y destruirla al terminar. La prueba de commit desconocido y cuotas por minuto aún requiere ampliación: el arnés actual no demuestra esos escenarios.

**No se realizó ninguna instalación, despliegue ni llamada Geoapify.** El estado de integración real permanece `PENDIENTE`. No se generaron costos.
