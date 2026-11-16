# Revisión adversarial de calidad de las 212 pruebas — 2026-11-16

Base `23bace6fc454d473ca0d0fce63ff8035cda46657`, rama `plan/havana-osrm-benchmark-offline-20261114`.

## Hallazgos verificados

1. **Aserciones tautológicas:** `trust_boundary` devuelve `DENY_EXTERNAL_TRUST_UNAVAILABLE` de forma incondicional. Los casos 01–18 del módulo `test_pg_attestation_trust_boundary.py` no demuestran que la función valide realmente sustitución, replay, firmas, tiempo ni procedencia de revocaciones; solo demuestran ausencia de `ALLOW` en la función actual. Deben tratarse como pruebas de *fail-closed*, no de autenticidad criptográfica.
2. **Defecto reproducido de propagación de ALLOW:** `hardened_check` delega en `check` y retorna el resultado de la dependencia. Con `unittest.mock.patch('test_pg_attestation_v1_hardened.check', return_value='ALLOW')`, la envoltura devuelve `ALLOW` (prueba nueva 19). Por tanto, **DENY no está garantizado si se reemplaza o falla de modo inseguro la dependencia interna**. No hay evidencia de que esto haya sucedido en una ejecución real.
3. La prueba de mutación 20 sustituye `check` por `DENY_NO_EXTERNAL_TRUST` y demuestra que un `CONTENT_MISMATCH` específico puede quedar oculto. Esto evidencia que el código no conserva por sí mismo la discriminación de errores ante una dependencia manipulada.
4. Los controles originales de separación de roles, revocación y caducidad tienen aserciones específicas útiles, pero el contrato de confianza externa carece de verificadores independientes, firmas y reloj autenticado.

## Ampliación local y resultados

Se creó **solo localmente** `/mnt/data/ed_acceptance/test_pg_attestation_quality_oracles.py` con 20 pruebas: identificadores, Unicode, revocación, fechas, límites, cambios de manifiesto, tipos no hashables, separación de roles, firmas sintéticas, suplantación de verificador y dos mutaciones deliberadas.

- 20/20 OK normal; 20/20 OK con `-O`.
- Batería total de 13 módulos: **232/232 OK normal** y **232/232 OK con `-O`**.
- Git blob **local**: `453785d5a64ec7279ab1327f3c45cd544431a8e6`.
- SHA-256 **local**: `0a356ac1c3deca228d3fa9b289d8c23d5b26b9978bb942815aa723347433d0db`.

La nueva batería **no está publicada como archivo Python en GitHub**; por tanto, no se ha cotejado un blob remoto. Este informe sí se publica. La ejecución de pruebas fue exclusivamente local; no se ejecutaron GitHub Actions.

## Corrección pendiente y criterio de cierre

Antes de declarar resuelto el hallazgo, modificar **únicamente** la envoltura offline `hardened_check` para convertir cualquier resultado inesperado (incluido `ALLOW`) en `DENY_NO_EXTERNAL_TRUST` o un código de error de denegación, sin alterar las respuestas específicas legítimas. Cambiar la prueba de mutación 19 para **exigir** denegación ante una dependencia simulada que devuelve `ALLOW`. Publicar código y pruebas, recuperar bytes, cotejar Git blob y SHA-256, y repetir normal y `-O`.

No se modificaron código de tienda, workflows, Supabase, staging ni producción. No se ejecutaron PostgreSQL, Actions u OSRM; no hubo descargas cartográficas, costos ni acceso a datos reales.
