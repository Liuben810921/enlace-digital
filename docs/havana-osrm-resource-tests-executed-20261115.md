# Ejecución offline del estimador OSRM — 2026-11-15

Base `30b473d214391b6a94b31e82565f3890543a21d7`.

Se reconstruyeron localmente los contenidos visibles de `resource-budget.py` y la versión corregida de `test_resource_budget.py`, para probar el defecto de importación corregido en GitHub.

Comandos ejecutados en contenedor local sin Internet:
```sh
cd /tmp/ed-osrm-audit
python -m unittest -v
python -O -m unittest -v
sha256sum resource-budget.py test_resource_budget.py
```

Resultados observados: **6/6 PASS en Python normal; 6/6 PASS en Python -O**. Ningún test falló.

SHA-256 de copias **locales** ejecutadas:
- `resource-budget.py`: `d3028540763e4b3618c097ced2fd215370b10711d087a040abad73fcf47ce232`
- `test_resource_budget.py`: `2348ddb04185b817479152e5ff47a293421049d6cf1d1bf18eeaab0cd406d302`

**Límite de evidencia:** los hashes son de copias locales reconstruidas; no se demostró identidad byte a byte con blobs de GitHub mediante una descarga autenticada. Las pruebas son del modelo sintético, no de OSRM, mapa real, Docker, RAM real ni alojamiento. No se descargó cartografía, no se activaron manualmente Actions, no se accedió a Supabase/staging/producción y no se generaron costos. `commercialQuoteEnabled=false`.
