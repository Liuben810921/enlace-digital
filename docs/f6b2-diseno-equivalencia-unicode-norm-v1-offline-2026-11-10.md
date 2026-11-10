# F6-B2 — Diseño offline de equivalencia NORM-v1 (NO EJECUTABLE)

Fecha: 2026-11-10. F6-B se mantiene NO-GO; no se consultan filas ni Supabase. La ejecución #455 detectó fallo literal en validador F6-B, corregido en `8178de1fe04f00b6c770f5ab6fb08bc410525363`.

## Contrato de referencia
La identidad es `cliente_numero int4` + versión `NORM-v1` + cuatro campos: provincia, municipio, barrio, dirección. Cada campo: Unicode válido, NFC, sustituir secuencias de Unicode White_Space por U+0020, trim de U+0020; preservar case, acentos, puntuación, ceros y apartamento; rechazar controles C0/C1 ajenos a White_Space, U+200B, U+FEFF, surrogates sin pareja. Barrio vacío permitido; provincia/municipio/dirección no vacíos y respetar límites de F1. Comparar bytes UTF-8, no collation regional. No incluir receptor, teléfono, referencias ni coordenadas.

## Diseño de servidor propuesto — NO SQL EJECUTABLE
1. Preferir una única función de normalización en servidor, versionada y probada con fixtures. PostgreSQL puede ofrecer normalización Unicode NFC en UTF8 mediante funciones propias, **pero debe comprobarse en la versión de staging** y no presupone reconocimiento de White_Space completo.
2. Para White_Space usar una tabla fija, auditada, de puntos de código Unicode White_Space del contrato: U+0009..U+000D, U+0020, U+0085, U+00A0, U+1680, U+2000..U+200A, U+2028, U+2029, U+202F, U+205F, U+3000. Aplicar equivalencia por puntos de código, no por clases regex dependientes de motor. Versionar tabla y especificación Unicode para evitar deriva.
3. Rechazar explícitamente C0/C1 restantes y U+200B/U+FEFF. Las entradas inválidas no se eliminan silenciosamente.
4. No usar `lower()`, `unaccent`, collation ICU regional ni `trim()` como sustitutos de NORM-v1. La identidad persistida debe comparar bytes UTF-8 (o representación hash con verificación exacta de bytes y resistencia a colisiones).
5. Definir canonicalización de cadena antes de crear UNIQUE; documentar transacciones y migración F2. El cliente JS puede hacer prevalidación para UX, pero el servidor decide la identidad.

## JavaScript (referencia conceptual, no código operativo)
`String.prototype.normalize("NFC")` y sustitución de un conjunto explícito de White_Space; **no confiar en `\\s`** sin prueba de equivalencia de versiones. Detectar pares sustitutos inválidos antes de NFC; `TextEncoder` puede reemplazarlos y ocultar divergencias. Comparar bytes con codificación UTF-8, no `localeCompare`.

## Matriz de fixtures offline
| Caso | Entrada / propiedad | Salida esperada |
|---|---|---|
| U01 | `A + U+0301` vs `Á` | mismo NFC |
| U02 | `La + NBSP + Habana` | `La Habana` |
| U03 | tabs, CR/LF y espacios repetidos | un espacio ASCII |
| U04 | U+1680, U+2003, U+202F, U+3000 | un espacio ASCII |
| U05 | U+0085, U+2028, U+2029 | un espacio ASCII |
| U06 | `Calle` vs `calle` | distintos |
| U07 | `Peña` vs `Pena` | distintos |
| U08 | `Apto 01` vs `Apto 1` | distintos |
| U09 | `C/1` vs `C 1` | distintos |
| U10 | U+200B, U+FEFF | rechazo |
| U11 | C0/C1 fuera White_Space | rechazo |
| U12 | surrogate sin pareja | rechazo |
| U13 | barrio vacío | permitido |
| U14 | provincia/municipio/dirección vacíos | rechazo |
| U15 | identidades de dos clientes | distintas |
| U16 | bytes UTF-8 tras NFC | comparación exacta |
| U17 | receptor/teléfono diferentes | no cambian identidad |
| U18 | secuencia Unicode no NFC (descompuesta) | bytes canónicos iguales |

## Prueba de equivalencia PostgreSQL ↔ JS, aún pendiente
Preparar un vector compartido de entrada, salida UTF-8 hexadecimal y resultado aceptar/rechazar. Ejecutar primero fixtures locales JavaScript y un oráculo independiente Python; **no equivalen a PostgreSQL**. Más adelante, con autorización específica, ejecutar los mismos fixtures en PostgreSQL aislado o staging sin datos reales, comparar byte a byte, versión de Unicode y reglas White_Space; bloquear agregación si hay una sola divergencia. No se ha ejecutado SQL ni probado PostgreSQL.

## Protocolo de agregación privada (solo diseño)
1. Requerir autorización nueva para cualquier consulta de filas, incluso si solo retorna agregados.
2. Validar antes la función NORM-v1 con fixtures en el mismo entorno de PostgreSQL; sin equivalencia demostrada, **NO-GO**.
3. Computar internamente claves de identidad por cliente sin retornar claves, valores, IDs ni filas; devolver solo indicador global `existen_colisiones` si hay garantías de no inferencia. Un conteo exacto o un booleano pueden revelar información cuando el conjunto es pequeño o el adversario conoce el entorno; revisar tamaño, autorización, acceso y posibilidad de ataques por diferencias temporales.
4. Evitar filtros por cliente, provincia, municipio o ventana temporal; evitar consultas repetidas comparables que permitan inferir grupos. No registrar parámetros, direcciones, resultados detallados ni errores con datos.
5. Preferir salida `NO-GO/GO` o bandas amplias solo si el responsable de privacidad autoriza la divulgación. No publicar conteos pequeños en GitHub.
6. Si existen colisiones, detener migración UNIQUE y preparar revisión separada; jamás fusionar ni borrar automáticamente.

## Criterios de salida y reversión
**NO-GO vigente** hasta equivalencia exacta servidor/JS probada y revisión de privacidad. Ningún agregado histórico fue calculado. Reversión documental: `git revert` de propuesta, pruebas y CI; Supabase y producción permanecen intactos.
