# Plan reproducible de regresión predespliegue — staging — 2026-11-09

**Estado: PLAN, NO AUTORIZACIÓN DE EJECUCIÓN.** Proyecto exclusivamente staging `xqahthghvozeigbojhyi`; rama `audit/registro-staging-aislado-20261109`. No usar datos reales, producción, correo ni pedidos. No desplegar Edge ni ejecutar cambios SQL hasta una autorización separada.

## Inventario de consumidores conocidos y limitaciones

| Consumidor | Dependencia | Operaciones necesarias | Evidencia |
|---|---|---|---|
| Edge `supabase/functions/enlace-cliente-auth-staging/index.ts` | RPC privados y `clientes_destinatarios`, `clientes_direcciones_entrega` | RPC, SELECT/INSERT/UPDATE | Lectura del controlador |
| Adaptador `scripts/staging_customer_web_adapter.mjs` | Transporte HTTP hacia Edge staging | Ninguna operación SQL directa | Lectura del adaptador |
| RPC `ed_cliente_*_privad*` | Credenciales, sesiones, cliente oficial | Funciones privilegiadas | Catálogo staging y SQL v4 |
| Pruebas offline `tests/edge_auth_mock_test.ts` | Mock de Edge/Supabase | No usa red ni DB | Archivo y workflow |
| Otros consumidores con clave `service_role` | **No inventariados** | **Desconocidas** | Requiere confirmación administrativa |

Catálogos staging examinados previamente: `service_role` tiene grants directos SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN sobre las dos tablas; tiene `BYPASSRLS`. No se hallaron funciones de `public`/`enlace_auth` que nombren esas tablas ni triggers personalizados en las tablas revisadas. La búsqueda no descarta integraciones externas, tareas programadas ni SQL dinámico.

## Fase A: comprobaciones offline permitidas ahora

1. Comprobar rama y commit; revisar que `ED_STAGING_CUSTOMER_AUTH_ENABLED` siga diseñado como fail-closed y que no se hayan activado pedidos/correos.
2. Ejecutar/consultar CI `staging-auth-static-check`: `deno check supabase/functions/enlace-cliente-auth-staging/index.ts`; `deno test --no-check --allow-read --allow-write tests/edge_auth_mock_test.ts`; `node --test tests/staging_customer_web_adapter_test.mjs`; `python3 scripts/check_staging_isolation.py`; parser PostgreSQL de propuestas. Todo offline, sin conexión a staging.
3. Comprobar en código que no existe `.delete()`, `TRUNCATE` ni rutas de borrado sobre las dos tablas, y que todas las mutaciones de destinatarios/direcciones filtran por cliente autenticado.
4. Verificar que la propuesta `sql/propuestas/staging_minimo_privilegio_destinatarios_no_ejecutar.sql` es **solo comentarios**, sin sentencias ejecutables; ninguna fase A puede modificar ACL.
5. Registrar número de ejecución, SHA, conclusión y archivos incluidos; una ejecución exitosa offline no prueba integración real.

## Fase B: preflight read-only sobre staging (requiere aprobación de la consulta cuando corresponda)

- Identidad de proyecto y roles; comparar `aclexplode(relacl)`, `has_table_privilege`, `pg_auth_members`, `pg_policies`, `rolbypassrls` y `pg_get_functiondef` con evidencia anterior.
- Comprobar funciones, columnas, FK, secuencias, RLS, `ed_cliente_cuba_direccion_ck` y recuento agregado de filas incompatibles, sin leer datos personales.
- Confirmar por responsables de integraciones si existen consumidores externos que necesiten DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN. Sin inventario confirmado, **NO-GO** para revocación.
- Confirmar variables de configuración mediante vía autorizada sin mostrar valores sensibles; el interruptor debe permanecer desactivado.

## Fase C: regresión controlada FUTURA (NO EJECUTAR)

Requiere aprobación independiente para operaciones de escritura, preparación de datos ficticios y, si aplica, un despliegue de staging separado. Mantener servicios y pedidos reales desactivados hasta aprobación explícita. No ejecutar pruebas contra producción.

| ID | Caso | Aceptación | Suspensión |
|---|---|---|---|
| P01 | Permisos mínimos tras REVOKE autorizado | `service_role` mantiene SELECT/INSERT/UPDATE y secuencias; DELETE/TRUNCATE/REFERENCES/TRIGGER/MAINTAIN denegados; `anon`/`authenticated` sin acceso directo | Cualquier grant imprevisto |
| R01 | Registro Cuba | Nombre+apellido, teléfono y dirección habitual requeridos; se crea una sola ficha | Cuenta sin dirección o duplicado |
| R02 | Registro extranjero | Cuenta sin dirección cubana obligatoria, sin destinatario inicial | Dirección exigida indebidamente |
| R03 | Validación y duplicados | Rechazo sin escrituras parciales | Filas huérfanas o aceptación incorrecta |
| S01 | Login | Contraseña correcta abre sesión; fallos y bloqueo limitan intentos | Acceso con contraseña incorrecta |
| S02 | Caducidad/revocación/replay | Token caducado o revocado no accede; cierre invalida sesión | Acceso posterior a revocación |
| S03 | Rate limiting | Exceso o error del limitador bloquea antes de RPC privada | Fallo abierto |
| D01 | Destinatarios por cliente | Alta, consulta y edición solo bajo cliente propietario | Acceso cruzado |
| D02 | Direcciones de entrega | Reutilización y creación aisladas por propietario | Reutilización entre clientes |
| D03 | Datos históricos | Modificar destinatario no reescribe snapshot histórico de pedido | Alteración del histórico |
| X01 | Ausencia de DELETE | Rutas normales siguen funcionando con permisos mínimos | Error 42501 en operación esperada |
| X02 | Regresión de UI | Sesión persistente, dirección en Mi cuenta y formularios correctos | Pérdida de estado o datos |
| X03 | Pedidos/correo | Sin envíos, sin pedidos reales, sin tráfico externo no aprobado | Cualquier efecto real |

**Criterio GO**: todas las pruebas aplicables pasan, consumidores externos inventariados, rollback practicable, logs sin secretos, cero impacto en producción y autorización específica. **NO-GO** ante fallo, datos inesperados, dependencia no inventariada, configuración no confirmada o costes no aprobados.

## Reversión y contención

- Guardar ACL exacta previa, SHA y resultados antes de una futura intervención.
- Si se autoriza revocar grants, suspender al primer fallo, conservar evidencia, y restaurar **únicamente los grants originalmente presentes** según la propuesta comentada, con autorización independiente para la reversión.
- No usar `TRUNCATE` para limpiar pruebas. Datos ficticios deben aislarse y cualquier eliminación posterior requiere autorización y plan de conservación.
- `ON DELETE CASCADE` desde `clientes_oficiales` es una ruta distinta; la revocación en tablas hijas no la deshabilita.
- `CHECK ... NOT VALID` se aplica a nuevas filas/modificaciones; una validación retrospectiva requiere autorización aparte.
- Desactivar función/interruptor y revertir despliegue, si existiera en el futuro, solo mediante procedimiento aprobado; no desplegar en esta etapa.

## Evidencia CI
`staging-auth-static-check` ejecución `42724480534` para commit `dae6a1457239f8a7c8e0acf6ca9d0707a4447473`: `completed/success`. Es una prueba offline, no una validación de staging real.

Referencia: https://supabase.com/docs/guides/database/postgres/row-level-security .
