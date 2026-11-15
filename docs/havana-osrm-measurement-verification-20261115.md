# Verificación de identidad de archivos y medición offline OSRM — 2026-11-15

Base: `af5187d422a3dec2733b8626aaf5ca4b695332bf`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Nuevos archivos reales
- `experiments/havana-osrm-portable/measure.py`: valida registros JSON de mediciones suministradas por operador; **no invoca OSRM ni comandos externos**.
- `experiments/havana-osrm-portable/test_measure.py`: diez pruebas offline de validación, percentil p95, rechazo de NaN, booleanos, valores negativos, fases no permitidas, campos extra, muestras vacías y exit codes incorrectos.

## Pruebas ejecutadas localmente
`cd /mnt/data/ed_osrm && python -m unittest -v && python -O -m unittest -v`

**10/10 OK modo normal; 10/10 OK modo -O.**

Hashes SHA-256 de archivos locales probados:
- measure.py: `13e4a7a81bdfd82bdbc89cee1253ef0b68bbc22d94e3b77d81d88c90c5e1924c`
- test_measure.py: `97382d2c6a13bf8c3689c402da08abac0147edcb3e250b7702df0e883c20da30`

## Verificación de identidad exacta
Se calculó localmente `git hash-object` sobre ambos archivos ejecutados y se comparó con el SHA de blob devuelto por la API GitHub `fetch_file` en el commit `59cbd9327d6d66530a01404e3228cfa67aebf51a`:
- measure.py: local/GitHub `10b25dff5f47771e1a8ded9326a35234b348d1f0` — **IGUALES**
- test_measure.py: local/GitHub `97e3fad88f7c4ab9b9fcb03c0ba0a470b0401912` — **IGUALES**

Esto verifica la identidad de bytes de los **dos archivos nuevos**, bajo la función hash de objetos Git SHA-1 y la respuesta de GitHub. No se han descargado directamente los objetos GitHub para calcular SHA-256 independiente del remoto, ni se extiende esta afirmación a otros archivos históricos.

## Protocolo futuro de mediciones reales
Cuando se autorice cartografía: capturar grafo y fuente con SHA-256, perfil OSRM y digest de imagen; separar extract/partition/customize de routed; registrar en cgroup memoria máxima y en filesystem dedicado disco máximo; registrar tiempos CPU/wall; 3 repeticiones por configuración 1/2/4/8 GiB y cargas 1/5/20 consultas; medir p50/p95/p99 con dataset de rutas sintéticas públicas. El validador actual solo calcula p95 y **no prueba el comportamiento real de OSRM**. Nunca alimentar el archivo de mediciones con clientes o direcciones privadas.

## Alojamiento gratuito y Cuba
Sin nuevo candidato aprobado. GratisVPS descartado por falta de garantías; Oracle no elegible contractualmente para empresa cubana según revisión anterior; Google e2-micro tiene límites y facturación; otros proveedores sin elegibilidad y persistencia demostradas. No asumir que autorización regulatoria genérica equivale a permiso contractual del proveedor. Continuar investigación sin registro de cuentas.

## Límites
No se descargó cartografía ni se ejecutó OSRM, Docker o rutas reales. No se crearon cuentas, contrataron servicios, activaron manualmente GitHub Actions, generaron costos ni accedió a Supabase, staging o producción. La matriz M01–M10 y aceptación A01–A15 permanecen pendientes. `commercialQuoteEnabled=false`.
