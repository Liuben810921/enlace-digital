# Publicación y auditoría de identidad — atestación v1 endurecida

**Base:** `f3c8e7059aa1314335e9a8041980e55d0834f962`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

Se publicó `experiments/havana-osrm-portable/test_pg_attestation_v1_hardened.py` en el commit `2d50dbc471aff837c650aee7a533d6eb3e3d8140`.

## Resultado comprobado

- Archivo local original: **5602 bytes**, Git blob `2cb2cff565038995e9509d0a336f9e9644f1c9c0`, SHA-256 `6ba225302c37445cb450720b531b13623754a7f640c9e1d3331996537e925987`.
- Archivo remoto recuperado desde GitHub: **5596 caracteres** reportados por la lectura, Git blob `f08556085282492b11c35ec9bf6e5e02725d70e4`.
- **No coinciden los Git blobs**. El cotejo exacto de bytes y SHA-256 remoto está **ABIERTO**; no se debe considerar que el archivo publicado sea idéntico al probado.
- Batería ejecutada en el entorno local con el archivo local original: **192/192 OK** en `python -m unittest -q` y **192/192 OK** en `python -O -m unittest -q` con los 11 módulos de la batería anterior.

## Estado de seguridad y próximos pasos

La discrepancia impide declarar cerrada la publicación. Es necesario recuperar los bytes remotos exactos en el entorno local, comparar diferencias, corregir únicamente los bytes discrepantes si se confirma la causa, volver a publicar y ejecutar la versión publicada exacta en ambos modos. No se ha ejecutado la versión remota discrepante.

El diseño sigue siendo un **prototipo offline** que devuelve `DENY_NO_EXTERNAL_TRUST`; no hay aprobación externa ni despliegue. No se ejecutaron PostgreSQL, GitHub Actions, OSRM ni se modificaron tienda, workflows, Supabase, staging, producción o datos reales; tampoco se descargó cartografía ni se generaron costos.
