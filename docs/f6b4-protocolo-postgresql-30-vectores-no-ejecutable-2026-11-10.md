# F6-B4 — Protocolo PostgreSQL NORM-v1 con 30 vectores ficticios (NO EJECUTABLE)

Fecha: 2026-11-10. Base `b40a21b3354eddbb601beb176ddb5910b1544528`. GitHub Actions #473: SUCCESS. Exclusivamente preparación en GitHub. **No ejecutar SQL, no consultar Supabase ni acceder a datos de clientes.**

## Objetivo y límites
Verificar en fase futura y **con autorización específica** si una implementación PostgreSQL reproduce exactamente los 30 vectores sintéticos `tests/fixtures/norm_v1_utf8_vectors.json`, sin utilizar tablas ni filas de clientes. Esta fase solo define el procedimiento y sus condiciones de seguridad; no instala funciones ni migraciones.

## Preflight de entorno futuro
1. Usar un PostgreSQL aislado, desechable, sin conexión a staging o producción ni credenciales reales. Exigir autorización expresa antes de iniciarlo o ejecutar consultas.
2. Confirmar versión exacta de PostgreSQL, `server_encoding=UTF8`, sistema operativo, proveedor de collation (libc/ICU), versión de ICU/libc, versión Unicode disponible para NFC y versión de runtime de la implementación de prueba. PostgreSQL 17 no implica una versión Unicode concreta.
3. Confirmar soporte de normalización NFC para UTF8 y manejo de caracteres no representables. PostgreSQL no acepta `NUL` en texto y puede rechazar surrogates inválidos en el transporte JSON; estos rechazos se deben verificar en la frontera, sin alterar ni omitir fixtures.
4. Usar exclusivamente vectores ficticios. Evitar tablas persistentes, logs de datos y acceso de red. No crear extensiones, funciones persistentes ni índices en staging.
5. Definir como referencia el archivo JSON compartido, con 30 casos y hexadecimal UTF-8 esperado, no el resultado de otro motor sin comparación externa.

## Diseño de prueba PostgreSQL, no SQL ejecutable
- La función normativa futura debe realizar **NFC**, colapsar exactamente los 25 puntos de código Unicode White_Space del fixture, quitar espacios U+0020 de los extremos y rechazar C0/C1 no White_Space, U+200B, U+FEFF y Unicode inválido.
- No confiar en regex `\\s`, `btrim`, `lower`, `unaccent` ni collation regional. Separar validación de entrada del transporte y normalización del valor.
- Para cada caso aceptado, comparar **hexadecimal de bytes UTF-8** de salida con `output_hex`; para cada `reject:true`, exigir rechazo explícito, sin sustitución silenciosa. La igualdad debe ser binaria, no lingüística.
- No depender de ordenamiento o igualdad por collation ICU/libc para la identidad; fijar representación canónica UTF-8 y comparar bytes. Las collation deterministas pueden no equivaler a comparación byte a byte bajo todos los operadores; verificar método concreto.
- Registrar versiones, 30 PASS/FAIL individuales, número de divergencias, estado de transporte y hash de fixture. No registrar datos de clientes ni secretos.

## Matriz de aceptación
| Gate | Requisito | Estado actual |
|---|---|---|
| PG01 | PostgreSQL aislado, desechable y autorizado | PENDIENTE |
| PG02 | Encoding UTF8 y versiones Unicode/collation documentadas | PENDIENTE |
| PG03 | 30 vectores sintéticos aceptados/rechazados correctamente | PENDIENTE |
| PG04 | 25 White_Space explícitos cubiertos | PENDIENTE |
| PG05 | NFC compuesto/descompuesto equivalente en bytes | PENDIENTE |
| PG06 | U+200B, U+FEFF, C0/C1 y surrogates inválidos rechazados | PENDIENTE |
| PG07 | Comparación byte a byte, sin dependencia regional | PENDIENTE |
| PG08 | Entradas inválidas de JSON/transporte rechazadas sin pérdida | PENDIENTE |
| PG09 | Diferencias de Unicode 16.0.0 Python vs 17.0 JavaScript evaluadas | PENDIENTE |
| PG10 | Sin tablas de clientes, red, datos reales, extensiones ni persistencia | PENDIENTE |
| PG11 | Sin fuga de valores/credenciales en logs ni informes | PENDIENTE |
| PG12 | Reversión: descartar entorno aislado, sin efectos en staging | PENDIENTE |

## Procedimiento futuro por autorizaciones separadas
**Autorización A (todavía no otorgada):** crear entorno PostgreSQL aislado y ejecutar únicamente pruebas sintéticas de contrato, con verificación de versiones y comparación UTF-8. Si no hay capacidad de aislamiento o la implementación requiere cambios de base, NO-GO.

**Autorización B (todavía no otorgada):** tras PASS integral, decidir si es necesario repetir únicamente fixtures en Supabase staging, sin datos reales y con una autorización independiente. Una prueba local no acredita automáticamente staging.

**Autorización C (todavía no otorgada):** cualquier consulta agregada de duplicados históricos requiere aprobación adicional, revisión de privacidad y equivalencia probada en entorno destino. Ninguna lectura de clientes está autorizada ahora.

## NO-GO y reversión
Divergencia de un solo fixture, versión Unicode no comprendida, collation no determinista sin comparación binaria verificada, sustitución silenciosa de Unicode inválido, imposibilidad de aislar PostgreSQL o riesgo de datos reales: **NO-GO**. Reversión de esta fase documental: `git revert`; ningún estado externo fue alterado.
