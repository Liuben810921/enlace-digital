# Propuestas offline para cinco bloqueantes PostgreSQL — 2026-11-15

Base: `0bf950708691cc9749e40ca47503bb282ab1f84f`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Archivos publicados

- `experiments/havana-osrm-portable/pg_security_remediation_proposal.sql`: **solo comentarios**, no es migración ni SQL ejecutable.
- `experiments/havana-osrm-portable/test_pg_security_remediation_proposal.py`: 24 verificaciones estáticas adversariales.

| Archivo | Git blob publicado y local | SHA-256 local |
|---|---|---|
| pg_security_remediation_proposal.sql | `ff45d0045b742fc240ca06793934ed8c6cf37beb` | `7ad837e3a2a20fc1cde4068d1da9f8900482e7ea911b63e154f504fa6ab88201` |
| test_pg_security_remediation_proposal.py | `6c9c1cb3cb0db386d0bbe1d4ca1d97293ee2d7e6` | `2219359195d2526a78cda9c9e137dccdfd17ce8988d617ed155f54e2174c01ea` |

Se cotejaron los Git blobs recuperando ambos archivos después de publicarlos y calculando `git hash-object` en los archivos locales.

## Ejecución local

Directorio: `/mnt/data/ed_sql_proposal`.

```sh
python -m unittest -q test_pg_security_remediation_proposal
python -O -m unittest -q test_pg_security_remediation_proposal
git hash-object pg_security_remediation_proposal.sql test_pg_security_remediation_proposal.py
sha256sum pg_security_remediation_proposal.sql test_pg_security_remediation_proposal.py
```

Resultados observados: **24/24 OK** normal y **24/24 OK** optimizado. Ningún fallo reproducido. El intento inicial `git hash-object *` falló al incluir el directorio `__pycache__`; se corrigió el comando limitándolo a los dos archivos, sin modificar código.

## Cinco propuestas y controles de aceptación

1. **Identidad RLS:** derivar el tenant de una sesión autenticada y enlazada por un servidor confiable. Rechazar `SET ed.tenant_id` y valores enviados por cliente como fuente de autoridad. Exigir `FORCE ROW LEVEL SECURITY` y políticas `USING` / `WITH CHECK`.
2. **Roles:** propietario técnico `NOLOGIN NOBYPASSRLS`, rol de aplicación `NOBYPASSRLS`, sin DML a `PUBLIC`; únicamente `EXECUTE` sobre RPC expresamente aprobadas.
3. **CAS:** cuatro versiones de cesta, dirección, rutas y almacenes; actualización condicional con `RETURNING`, una fila exacta y rollback si el vector cambió. Todos los escritores deben coordinarse con el commit de cotización.
4. **Idempotencia:** clave única por tenant y operación, hash canónico, bloqueo y comparación atómica, reuso del resultado con mismo payload, rechazo ante payload diferente, y conciliación de commit desconocido. Definir resultado rechazado sin FK obligatoria a una cotización inexistente.
5. **RPC:** propietario sin `BYPASSRLS`, `search_path` fijo, objetos calificados, sin SQL dinámico, permisos mínimos y rechazo cruzado tanto por SQL directo como RPC.

## Limitaciones

Las 24 pruebas confirman únicamente la presencia de controles textuales y la naturaleza no ejecutable de la propuesta. **No demuestran seguridad efectiva, validez SQL, RLS, CAS ni idempotencia bajo concurrencia**. Para verificarlo harían falta implementaciones y PostgreSQL desechable bajo autorización independiente.

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no se descargó cartografía, generaron costos, modificaron tienda o workflows, ni accedió a Supabase, staging, producción o datos reales.
