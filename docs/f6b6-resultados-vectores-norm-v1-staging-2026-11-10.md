# F6-B6 — Resultado real de 30 fixtures NORM-v1 en Supabase staging

Fecha: 2026-11-10. Base `da62eab3c4cb3ed76d0177f88f9b1a5ec8ee2dde`. GitHub Actions #499, ID `42880756148`, **SUCCESS** antes de ejecutar pruebas. Proyecto exclusivo `enlace-digital-staging` (`xqahthghvozeigbojhyi`).

## Autorización y método
Autorización explícita del usuario para ejecutar solo expresiones SQL sintéticas NORM-v1 en staging, sin consultar tablas de negocio ni modificar el esquema. Se utilizó **una consulta `WITH RECURSIVE` y `VALUES` con 27 vectores UTF-8 sintéticos codificados en hexadecimal** del archivo `tests/fixtures/norm_v1_utf8_vectors.json`. La consulta aplicó `normalize(raw,NFC)`, recorrió puntos de código con `ascii(substr(...))`, colapsó los 25 puntos de código White_Space, detectó C0/C1 no permitidos, U+200B y U+FEFF, y comparó `encode(convert_to(output,'UTF8'),'hex')` con hexadecimal esperado. Solo retornó métricas globales de los fixtures (sin entradas, direcciones, clientes ni datos reales).

No se crearon tablas, funciones, extensiones ni objetos temporales; no hubo DDL/DML ni despliegues.

## Incidencia técnica y corrección
- Primer intento: **ERROR 42P21**, collation distinta entre término inicial y recursivo de la CTE, por mezcla de default/ICU y `C`. Ningún resultado funcional de esa ejecución.
- Corrección: definir explícitamente `(''::text COLLATE "C")` como acumulador inicial, manteniendo comparación binaria de resultados UTF-8. Repetición completa **PASS**.

## Resultado observado
- `tested=27`, `passed=27`, `failed=0`, `failed_ids=NULL`.
- Los vectores `V19` (NUL), `V21` y `V22` (surrogates inválidos) no se enviaron al motor SQL porque no son representables como texto PostgreSQL válido. El filtro previo los identificó y preservó su condición de **rechazo en frontera**, pero **no constituyen 3 PASS de PostgreSQL**.
- 27/27 comprueban resultados UTF-8 exactos para NFC, Unicode White_Space, controles invisibles, acentos, case y puntuación; los rechazos UTF-8 transportables se verificaron como predicados sintéticos, no mediante una función que lance excepciones.
- Entorno preflight F6-B5: PostgreSQL 17.11, UTF8, collation `en_US.UTF-8`, proveedor ICU `datlocprovider=i`, versión de collation `153.121`. `normalize(text,text)` disponible y ejecutable. La versión de tablas Unicode NFC del servidor **no se verificó de manera independiente**.

## Limitaciones y riesgos
1. **PASS limitado a fixtures sintéticos**, no equivalencia para todo Unicode, ni pruebas de validación de longitud de campos o concurrencia.
2. CTE de prueba no es función persistente de staging; no prueba UNIQUE, RLS, RPC, permisos de aplicación, ni deduplicación real.
3. El proveedor ICU en staging difiere de libc del contenedor aislado; comparación de salida se efectuó en hexadecimal UTF-8, no con collation lingüística.
4. El NUL y los dos surrogates fueron filtrados antes de SQL, sin validar la conducta del servidor ante un intento de transporte inválido.
5. Un agregado histórico puede filtrar información incluso sin filas individuales. **F6-B para registros reales sigue NO-GO** hasta autorización independiente, revisión de privacidad y diseño de salida que evite grupos identificables.

## Próximo paso y reversión
Solicitar autorización **separada** antes de cualquier lectura agregada de duplicados históricos. El informe puede revertirse con `git revert`; las consultas sintéticas no dejaron cambios persistentes. Supabase producción, correos, servicios y pedidos reales permanecen sin cambios.
