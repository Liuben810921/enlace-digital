# F6-B16 — Evaluación final offline de riesgos residuales y puertas GO/NO-GO para NORM-v1

**Fecha:** 2026-11-10. **Base:** `14f4140d5f12c71e76f8779400f12e6d4c1d8cd3`. **Evidencia previa:** GitHub Actions #27 (42904108683) y #572 (42904108680), ambas SUCCESS, sin pasos fallidos. **Ámbito:** documentación y validación estática en GitHub exclusivamente. No se ejecuta SQL, no se consulta Supabase ni datos de clientes, no se modifica staging, producción ni código operativo.

## Decisión ejecutiva

**NO-GO para implementar el mecanismo encapsulado en Supabase staging. NO-GO independiente para leer datos históricos, incluso agregados.** El éxito de F6-B13 a F6-B15 solo prueba propiedades de un fixture PostgreSQL desechable con datos ficticios; no acredita ausencia de canales laterales ni los permisos reales de staging. No existe un umbral k ni política de divulgación aprobados. No deben tratarse los resultados sintéticos como certificación de privacidad.

**GO únicamente para trabajo offline en GitHub**: revisión de diseño, pruebas sintéticas adicionales y especificación de controles, sin conexiones a Supabase.

## Matriz de riesgos residuales y evidencia

| ID | Superficie | Evidencia existente | Riesgo residual / condición pendiente | Estado |
|---|---|---|---|---|
| R16-01 | Tiempos y planificación | F6-B15 repite llamadas con salida idéntica | Tiempo variable según datos, errores, caché, locks, plan y carga; no hay prueba de indistinguibilidad ni presupuesto de filtración | NO-GO |
| R16-02 | Logs y telemetría | Fixture sin datos reales | `EXCEPTION WHEN OTHERS` no controla logs de servidor, errores previos al wrapper, historial SQL, trazas ni auditoría; falta inventario administrativo sin PII | NO-GO |
| R16-03 | Errores | `SUPPRESSED` en fixture válido e inválido | Captura genérica puede ocultar fallos; SQLSTATE, DETAIL/HINT, timeout y errores fuera del wrapper requieren revisión sin filtrar datos | NO-GO |
| R16-04 | RLS | RLS habilitado y política limitada en fixture | Staging: metadatos F6-B9 mostraron RLS activo, FORCE desactivado y cero políticas; una política de acceso futuro puede abrir lectura directa al owner | NO-GO |
| R16-05 | Owner / escalada | Owner NOLOGIN sin BYPASSRLS y pruebas de CREATE, GRANT, SET ROLE | Falta evaluar grants efectivos, herencias, PUBLIC, default privileges, schema ownership, capacidad SET ROLE y PostgREST en staging | NO-GO |
| R16-06 | SECURITY DEFINER / search_path | `search_path=pg_catalog,pg_temp`, referencias cualificadas en fixture | Shadowing de funciones/operadores, ownership, extensiones, invocaciones indirectas y definición desplegada no auditados | NO-GO |
| R16-07 | Repetición y diferencias | 12+12 llamadas con SUPPRESSED; 12 caller, 5 denegadas | El prototipo permite reintentos; no hay control efectivo de ejecución única, anti-diferenciación, presupuesto de consultas ni auditoría sin PII | NO-GO |
| R16-08 | Supresión y divulgación | Solo `SUPPRESSED` en fixture | k indefinido; booleanos, conteos, categorías, IDs, hashes y grupos pueden revelar pertenencia; no hay política de liberación independiente | NO-GO |
| R16-09 | NORM-v1 | 30 vectores: 28 transportables a PostgreSQL, 2 sustitutos inválidos rechazados antes | Muestra finita, no demostración universal; datos históricos y NULL/vacíos desconocidos; colisiones no medidas | NO-GO |
| R16-10 | Costos y operación | PostgreSQL 17 desechable en GitHub Actions | Cuotas de Actions, plan gratuito de Supabase, CPU, memoria, timeouts, locks y carga real no evaluados para staging; no asumir costo cero | NO-GO |
| R16-11 | Reversión | `ROLLBACK` de fixtures y `git revert` para GitHub | Revocar permisos no borra datos ya vistos ni logs; faltan inventario previo, rollback preciso y verificación de grants/policies/funciones | NO-GO |
| R16-12 | Separación de autorizaciones | No hay lectura histórica ni modificación staging en F6-B16 | La aprobación de código o CI no concede autorización para cambios de permisos ni lectura de filas | NO-GO |

## Requisitos verificables antes de solicitar una futura autorización A (cambios de staging)

1. **A16-01 — Diseño cerrado:** interfaz sin parámetros de filtrado, ni retorno de filas, IDs, direcciones, hashes, conteos, booleanos o estados diferenciables; demostrar que el trabajo real de la función es necesario antes de ejecutarlo.
2. **A16-02 — Privilegios:** owner dedicado sin SUPERUSER, BYPASSRLS, pg_read_all_data, CREATEROLE, CREATEDB, herencias amplias ni capacidad de crear objetos; caller solo EXECUTE, sin SELECT directo ni capacidad SET ROLE. Revisar `PUBLIC`, `anon`, `authenticated`, `service_role` y default privileges. Los metadatos F6-B9 son evidencia histórica, no una revalidación actual.
3. **A16-03 — RLS:** política mínima por rol, revisión de impacto y prueba negativa con datos ficticios; prohibido abrir `USING (true)` indiscriminadamente. Evitar que el propietario de tabla eluda RLS; documentar la interacción con FORCE RLS sin modificarlo ahora.
4. **A16-04 — Encapsulación:** revisión independiente de `SECURITY DEFINER`, `search_path`, nombres cualificados, funciones auxiliares, EXECUTE, errores, SQL dinámico y superficie RPC/PostgREST.
5. **A16-05 — Privacidad:** política formal de supresión con criterios de divulgación, umbral k justificado si procede, protección frente a inferencia y diferenciación. Hasta entonces salida obligatoria `SUPPRESSED` y lectura histórica NO-GO.
6. **A16-06 — Operación:** análisis de tiempos, logs, auditoría, consultas repetidas, locks, timeout, cuotas y costos gratuitos; definir controles de ejecución única sin introducir nuevas tablas/servicios no autorizados.
7. **A16-07 — Reversión:** plan transaccional y copia de metadatos de objetos/grants previos, restauración exacta, pruebas de rollback y condición de parada; no usar `DROP OWNED` indiscriminado.
8. **A16-08 — Evidencia:** revisión por pares y CI sintético verde. Eliminar riesgos críticos o declarar explícitamente NO-GO; ninguna excepción implícita por éxito de CI.
9. **A16-09 — Alcance:** autorización A específica para una propuesta concreta y revisada de cambios **solo en staging**. Ningún cambio se aplica con esta fase.

## Puerta B separada: eventual lectura histórica

**B16-01:** autorización B independiente, explícita y posterior, que detalle finalidad, tabla, campos, operador, fecha, consulta única, presupuesto de consultas, mecanismo y salida permitida. **B16-02:** comprobar permisos mínimos y controles de privacidad antes de tocar datos reales, sin que una autorización A implique B. **B16-03:** transacción READ ONLY, timeouts y logging revisados, sin exportaciones ni EXPLAIN ANALYZE, sin filtros adaptativos o reintentos. **B16-04:** si cualquier control falla, devolver solo estado administrativo NO-GO, sin ejecutar la consulta. **B16-05:** no inferir ni publicar número de duplicados, presencia/ausencia o cardinalidad a partir de `SUPPRESSED`.

**Estado de A y B: NO AUTORIZADAS.** Se necesitan **dos decisiones independientes**, no un consentimiento combinado.

## Costos, seguridad y reversión de esta fase

F6-B16 no crea infraestructura ni utiliza Supabase; la ejecución de validadores en GitHub Actions consume minutos sujetos a las cuotas del repositorio. No se promete que una futura implementación en Supabase sea gratuita sin comprobar límites de plan, cómputo y carga. Reversión de F6-B16: `git revert` de documento, validador y workflow; no existen cambios de base de datos que revertir.

## Puertas finales

| Gate | Resultado |
|---|---|
| B16-01 — Actions #27 y #572 verificados | PASS |
| B16-02 — Matriz de riesgos y evidencia sintética | DOCUMENTADO |
| B16-03 — Tiempos y logs seguros en staging | NO-GO |
| B16-04 — RLS, owner, EXECUTE y herencias revisados en staging | NO-GO |
| B16-05 — Ejecución única y errores no filtrantes | NO-GO |
| B16-06 — Política de privacidad, supresión y k | NO-GO |
| B16-07 — Costos, carga y reversión de staging | NO-GO |
| B16-08 — Autorización A para cambios staging | NO AUTORIZADA |
| B16-09 — Autorización B para lectura histórica | NO AUTORIZADA |
| B16-10 — Sin SQL, Supabase, clientes ni producción en F6-B16 | PASS |

**Próxima etapa segura recomendada:** F6-B17 exclusivamente offline para consolidar un checklist de decisión y revisar alternativas que no necesiten leer datos históricos. No solicitar aún permisos de staging ni lectura histórica mientras persistan bloqueos críticos.
