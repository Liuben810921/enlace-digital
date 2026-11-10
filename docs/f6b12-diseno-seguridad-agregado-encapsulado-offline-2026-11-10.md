# F6-B12 — Diseño de seguridad del mecanismo encapsulado NORM-v1 (OFFLINE / NO EJECUTABLE)

Fecha: 2026-11-10. Base `b05b6478c032fdc67fdb4ed651ee664904055492`. GitHub Actions #534 (`42901068549`): **SUCCESS**. Esta etapa solo crea documentación y comprobaciones estáticas en GitHub. **No SQL, no Supabase, no lectura histórica, no cambios de roles, grants, políticas, funciones, producción ni código operativo.**

## Objetivo y frontera de confianza

La auditoría futura examinaría exclusivamente `public.clientes_direcciones_entrega`, para detectar identidades repetidas por `(cliente_numero, provincia, municipio, barrio, direccion)` con NORM-v1: NFC, los 25 Unicode White_Space exactos, rechazo de controles prohibidos y comparación de bytes UTF-8, sin collation lingüística. No consultar `clientes_oficiales` ni `clientes_destinatarios`; no exportar direcciones, IDs, hashes, grupos, ejemplos ni conteos. Los registros reales y sus cardinalidades son desconocidos.

**Problema:** un rol con SELECT de cinco columnas puede leer direcciones completas; una función encapsulada puede reducir exposición directa, pero una función privilegiada también puede crear un nuevo canal de filtración. La salida `SUPPRESSED` por defecto **no** justifica leer datos sin propósito y aprobación.

## Alternativas de ejecución (ninguna autorizada)

| Opción | Beneficio | Riesgos | Dictamen |
|---|---|---|---|
| A. `SECURITY DEFINER` estrecha, propiedad de rol dedicado sin BYPASSRLS y privilegios solo necesarios | Operador sin SELECT directo; interfaz fija de resultado; control centralizado | Privilegios efectivos del owner; RLS/owner bypass; SQL injection, `search_path`, EXECUTE PUBLIC, errores/tiempos, invocaciones repetidas, cambios de función | **Candidata condicionada** a revisión independiente, aislamiento y autorización A |
| B. `SECURITY INVOKER` con rol de lectura de cinco columnas | Menos escalada en función | El llamador necesita SELECT y puede leer direcciones fuera de la función; RLS sin políticas bloquea lectura; no satisface encapsulación | **NO-GO** para confidencialidad del operador |
| C. Proceso administrativo controlado, read-only, sin función persistente | No añade superficie permanente ni permisos de ejecución | `postgres`/`supabase_read_only_user` omiten RLS y tienen lectura amplia; logs, errores y operador ven SQL; salida minimizada no elimina exposición | **NO-GO por defecto**; excepcional solo tras aprobación explícita de riesgos |
| D. Auditoría sintética en PostgreSQL desechable, sin datos históricos | Prueba algoritmo y política sin PII ni privilegios reales | No mide duplicados reales ni permisos staging | **APROBABLE SOLO OFFLINE** en fase futura autorizada |

**Decisión de diseño:** preferir primero D para pruebas; considerar A solo si puede demostrar confinamiento. Si no, mantener NO-GO. No instalar una función que devuelva siempre `SUPPRESSED` pero lea datos innecesariamente.

## SECURITY DEFINER: controles obligatorios antes de cualquier implementación
1. **Owner:** rol dedicado no superusuario, no propietario de tablas de clientes, sin `BYPASSRLS`, `pg_read_all_data`, `CREATEROLE`, `CREATEDB` ni membresías amplias. La función no puede ejecutarse con owner `postgres` o `service_role` por comodidad. Revisar grants efectivos y capacidad de asumir rol.
2. **RLS:** F6-B9 observó `relrowsecurity=true`, `relforcerowsecurity=false`, cero políticas; el rol dedicado sin BYPASSRLS no verá filas sin política apropiada. No crear `USING (true)` sin revisión. La política de SELECT para el owner funcional debe diseñarse con exactitud y auditar su impacto en otras rutas; RLS no anonimiza datos.
3. **search_path:** fijar ruta segura en la función, preferiblemente `SET search_path = pg_catalog, pg_temp` con todas las referencias a tablas, tipos y funciones de aplicación cualificadas por esquema; verificar resolución y posibilidad de shadowing, incluyendo `pg_temp` y operadores. No SQL dinámico ni nombres de objetos controlados por el usuario.
4. **EXECUTE:** revocar `EXECUTE` de `PUBLIC`, `anon`, `authenticated` y `service_role` salvo una necesidad independiente demostrada; autorizar solo rol técnico designado. Revisar default privileges, permisos por firma, membresías heredadas, posibilidad de invocación por PostgREST y canales RPC.
5. **Interfaz:** sin parámetros controlables por el solicitante (sin cliente, provincia, fecha, filtros, `LIMIT` ni cursor). Una única llamada autorizada; evitar `STABLE`/`IMMUTABLE` incorrectos, fugas por `LEAKPROOF`, retorno de tipos compuestos o `SETOF`. Salida por defecto exclusivamente `SUPPRESSED`; otros estados requieren aprobación independiente.
6. **Ejecución:** read-only lógico y transacción de solo lectura cuando sea viable; `statement_timeout <= 5s`, `lock_timeout <= 1s` como propuestas sujetas a carga, sin cambios globales, sin DDL/DML, sin escrituras indirectas, sin extensiones, sin acceso de red, sin logging de SQL con valores. El tiempo de respuesta puede filtrar cardinalidad: no garantizar tiempo constante; evaluar mitigación y, si no es demostrable, NO-GO.
7. **Errores y observabilidad:** manejar de forma uniforme fallos de NULL, Unicode inválido, longitud, permisos y timeout; no devolver detalles de filas, SQLSTATE identificable, mensajes variables, `DETAIL`, `HINT`, stacktrace, número de fallos o cardinalidad. No prometer que un wrapper suprime logs de servidor; revisar auditoría, historial y telemetría por separado.
8. **Repetición:** impedir ataques por diferencia entre ejecuciones; una única ejecución autorizada, sin filtros y sin reintentos, con control administrativo fuera de la función. Un contador interno o token persistente requeriría escritura y otra autorización: **no implementarlo** en este diseño.
9. **NORM-v1:** normalización NFC, 25 White_Space, rechazo de C0/C1 fuera de whitespace, U+200B, U+FEFF, NULL/vacíos, límites de caracteres y comparación de bytes UTF-8; no usar collation ICU para igualdad. Un error de datos => NO-GO y salida suprimida, sin excluir silenciosamente filas.
10. **Revisión:** inspección independiente de código y privilegios, pruebas sintéticas negativas, costo estimado, plan de rollback, autorización de cambios A y autorización de lectura histórica B **por separado**.

## Modelo de privacidad y límites
- `SUPPRESSED` es el estado predeterminado. Prohibidos `COUNT(*)`, número de grupos, hashes, IDs, direcciones, booleanos y estados `NO_SIGNAL`/`REVIEW_REQUIRED` sin política independiente de divulgación. Umbral `k` **sin definir**; no suponer que k-anonimato elimina inferencia.
- Mitigar ataques por pertenencia, tiempo, error, consulta repetida, conocimiento auxiliar, cambios de cardinalidad, y lectura directa por el owner o administrador. Si cualquier canal sigue abierto: **NO-GO**.
- Costos: diseño offline sin costo incremental ni nuevos servicios. Eventual función PostgreSQL en staging debe revisarse frente a límites reales del plan gratuito, CPU, memoria, cuotas y timeouts; no afirmar costo cero garantizado en producción ni ejecutar benchmark real ahora.

## Plan de pruebas sintéticas (no ejecutadas en F6-B12)
- S12-01: comparar A/B/C/D con un fixture PostgreSQL aislado sin datos reales.
- S12-02: owner de función sin BYPASSRLS, sin lectura global ni privilegios heredados.
- S12-03: `search_path` y shadowing por objetos en `public`/`pg_temp` no desvían resolución.
- S12-04: `EXECUTE` denegado a `PUBLIC`, `anon`, `authenticated`, `service_role`.
- S12-05: sin SELECT directo para operador; RLS niega por defecto en ausencia de política.
- S12-06: NORM-v1 bytes UTF-8 exactos, Unicode inválido, NULL, longitud y colisiones ficticias.
- S12-07: errores, tiempos y logging no revelan valores, conteos ni pertenencia en pruebas.
- S12-08: salida solo `SUPPRESSED` mientras no se apruebe divulgación.
- S12-09: no hay filtros, particiones, reintentos ni múltiples ejecuciones.
- S12-10: rollback restaura grants, policies, ownership y función sin afectar objetos preexistentes.

## Reversión y autorización
**F6-B12:** `git revert` de informe, validador y workflow; ninguna modificación Supabase. **Futura implementación A:** guardar DDL y grants previos; revocar EXECUTE, eliminar únicamente función/rol/política nuevos tras comprobar dependencias y restaurar estado anterior; verificar que no se ampliaron permisos de roles públicos. La lectura histórica **no se puede deshacer** ni borrar de la memoria de operadores o logs: autorización B independiente.

### Gates
| Gate | Condición | Estado |
|---|---|---|
| B12-01 | GitHub Actions #534 base | PASS |
| B12-02 | Alternativas y riesgos documentados | PASS DOCUMENTAL |
| B12-03 | Owner y RLS de futura función auditados en staging | PENDIENTE |
| B12-04 | search_path y EXECUTE seguros probados | PENDIENTE |
| B12-05 | Canales de errores, tiempos y logs mitigados | NO-GO |
| B12-06 | Política de divulgación / k aprobada | NO-GO |
| B12-07 | Pruebas sintéticas completas | NO EJECUTADAS |
| B12-08 | Autorización A para modificar staging | **NO AUTORIZADA** |
| B12-09 | Autorización B para leer datos históricos | **NO AUTORIZADA** |
| B12-10 | Sin SQL, Supabase, producción ni pedidos reales en F6-B12 | PASS |

**Próximo paso seguro:** preparar una batería de pruebas sintéticas aisladas y revisión estática de una propuesta de función, sin desplegarla ni consultar Supabase. La implementación y la lectura histórica exigen permisos independientes y posteriores.
