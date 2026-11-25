# F6-B3 — Cierre de CI #469 y versiones Unicode comprobadas

Fecha: 2026-11-10. Commit validado `fa9f44b8cf51173a17d608224c74b7c6b5ce5033`. GitHub Actions **#469**, ID `42877039930`, job `static` **SUCCESS**, sin pasos fallidos.

## Evidencia reproducible de logs
- Runner GitHub Actions: `ubuntu-26.04`, imagen `20261101.186.1`.
- Oráculo Python `unicodedata.unidata_version`: **16.0.0**, 30/30 fixtures UTF-8 correctos.
- JavaScript Node `process.versions.unicode`: **17.0**, 30/30 fixtures UTF-8 correctos.
- El conjunto compartido `tests/fixtures/norm_v1_utf8_vectors.json` contiene 30 entradas sintéticas y hexadecimal UTF-8 esperado o rechazo. Ambos validadores lo ejecutaron correctamente.
- No hubo fallos de documentación, fixtures ni workflow que requirieran corrección adicional.

## Diferencia y riesgo residual
**Diferencia de versiones Unicode detectada (16.0.0 frente a 17.0).** Los 30 casos coinciden con las salidas esperadas, pero **no prueban equivalencia para todo Unicode**. Una actualización de tablas Unicode, nuevos caracteres o divergencias de normalización fuera de los fixtures podrían generar claves distintas. Registrar y fijar versiones en una implementación futura, aumentar cobertura con casos de frontera y ejecutar prueba específica PostgreSQL antes de cualquier consulta agregada. No se ha probado PostgreSQL ni Supabase.

## Estado de autorización
F6-B para datos reales continúa **NO-GO**. Solo pruebas offline; no SQL, Supabase, datos de clientes, DDL/DML, despliegues, producción, correos ni pedidos reales. La autorización siguiente deberá especificar una prueba PostgreSQL aislada **con cadenas ficticias**, separada de consultas de registros. La lectura agregada de duplicados requiere autorización posterior adicional.

## Reversión
Documento únicamente; `git revert` de este informe y sus comprobaciones si fuera necesario.
