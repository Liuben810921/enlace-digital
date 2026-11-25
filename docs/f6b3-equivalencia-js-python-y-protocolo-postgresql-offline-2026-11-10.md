# F6-B3 — Equivalencia offline NORM-v1: JavaScript y oráculo Python

Fecha 2026-11-10. Exclusivamente GitHub, sin SQL, Supabase, filas de clientes ni código operativo. Base del trabajo `5645dd1dd32462c893e27441f4cf1aa8535af0aa`.

## Artefactos reproducibles
- `tests/fixtures/norm_v1_utf8_vectors.json`: 30 vectores sintéticos, entrada Unicode, hexadecimal UTF-8 esperado o rechazo; 25 puntos de código Unicode White_Space explícitos.
- `scripts/check_staging_norm_v1_js.cjs`: implementación aislada de referencia JavaScript, sin importación por frontend/Edge.
- `scripts/check_staging_norm_v1_python.py`: oráculo Python independiente, sin importar la implementación JS.
- `scripts/check_staging_f6b2_unicode_contract.py`: prueba estática anterior; se mantiene.

Ejecutar desde raíz: `node scripts/check_staging_norm_v1_js.cjs` y `python3 scripts/check_staging_norm_v1_python.py`. Ambos comparan los **mismos bytes UTF-8 esperados** en lugar de comparar solamente dos salidas potencialmente incorrectas.

## Cobertura y límites
30 casos: NFC compuesto/descompuesto, NBSP, tabs, CR/LF, White_Space Unicode (incluyendo U+0085, U+1680, U+2028/29, U+202F, U+3000), controles C0/C1, U+200B, U+FEFF, surrogate inválido, acentos, case, números de apartamento, barra, cadenas vacías y hexadecimal UTF-8. El motor JavaScript usa NFC nativo y el oráculo Python `unicodedata.normalize`; se registran versiones Unicode en salida. Las reglas de **validación de campos** (límites, provincia/municipio/dirección obligatorias, barrio opcional) se especifican en F1 y deben verificarse adicionalmente en el servidor.

**No demostrado:** igualdad de versión de Unicode en todos los entornos, equivalencia PostgreSQL, codificación y collation reales, índices UNIQUE, concurrencia, sesiones o seguridad RLS. No convertir un PASS offline en autorización para consultar datos.

## Protocolo futuro PostgreSQL, NO EJECUTABLE
1. Con autorización independiente para una prueba sin datos reales, verificar por metadatos versión de PostgreSQL, encoding UTF8, soporte de NFC, collation y disponibilidad de función de normalización; no consultar datos de clientes.
2. En entorno aislado y autorizado, implementar una función NORM-v1 versionada y rechazar caracteres invisibles; no confiar en regex de espacios o collation local. No desplegarla sobre staging sin permiso específico.
3. Pasar los mismos 30 vectores sintéticos, más todas las combinaciones de los 25 White_Space y controles C0/C1, y comparar resultado byte a byte con hexadecimal esperado. Registrar únicamente PASS/FAIL, versiones y hashes de fixtures, nunca datos reales.
4. Verificar límites de campo, UTF-8, NFC, comparación binaria, cambios de versión Unicode, reintentos, error handling y ausencia de fuga de información en logs.
5. Si hay cualquier divergencia, **NO-GO** para consultas agregadas de duplicados; investigar y repetir la batería. Solo después de equivalencia exacta y revisión de privacidad solicitar autorización **F6-B** de lectura agregada, separada de cualquier escritura.
6. El futuro agregado no debe devolver claves de identidad, IDs, direcciones, grupos, filas, muestras ni conteos pequeños que permitan inferencia; evaluar incluso riesgos de un booleano global y ataques de consultas repetidas. Mantener F6-C y F6-D no autorizadas.

## Reversión
`git revert` de los archivos de prueba, documento y workflow. Sin cambios de Supabase ni producción; pedidos reales, correos y servicios no se activan.
