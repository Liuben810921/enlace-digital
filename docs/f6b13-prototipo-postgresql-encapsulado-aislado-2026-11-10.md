# F6-B13 — Prototipo aislado de función encapsulada y seguridad PostgreSQL

Fecha: 2026-11-10. Base `f8e62f03b1c383134e4ce972d91d4cc6589632e4`; Actions #538 `42901662123` **SUCCESS**. Artefacto de prueba: `sql/pruebas/f6b13_encapsulated_synthetic_isolated.sql`. **SOLO PostgreSQL desechable en GitHub Actions; nunca Supabase.** Ningún dato real, rol, función, grant o política de staging se toca.

## Qué se comprueba
La batería crea dentro de una transacción con `ROLLBACK` una tabla de cuatro direcciones **inventadas**, tres roles NOLOGIN y una función `SECURITY DEFINER` de propiedad restringida. El operador `f6b13_caller` solo tiene EXECUTE, no SELECT sobre la tabla; `f6b13_unauthorized` carece de EXECUTE. El owner `f6b13_owner` carece de BYPASSRLS y privilegios amplios y recibe SELECT únicamente en cinco columnas; RLS está habilitado con política exclusiva para el owner. Se fija `search_path = pg_catalog, pg_temp` y se cualifican tablas y funciones.

La función detecta internamente colisiones de la identidad ficticia `(cliente_numero, provincia, municipio, barrio, direccion)`, con un normalizador **de demostración** que aplica NFC, traduce exactamente los 25 Unicode White_Space, compacta espacios y compara `convert_to(...,'UTF8')` por bytes. La función devuelve **siempre `SUPPRESSED`**, independientemente de la existencia de duplicados. El test verifica que hay un duplicado ficticio y que clientes diferentes no se mezclan.

## Límites importantes
- El normalizador `norm_v1_toy` **NO ES NORM-v1 completo**: faltan validación integral de controles C0/C1, U+200B, U+FEFF, Unicode inválido, longitudes, NULL y todos los vectores de frontera. **NO-GO para uso real**.
- El prototipo verifica permisos y denegación básica, pero **no demuestra ausencia de filtraciones** por tiempos, planificación, errores, logs, extensión, herencia de roles, shadowing de operadores ni ataques de ejecución repetida. Tampoco demuestra seguridad de `SECURITY DEFINER` en Supabase.
- `SUPPRESSED` es una política conservadora de salida, no prueba de privacidad. El umbral k sigue sin definirse. Una función que siempre suprime no justifica por sí sola leer datos históricos.
- La función de ejemplo captura errores y suprime detalles en respuesta, pero el registro de servidor y telemetría requieren evaluación independiente.
- La prueba utiliza PostgreSQL 17 en contenedor aislado, sin secretos de staging ni producción, sin despliegue ni costo de infraestructura persistente. GitHub Actions está sujeto a cuotas del plan.
- La transacción `ROLLBACK` revierte roles, tablas, políticas y funciones creadas en el test; el contenedor también se destruye. No hay migración ni cambio de esquema en Supabase.

## Gates
| Gate | Criterio | Evidencia |
|---|---|---|
| B13-01 | #538 verificado | SUCCESS |
| B13-02 | Solo PostgreSQL 17 aislado | Workflow dedicado |
| B13-03 | Fixtures inventados y rollback | Script SQL |
| B13-04 | SECURITY DEFINER y owner sin BYPASSRLS | Aserciones SQL |
| B13-05 | search_path fijo y nombres cualificados | SQL y revisión |
| B13-06 | EXECUTE exclusivo y SELECT directo denegado | Aserciones SQL |
| B13-07 | RLS y permisos de columnas | Aserciones SQL |
| B13-08 | Salida SUPPRESSED | Aserciones SQL |
| B13-09 | Errores/tiempos/logs y NORM-v1 completo | **NO-GO, no demostrados** |
| B13-10 | Staging, producción y clientes intactos | Sin conexión ni acceso |

## Autorizaciones y reversión
**Autorización A** posterior y explícita para modificar roles, grants, políticas o funciones en staging; **autorización B** independiente para cualquier lectura histórica, incluso agregada. Ninguna concedida por F6-B13. La reversión del prototipo en GitHub es `git revert`; el SQL de prueba se revierte con `ROLLBACK`. Cualquier futura función en staging requerirá un plan distinto de rollback y evaluación de exposición irreversible.

**Decisión:** este prototipo no debe desplegarse ni copiarse como migración; sus pruebas son un requisito parcial, no una aprobación de auditoría histórica.
