# Auditoría OSRM: percentiles, identidad Git y alojamiento — 2026-11-15

Base `9295f580d4c570cc56cc3b3c1c1e689848005a8e`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Implementación
Nuevos archivos `experiments/havana-osrm-portable/measure_v2.py` y `test_measure_v2.py`. El registrador solo lee un archivo JSON local, no ejecuta OSRM ni red. Calcula p50, p95 y p99 por nearest-rank de muestras ordenadas. El método nearest-rank está especificado; no se deben comparar sus percentiles sin aclaración con interpolación de otros programas.

Rechaza esquema inesperado, tipos bool para números, bytes fraccionarios, NaN/Infinity, latencias negativas, muestras faltantes, muestras en fases no-ruta, códigos de salida no válidos, más de 100 000 muestras por registro, más de 10 000 registros y JSON con claves duplicadas. Limita lectura a 16 MiB y calcula SHA-256 de bytes del JSON de entrada. Los campos de medidas no incluyen identificadores de clientes ni coordenadas.

## Pruebas ejecutadas localmente
Comandos: `python -m unittest -v test_measure_v2` y `python -O -m unittest -v test_measure_v2`.
Resultados observados: **20/20 PASS normal, 20/20 PASS -O**. No se ejecutó OSRM real.

SHA-256 de archivos locales probados:
- `measure_v2.py`: `5d78bd1a3baa6c667e163b52d35d8cddf77fc1711f5feb6f5709132ca57c0d72`
- `test_measure_v2.py`: `e53b19f85ba88feb0040fa74400e82b35c1b0c17c536bbb2cc8146b4564ce7d1`

Identidad de objetos Git comprobada: `git hash-object` local coincide con `fetch_file.sha` del commit `be8f46f6a24b0fee77a9da798f4324076eedd1cb`:
- `measure_v2.py`: `b54118e8b24eee5b87c8e2bea8cf6a5adc0a34d2`
- `test_measure_v2.py`: `212df1c8790f3734cecbe795e4e434d20bb393a3`

La identidad se ha comprobado para estos dos archivos con Git SHA-1, no para todo el repositorio ni mediante SHA-256 independiente de bytes remotos descargados.

## Limitaciones pendientes de auditoría
El registrador acepta valores de RAM, CPU, disco y latencia **declarados** en JSON: no demuestra que sean medidas instrumentadas, no comprueba unidad de memoria cgroup, procedencia de muestras, precisión del reloj, errores de rutas ni latencias reales. No exige identificadores de corrida, versión OSRM, SHA-256 de PBF, digest de imagen, parámetros de recorte o firma de procedencia. Antes de aceptar benchmarks reales se necesita manifiesto inmutable asociado a cada corrida, instrumentación externa reproducible, al menos tres repeticiones y captura de OOM/errores. No hay cartografía ni benchmark.

## Investigación externa, solo evidencia pública
- VPSFree.io: https://vpsfree.io/ ; plan gratuito actualmente anunciado 192 MB RAM y 3 GB disco, renovación manual cada 10 días, eliminación posterior a vencimiento. NO-GO.
- Vyce: https://vyce.cloud/ ; 2 GB RAM, 6 GB disco, renovación manual y eliminación tras 3 días detenido. NO-GO.
- Oracle Cloud: su política oficial de cumplimiento comercial https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ no autoriza alojar a empresa cubana en el supuesto estudiado. NO-GO sin autorización expresa.
- Google Free Tier: https://docs.cloud.google.com/free/docs/free-cloud-features ; e2-micro y cuota de disco persistente, pero elegibilidad comercial cubana no confirmada, facturación y RAM insuficiente sin benchmark. NO-GO provisional.
- GratisVPS: ver auditoría previa; sin garantías de continuidad y sin prueba de aprovisionamiento. NO-GO.

**No se encontró candidato que reúna simultáneamente gratuidad permanente, almacenamiento persistente, capacidad comprobada y autorización contractual explícita para ENLACE DIGITAL como empresa cubana.** No se afirma que sea imposible encontrarlo. Fuentes oficiales prevalecen sobre listados de afiliados. No se registraron cuentas ni se verificó aprovisionamiento real.

## Restricciones y estado
Sin descargar cartografía, ejecutar OSRM, crear cuentas, activar manualmente GitHub Actions, generar costos ni acceder a Supabase/staging/producción. Un commit puede activar workflows automáticos preexistentes; no se comprobó su estado. `commercialQuoteEnabled=false`. Mensajerías y alojamiento siguen pendientes.
