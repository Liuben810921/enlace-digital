# Auditoría estática final — seguridad y fallos cerrados (14 de noviembre de 2026)

Rama: `plan/havana-osrm-benchmark-offline-20261114`; referencia inicial: `99b95c5a5821d5fbfd89bc670e19f56addb42c72`.

## Archivos exactos inspeccionados
- `tests/audit-havana-manifest-workflows-offline.py`, objeto Git inicial `07191826a5bca38f08856ce889c37e37df0910f3`.
- `.github/workflows/havana-manifest-offline-candidate.yml`, objeto Git `e560324ba32bb8942a23831947355462f629cb21`.
- `.github/workflows/havana-manifest-offline-preparation.yml`, objeto Git `f68afe8d9065fa93bca4e503fefe341fd26656a7`.

Se consultó el contenido íntegro mediante el conector GitHub. No se modificaron los workflows ni se ejecutaron sus comandos.

## Fallos comprobados por inspección y correcciones
1. `check(raw,...)` calculaba `raw.encode('utf-8')` antes de su bloque `try`; una cadena con surrogate Unicode no emparejado podía lanzar `UnicodeEncodeError` sin retorno `False`. Se añadió control de tipo y captura `UnicodeError` para fallar cerrado.
2. El workflow de preparación se validaba con `steps[0]['run'].strip()`, aceptando cambios de espacios y líneas finales sin igualdad textual exacta. Se sustituyó por comparación byte a byte del cuerpo de comandos esperado.
3. La batería cubría predominantemente el candidato y no sometía el workflow de preparación a mutaciones independientes. Se añadieron siete ataques para triggers, guardia, permisos, shell, pasos, timeout y nombre.
4. Se añadieron cuatro entradas de borde: surrogate Unicode, tamaño excesivo, `None` y `bytes`. Se revisaron las secuencias de nueva línea para que las mutaciones representen YAML real.

## Evidencia y límites
- Los hashes SHA-256 de los dos cuerpos `run` del candidato **no cambiaron**; se conservan los valores previamente documentados: `043cb738b79aa6a9a75437e316f9ca77b1084241b4e17519d86c7c3d69d91dc8` y `f1e1808e44f82205346c804bc63e232ff304aef09282dc178a367e44e1f29240`.
- Las 35 mutaciones originales habían superado la ejecución offline documentada en la etapa anterior, tanto en modo normal como en `python -O`. La nueva batería incluye **46 casos definidos** (35 anteriores + 11 adicionales).
- **No se ha ejecutado en esta etapa la versión final de 46 casos en el entorno local.** Por tanto su resultado debe considerarse `PENDIENTE`, no `PASS`. La inspección del código no reemplaza una ejecución reproducible. Tampoco se afirma certificación por GitHub Actions.
- El código conserva `require` y no depende de `assert`; ello evita que `python -O` omita las comprobaciones.

## Bloqueos operativos
- Ambos YAML conservan `on: {}`, `if: ${{ false }}`, `permissions: {}` y flags comerciales desactivados.
- La obtención de código mediante `git fetch` requiere red previa a `unshare`, sin garantía de egress limitado exclusivamente a GitHub.
- Aislamiento del runner, costos y facturación futura no certificados. No habilitar CI.
- No se accedió a Supabase, staging, producción, clientes, pedidos o inventario; no se descargó cartografía, no se ejecutó OSRM ni se activó GitHub Actions.

## Próxima verificación requerida
Ejecutar el archivo exacto publicado en GitHub en un entorno local offline con PyYAML preinstalado, en modos normal y `python -O`, contra copias exactas de ambos YAML; verificar los hashes Git de los tres archivos y registrar salida, código de retorno y SHA-256 de los cuerpos `run`.
