# F6-B — NO-GO preventivo de agregación de duplicados (sin consulta de filas)

Fecha: 2026-11-10. Base `559d9415fbf89b457c0aa69ce3a83ee77bbcee50`. GitHub Actions #451: success. Proyecto autorizado: staging `xqahthghvozeigbojhyi`. **No se ejecutó consulta agregada ni se accedió a filas, direcciones, IDs, nombres, teléfonos, tokens o PII.**

## Resultado
**NO-GO — F6-B no ejecutada.** El contrato `NORM-v1` exige normalización Unicode NFC, colapso de secuencias Unicode White_Space, rechazo de controles invisibles y comparación exacta de bytes UTF-8. No existe evidencia validada de una función SQL de staging que reproduzca todos estos requisitos, ni de equivalencia exhaustiva con el contrato de F1. No sería correcto utilizar `lower`, `trim`, `btrim`, una collation regional ni una expresión regular SQL aproximada para contar duplicados y presentar ese número como definitivo.

## Condiciones previas para reanudar F6-B
1. Diseñar offline un algoritmo único de normalización NORM-v1 y una matriz reproducible de equivalencia Unicode entre la futura implementación de servidor y la especificación F1; incluir NFC descompuesto, NBSP, tabs, CR/LF, White_Space Unicode, C0/C1, U+200B, U+FEFF, acentos, mayúsculas y apartamentos.
2. Confirmar vía metadatos y revisión autorizada la disponibilidad de la normalización requerida en PostgreSQL, incluida versión Unicode y diferencias de collation; no asumir que `normalize()` cubre el colapso White_Space.
3. Diseñar una consulta agregada que solo devuelva indicador agregado de existencia o bandas suficientemente amplias; no devolver claves, filas, IDs, direcciones, ejemplos, ni grupos identificables. Evaluar riesgo de inferencia por conteos pequeños y de filtraciones en errores/logs.
4. Exigir nueva autorización explícita antes de consultar datos, incluso agregados. Si el contrato exacto no puede demostrarse, mantener NO-GO.

## Reversión y límites
Esta fase solo añade documentación y validación estática en GitHub. No se ejecutó SQL, no se consultó Supabase en F6-B, no se modificó producción, no se desplegó ni se activaron correos, servicios o pedidos reales. Reversión: `git revert` de este informe y validador. **No se conocen conteos de duplicados históricos; no afirmar cero duplicados.**
