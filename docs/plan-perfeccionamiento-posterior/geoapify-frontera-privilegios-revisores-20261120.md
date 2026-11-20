# ENLACE DIGITAL — frontera de privilegios de revisores (2026-11-20)

Base `f9d98681fe01394359a7431889737daf5d2c9fa7`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Defecto de contrato comprobable
Las funciones `record_reconciliation_evidence` y `reconcile_dispatch` son SECURITY INVOKER. Un revisor sin SELECT/UPDATE/INSERT sobre tablas internas no puede completar la ruta positiva. Darle esos permisos directos para hacer funcionar las RPC permitiría saltarse controles y alterar evidencias, congelación o estados. Se mantiene el bloqueo por defecto; no se conceden permisos peligrosos.

## Implementación
- `027_geoapify_reviewer_privilege_boundary.sql`: política de activación permanentemente deshabilitada (`enabled=false`) y función de inspección `inspect_reviewer_table_access`, que detecta INSERT/UPDATE/DELETE/TRUNCATE efectivos para roles en allowlist sobre seis tablas sensibles. Se revoca EXECUTE de PUBLIC. No crea logins, roles privilegiados ni GRANTs.
- `028_geoapify_reviewer_privilege_tests.sql`: aserciones rollback de política deshabilitada, ausencia de DML directo en allowlist, funciones SECURITY INVOKER, y matriz manual de doble revisión, discrepancias, revocación, concurrencia y ACK perdido.
- `run_concurrency.py` referencia 027 y 028 en orden, después de 026.

## Defecto corregido durante revisión
La prueba inicial buscaba la cadena `SECURITY INVOKER` en `pg_get_functiondef`; PostgreSQL puede omitir el modo predeterminado en su representación textual. Se sustituyó por consulta estructurada a `pg_proc.prosecdef=false`.

## Evidencia ejecutada
Archivos exactos reobtenidos de GitHub:
- 027 blob `31d4ae318050c85a7033bb2e30667966a330fb2a`: 5/5 comprobaciones textuales.
- 028 blob `07341f9f8e33019c74d0e312efb370b02064c076`: 5/5.
- Runner blob `caefdf19fa170470700bff9b42d2b3e85ecb90d8`: 3/3.
Total **13/13 comprobaciones estructurales**. No se ejecutó SQL, PostgreSQL, Node.js ni concurrencia real.

## Pendientes técnicos y limitaciones
1. La frontera positiva requiere una identidad ejecutora NOLOGIN, sin SUPERUSER ni BYPASSRLS, con privilegios mínimos y funciones SECURITY DEFINER cuidadosamente auditadas. No se implementó ni activó porque aún no se pueden verificar en un motor desechable los privilegios y el aislamiento.
2. La inspección de permisos evalúa roles inscritos en allowlist; como está vacía, el resultado esperado es cero. No prueba todavía seguridad de roles futuros, privilegios heredados o acceso por propiedad de tablas.
3. La política `enabled=false` es una salvaguarda declarativa, no un interruptor conectado a las RPC antiguas; las RPC siguen inaccesibles a revisores sin permisos de tabla. No afirmar bloqueo completo frente a propietarios o superusuarios.
4. Los casos positivos de dos revisores, conflicto, revocación, dos sesiones y ACK perdido están documentados pero no ejecutados.
5. No hay atomicidad entre PostgreSQL y HTTP externo ni verificación de autenticidad de evidencia del proveedor.

No se instaló PostgreSQL ni se utilizaron Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
