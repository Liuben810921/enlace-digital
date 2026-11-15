# Verificación offline de paquete — evidencia parcial y bloqueantes (2026-11-14)

Referencia inicial: `3b8f5fef1893feb60c4e48a70c178631e92fa1c5`.

Se consultaron mediante el conector GitHub los contenidos de `tests/verify-havana-offline-source-bundle.py`, `tests/test-havana-offline-source-bundle.py` y `tests/fixtures/havana-offline-source-bundle-lock.json`. Los tres archivos fuente del paquete se inspeccionaron también en la fase inmediatamente anterior, con objetos Git `c8503cb7a67c5d4517ef21ba34881a412fbddc6c`, `af3bbcb60ff67237ed3691b45a30046cd52322e1` y `cf9f67c507d2619ee5979a39db0caef3e6ae7145`.

**Limitación crítica:** las copias locales de los dos scripts Node no son idénticas a los objetos Git. Sus hashes Git locales son `691562b039b9d5d066ec89be9f58673c2601a894` y `5459d56df3e9586e61e1be23861dfcd28274fb05`, respectivamente. No se dispone aún de una transferencia byte a byte verificable de esos dos objetos del conector al contenedor local. Por ello **no se ha ejecutado la batería completa contra los tres archivos exactos**, ni se han fijado SHA-256 como si estuvieran verificados.

Se corrigió una construcción de prueba de JSON duplicado que eliminaba dos bytes finales del lockfile (lo que producía JSON malformado en lugar de un duplicado válido); ahora elimina solo la llave final después de espacios. Se añadió una prueba determinista de sustitución por symlink entre `lstat` y `os.open`, restaurando el archivo en la copia temporal. La batería pasa de 17 a **18 casos definidos** (no ejecutados aún contra los archivos exactos). Esta prueba cubre una carrera específica, no todas las condiciones TOCTOU posibles.

## Evidencia requerida para cierre
1. Materializar en entorno local los bytes exactos de los tres archivos fuente y de los tres archivos del verificador/lockfile; comparar `git hash-object` con los objetos Git declarados.
2. Calcular SHA-256 de los tres archivos exactos y añadirlos al lockfile y a las constantes independientes del verificador, sin basarse en bytes reconstruidos aproximados.
3. Ejecutar `python3 tests/verify-havana-offline-source-bundle.py .` y `python3 -O tests/verify-havana-offline-source-bundle.py .`, registrar stdout/stderr y exit code.
4. Ejecutar `python3 tests/test-havana-offline-source-bundle.py .` y su variante `-O`; registrar resultados de las 18 pruebas.
5. Verificar carreras adicionales de renombrado de directorio padre y modificación concurrente durante lectura. No declarar protección absoluta sin snapshot inmutable.

**Decisión: NO-GO.** Los workflows cartográficos existentes no fueron modificados y siguen con `on: {}`, `if: ${{ false }}`, `permissions: {}` y flags comerciales desactivados. No se ejecutaron GitHub Actions, Node, OSRM, descargas de cartografía ni accesos a Supabase, staging o producción.
