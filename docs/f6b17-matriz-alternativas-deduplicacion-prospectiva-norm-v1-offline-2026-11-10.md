# F6-B17 — Matriz de decisión para deduplicación NORM-v1 sin lectura histórica

**Fecha:** 2026-11-10. **Base:** `1334ce2fa66cd5ab47ee47b6b0ebab34aa947153`. GitHub Actions #578 (run 42904679442) y #31 (run 42904679362): **SUCCESS**, sin pasos fallidos. Exclusivamente diseño offline y CI estático en GitHub; sin SQL ejecutado, sin consultas a Supabase ni a clientes, sin cambios de staging o producción.

## Decisión

**GO para preparar una ruta prospectiva y sus pruebas sintéticas; NO-GO para aplicar UNIQUE global, migrar datos históricos o declarar resuelta la deduplicación existente.** Sin lectura de filas reales no se puede demostrar ausencia de colisiones históricas ni seleccionar automáticamente registros canónicos. El camino prospectivo puede impedir nuevas colisiones **solo después de implantar una garantía atómica de servidor autorizada**; validaciones de formulario o comprobaciones previas a INSERT por sí solas no garantizan unicidad ante concurrencia.

## Matriz de alternativas

| ID | Alternativa | Ventaja | Dependencias y riesgos | Decisión actual |
|---|---|---|---|---|
| D17-01 | Validación prospectiva en cliente/formulario | Retroalimentación temprana, sin tocar históricos | Se puede eludir, carreras entre clientes, discrepancias Unicode; jamás garantía única | GO diseño offline; NO-GO despliegue |
| D17-02 | Normalización NORM-v1 en registro, lado servidor | Contrato único y rechazo consistente; preserva cadena original si se diseña así | NFC, 25 espacios, C0/C1, U+200B/FEFF, longitudes, UTF-8 y errores; requiere pruebas de paridad, autorización de cambio y rollback | GO especificación; NO-GO ejecución |
| D17-03 | Control de unicidad prospectiva atómico (tabla auxiliar de claves normalizadas) | Puede serializar inserciones nuevas sin imponer UNIQUE sobre filas históricas | Requiere claves por cliente, bloqueo/transacción, permisos, RLS, backfill ausente y estrategia de reconciliación; no cubre duplicados antiguos ni colisiones nuevo-vs-histórico sin consultar histórico | CONDICIONAL / NO-GO |
| D17-04 | UNIQUE global diferido sobre identidad normalizada | Garantía declarativa robusta tras limpiar históricos | PostgreSQL no permite imponer UNIQUE válido si ya hay colisiones; CREATE UNIQUE INDEX puede fallar, bloquear/consumir recursos; no hay auditoría histórica autorizada | NO-GO |
| D17-05 | Migración por lotes con revisión humana y conservación histórica | Puede resolver duplicados preservando destinatarios, pedidos y referencias | Necesita inventario real, plan de identidad canónica, backup, locks, integridad referencial, privacidad y lectura histórica autorizada por separado | NO-GO |
| D17-06 | Shadow keys / dual-write temporal con reconciliación posterior | Facilita transición gradual | Desincronización, conflictos, coste operacional y ventanas de inconsistencia; no demuestra unicidad global sin auditoría | NO-GO |
| D17-07 | Solo monitorización agregada con SUPPRESSED | Reduce exposición directa en diseño | Sin k aprobado, presupuesto de consultas ni mitigación de tiempo/logs, no prueba ausencia de duplicados; F6-B16 NO-GO | NO-GO |

## Identidad y criterios funcionales

Clave lógica: `(cliente_numero, NORM-v1(provincia), NORM-v1(municipio), NORM-v1(barrio), NORM-v1(direccion))`. Comparación **UTF-8 bytea**, no colación lingüística; conservar mayúsculas, acentos, puntuación y ceros. Aplicar NFC, exactamente 25 puntos `White_Space`, recortar/colapsar espacios, rechazar C0/C1 no permitidos, U+200B, U+FEFF y entradas inválidas. Longitudes normalizadas: provincia/municipio 2–100, barrio 0–150, dirección 8–500; NULL falla cerrado. `barrio` vacío permitido; los demás campos no. Los 30 vectores sintéticos de F6-B14 (28 transportables a PostgreSQL, 2 sustitutos rechazados en frontera UTF-8) son una muestra, no demostración universal.

### Restricción crucial: nuevo frente a histórico

Sin lectura histórica ni índice global válido, una tabla auxiliar vacía puede impedir que **dos nuevas** escrituras generen la misma clave, pero **no puede asegurar** que una nueva dirección no duplique una fila antigua. No anunciar deduplicación global, ni crear índice UNIQUE sobre históricos, ni ejecutar un backfill no autorizado. Cualquier política transitoria debe declarar explícitamente la cobertura temporal y el riesgo de duplicados intergeneracionales.

## Dependencias y gates GO/NO-GO

| Gate | Requisito verificable | Estado |
|---|---|---|
| G17-01 | CI previo #578 y #31 verde | PASS |
| G17-02 | Contrato Unicode idéntico en cliente, servidor y PostgreSQL, pruebas sintéticas y límites | GO offline |
| G17-03 | Propuesta transaccional anti-carreras con pruebas de concurrencia y rollback ficticios | PENDIENTE |
| G17-04 | Alcance prospectivo claramente etiquetado, sin garantía contra filas históricas | REQUERIDO |
| G17-05 | Modelo de permisos mínimos, RLS y ausencia de escalada revisado | NO-GO staging |
| G17-06 | Auditoría de colisiones históricas bajo política de privacidad y aprobación independiente | NO-GO histórico |
| G17-07 | Plan de conservación de IDs, destinatarios, pedidos y referencias; migración idempotente | NO-GO migración |
| G17-08 | Plan de rollback transaccional y prueba de restauración sin borrar históricos | PENDIENTE |
| G17-09 | Cuotas, locks, índices, almacenamiento y costos gratuitos revisados antes de usar staging | PENDIENTE |
| G17-10 | Autorizaciones A y B independientes, sin activación de servicios | NO AUTORIZADAS |

## Secuencia recomendada

1. **F6-B18 offline:** diseñar y probar en PostgreSQL desechable la ruta prospectiva transaccional con dos sesiones concurrentes ficticias; demostrar bloqueo/colisión entre nuevos registros y documentar expresamente la limitación frente a históricos.
2. Revisar esquema de permisos, RLS, contratos de entrada y reversión, sin modificar Supabase.
3. Si el riesgo residual baja a un nivel aceptable, solicitar **autorización A** específica para un cambio delimitado de staging, sin incluir lectura de filas.
4. Solo con un propósito y política de privacidad aprobados, solicitar **autorización B** distinta para cualquier consulta histórica, incluida agregada. La autorización A no implica B.
5. No plantear UNIQUE global ni migración real hasta comprobar colisiones y aprobar por separado respaldo, reconciliación, integridad referencial y reversión.

## Riesgos y costos

Validación en cliente: costo bajo pero evadible; normalización en servidor: CPU por escritura; tabla auxiliar: almacenamiento, índices y contención; UNIQUE global: creación de índice, locks y posible fallo por duplicados; migración: I/O, bloqueos y consumo de recursos. GitHub Actions y Supabase tienen cuotas: **no afirmar costo cero** sin verificar el plan y los límites antes de usar servicios. Ningún cambio en staging está autorizado. Los errores deben ser uniformes sin exponer identidades; logs, timings y reintentos siguen riesgos abiertos de F6-B16.

## Reversión y fronteras de autorización

F6-B17 solo modifica documentación, validador y workflow de GitHub: revertir con `git revert`. No existen tablas, índices, funciones, roles, grants o políticas creados en Supabase. Para futuras pruebas sintéticas, usar PostgreSQL desechable y `ROLLBACK`. Para cualquier cambio real, requerir inventario previo, plan reversible y **autorización A específica**. Para leer datos históricos, **autorización B separada**, incluso si se pretende devolver solo `SUPPRESSED`.

**Resultado final: GO exclusivamente offline; NO-GO staging; NO-GO lectura histórica; NO-GO UNIQUE global; NO-GO migración real.**
