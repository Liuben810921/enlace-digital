# F6-B24 — JSON crudo, ambigüedad léxica y divergencia entre parsers

Fecha 2026-11-10. Solo PR #3 y GitHub Actions con PostgreSQL 17 desechable.

## Objetivo
Validar los bytes de entrada **antes** de convertir JSON a JSONB, sin aceptar normalizaciones numéricas o de Unicode implícitas. Este es un prototipo deliberadamente restringido: el JSON de transporte es ASCII y no admite secuencias de escape, incluidos `\\uXXXX`. No acepta texto libre. `amount_minor` es un entero JSON no negativo sin punto ni exponente, de hasta 15 cifras; las claves del objeto deben ser únicas.

## Vectorización
- Acepta el mismo objeto con orden de claves y espacios diferentes.
- Rechaza `1.0`, `1e0`, `1E+0`, números negativos, ceros iniciales, cantidades largas, strings, booleanos, null y no finitos.
- Rechaza claves JSON duplicadas, campos extra, campos ausentes, Unicode UTF-8 no ASCII y escapes JSON, incluso `\\u0065`.
- Limita el mensaje a 256 bytes, impone formato de campos y rechaza arrays y objetos de forma incorrecta.
- Comprueba divergencias reales de PostgreSQL JSONB: igualdad semántica `1.0 = 1`, `1e0 = 1` y retención del último valor ante clave duplicada.
- Reenvía **solo JSON reconstruido tras validación** a la función sintética F6-B23; comprueba NEW/REPLAY y que un error de entrada no consuma clave.

## Limitaciones de seguridad
No es un parser JSON general ni un contrato final para producción. El prototipo no acepta Unicode normalizado: lo **rechaza explícitamente**; una futura versión con texto libre necesitaría NFC versionado, tests entre lenguajes y límites de longitud tras normalizar. La validación léxica actual usa `json.loads` de Python con hooks de claves duplicadas y de números: su comportamiento no representa todos los parsers. Para un despliegue real se necesitarían tests con implementaciones independientes y validación de límites de infraestructura, autenticación y cargas de trabajo.

No se lee ni modifica Supabase, staging, producción, clientes, históricos, servicios, correo ni pedidos. No se fusiona el PR. Autorizaciones separadas A para modificar staging y B para leer históricos.

CI F6-B24: pendiente de comprobar la ejecución del último commit; no declarar PASS sin verificar.
