# F6-B8 — Evaluación de privacidad y especificación de consulta histórica NORM-v1 (OFFLINE; NO EJECUTAR)

Fecha: 2026-11-10. Base `516e22aa03e404ce816e7a048c9ac4f3c24c9372`. GitHub Actions #511 `42889256320`: SUCCESS. **No se consultó Supabase, no se ejecutó SQL, no se leyeron datos de clientes y no se cambió producción.**

## Decisión ejecutiva y modelo de amenaza
**NO-GO para la consulta histórica en esta etapa.** El objetivo eventual es detectar colisiones de identidad de dirección dentro de `clientes_direcciones_entrega`, sin devolver direcciones, IDs ni conteos. Amenazas: reidentificación por universo pequeño, conocimiento externo de domicilios, diferencia entre ejecuciones, filtrado adaptativo, inferencia a partir de `0` o booleanos, mensajes de error, logs y estadísticas del plan de ejecución. Los datos de direcciones son sensibles incluso cuando se agregan.

### Política de divulgación conservadora
- **Salida por defecto `SUPPRESSED`**, sin indicador de si existen duplicados. No retornar `COUNT(*)`, número de grupos, número de clientes, hashes, máximo de repeticiones, IDs, muestras, filas, provincia/municipio, fechas ni particiones.
- El umbral de privacidad `k` permanece **sin definir** hasta evaluación independiente del tamaño del universo, conocimiento auxiliar y riesgo de pertenencia. No inventar `k=5`, `k=10` u otro umbral. Sin evidencia suficiente, **no ejecutar**; la supresión no es licencia para consultar innecesariamente.
- No realizar consultas por filtros, periodos, clientes, municipios o lotes; no repetir con distintas condiciones, ni comparar respuestas entre fechas. Presupuesto máximo propuesto: **una única consulta autorizada**, con identificador de aprobación y finalidad cerrada.
- `NO_SIGNAL` y `REVIEW_REQUIRED` solo podrán divulgarse tras aprobación de evaluación de inferencia. Un estado booleano o `0` también pueden revelar información.
- Alternativa preferente si no hay garantías: auditoría dentro de un entorno restringido, sin salida de señales, con revisión humana y controles formales.

## Especificación técnica de cálculo, NO SQL ejecutable
**Única fuente futura**: `public.clientes_direcciones_entrega`; no unir `clientes_oficiales` ni `clientes_destinatarios`. **Identidad:** `(version='NORM-v1', cliente_numero int4, provincia_norm, municipio_norm, barrio_norm, direccion_norm)`. Cada texto: validar Unicode, NFC, colapsar exactamente 25 Unicode White_Space a U+0020, trim U+0020, rechazar C0/C1 no White_Space, U+200B, U+FEFF y Unicode inválido; preservar case, acentos, signos, números y ceros iniciales. Comparar bytes UTF-8 canónicos de cada campo, no collation lingüística ni concatenación ambigua. No deduplicar receptores ni clientes distintos.

**NULL y datos históricos inválidos:**
- `cliente_numero` NULL/no positivo/no int4 => NO-GO; no agrupar NULL como si fuese un cliente.
- `provincia`, `municipio`, `direccion` NULL, vacíos o fuera de límites después de NORM-v1 => NO-GO; `barrio` NULL **no se convierte automáticamente** en cadena vacía: resolver semántica contractual con aprobación antes de ejecutar. Barrio vacío explícito sí es válido.
- Longitudes postnormalización: provincia/municipio 2–100, barrio 0–150, dirección 8–500. Un carácter inválido, incompatibilidad Unicode o error de normalización => NO-GO; no omitir filas silenciosamente, no revelar cuántas inválidas.
- Una colisión se detecta únicamente si dos o más filas comparten el mismo cliente y los cuatro componentes canónicos. Las claves y grupos nunca salen del motor.

**Forma abstracta de consulta, NO SQL ejecutable:**
```text
REQUIRE aprobación histórica específica, privacidad independiente, gates técnicos completos
READ ONLY from public.clientes_direcciones_entrega inside protected staging
FOR EACH row: validate NULL, bounds, Unicode and NORM-v1; any error => abort/suppress
COMPUTE byte-exact identity per client, group only internally
IF duplicates detected: internal boolean; never export keys/groups/counts
APPLY independently approved disclosure policy; default SUPPRESSED
RETURN at most approved non-quantitative status, else no result
```

## Permisos y límites
- Rol de **mínimo privilegio**, acceso SELECT exclusivamente a columnas necesarias de `clientes_direcciones_entrega`; sin SELECT de otras tablas, sin DDL/DML, sin SECURITY DEFINER, sin elevación, sin función persistente, extensión ni escritura de archivos. RLS y grants deben verificarse administrativamente **con nueva autorización** antes de ejecutar. El rol `postgres` es privilegiado; si solo está disponible ese rol, **NO-GO** hasta evaluación y aprobación específica.
- `statement_timeout` máximo propuesto 5 s y `lock_timeout` máximo propuesto 1 s, sujetos a revisión de carga y capacidad antes de ejecutar; no modificar parámetros globales. Transacción `READ ONLY`, aislamiento adecuado, un solo intento, sin `EXPLAIN ANALYZE`, sin exportación de filas, sin resultados por grupo, sin logging de parámetros o valores. Si timeouts son insuficientes, **NO-GO**, no ampliarlos automáticamente.
- No construir ni ejecutar consulta con credenciales de producción; proyecto destino se confirma inmediatamente antes de uso. Limitar salida de errores y telemetría a códigos generales, sin SQL con literales de datos.
- Sin índices, UNIQUE, RPC, migraciones, backfill, borrado, fusión ni reparación automática. El eventual plan de remediación exige backups restaurables y autorizaciones independientes.

## Gates F6-B8
| Gate | Condición | Estado |
|---|---|---|
| B8-01 | CI #511 base | PASS |
| B8-02 | 27/27 fixtures staging y 3 rechazos en frontera | PASS LIMITADO |
| B8-03 | Política de inferencia aprobada independientemente | NO-GO |
| B8-04 | Umbral k justificado y evaluación de universo | NO-GO |
| B8-05 | Semántica de barrio NULL aprobada | NO-GO |
| B8-06 | Rol de mínimo privilegio validado | NO-GO |
| B8-07 | Riesgos de logging y plan de ejecución revisados | NO-GO |
| B8-08 | Una única consulta y límites de tiempo aprobados | PENDIENTE |
| B8-09 | Autorización explícita de lectura histórica | **NO AUTORIZADA** |
| B8-10 | Sin consulta SQL histórica, clientes, Supabase ni producción en F6-B8 | PASS |

## Preflight futuro (requiere autorización distinta)
1. Reconfirmar staging, estado de GitHub Actions y versión NORM-v1; inspeccionar **solo metadatos autorizados** de grants, RLS, versión PostgreSQL/ICU y tipos NULL. No inferir existencia de duplicados.
2. Evaluar privacidad y aprobar o rechazar la forma exacta de salida antes de tocar datos. Si el universo no puede evaluarse sin riesgo, no realizar lectura.
3. Aprobar rol, timeouts, revisión de logging, presupuesto de una consulta y SQL final mediante revisión independiente. Si falla un gate, detenerse.
4. Solicitar autorización separada, explícita, **para ejecutar una única consulta histórica agregada** en staging. No es parte de F6-B8.

## Reversión y evidencias
Cambios limitados a documentación, validador y workflow GitHub; reversión `git revert`. Sin ejecución SQL ni consulta a Supabase, sin cambios de esquema, sin despliegues, sin correos, sin pedidos reales. Mantener F6-B histórico y F6-C/F6-D **NO-GO**.
