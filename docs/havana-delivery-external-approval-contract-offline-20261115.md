# Contrato de aprobación externa — propuesta offline, NO AUTORIZADO

**Estado:** `DENY_BY_DEFAULT`. Este documento no constituye aprobación, firma, autorización para despliegue ni acceso a sistemas reales.

## Entradas obligatorias del control

El candidato debe identificarse mediante commit Git completo, Git blobs de matriz y manifiesto y SHA-256 de los bytes exactos. La evidencia externa debe identificar inequívocamente la solicitud de cambio, el revisor autorizado, la decisión explícita, la fecha, el digest del registro y el mecanismo verificable de procedencia. Las referencias de confianza deben obtenerse **fuera de la rama candidata** y de un canal protegido cuya administración no dependa del autor del cambio.

## Regla fail-closed

Si falta el registro externo, no puede verificarse su procedencia, el revisor carece de autoridad, falta una referencia, existe discrepancia de hashes o no se dispone de ancla independiente: **RECHAZAR**. Un registro que solo declara `APPROVED` dentro del mismo repositorio editable no es evidencia suficiente. Nunca recalcular las anclas desde los archivos candidatos para autorizar un cambio.

## Procedimiento propuesto, aún no ejecutado

1. Autor propone commit y diffs de los 28 casos, canonicalización y validadores.
2. Revisor autorizado e independiente verifica el contenido y registra su decisión en un sistema protegido ajeno a la rama candidata.
3. El responsable del canal protegido publica la referencia verificable, asociada a hashes y commit exactos.
4. El verificador obtiene y valida la evidencia por canal independiente; coteja todos los bytes; deniega cualquier discrepancia.
5. Cualquier cambio posterior, incluido formato o Unicode, exige nueva revisión.

**No se eligió ni configuró proveedor externo, no se asignaron revisores y no se creó aprobación real.** Las pruebas con registros sintéticos no acreditan identidades.

## Evidencia técnica local reproducida

Se recuperó desde GitHub la versión publicada `test_pg_security_strict_adversarial_published.py`, se reconstruyó localmente byte por byte y se verificó:

- Git blob local y GitHub: `95f5d2e894099da3c436696ac19b99be7ebba2d0`.
- SHA-256 local de esos mismos bytes: `c26b03e1bb5340e0221a1f2cb0bfb9b658d8f7bb231b73f2dd7564a1f12a772e`.
- `python -m unittest -q test_pg_security_strict_adversarial_published`: **12/12 OK**.
- `python -O -m unittest -q test_pg_security_strict_adversarial_published`: **12/12 OK**.

Se preparó además el prototipo **local no publicado** `test_pg_external_approval_contract.py` con 10 pruebas: denegación sin registro, registro vacío, ausencia de verificación externa, procedencia ausente, decisión rechazada, ancla no verificada, contenido cambiado, digest inválido, campo extra y caso sintético positivo (no autorización real). Ejecutadas conjuntamente con las 12 anteriores: **22/22 OK** en Python normal y **22/22 OK** en `-O`.

Prototipo local: Git blob `efa5c91e512f893eeb0f94baa354932d36dc3271`; SHA-256 `c16afeb585b01413647ebe10c45c542a1f9122051d25f364e54b8fdb3b377a47`. **No se declara cotejo GitHub de este prototipo**, ni que el parámetro sintético `verified_external_record=True` sea una verificación real: solo simula el límite de confianza.

## Límites

No se ejecutaron PostgreSQL, GitHub Actions ni OSRM; no se descargó cartografía, no se generaron costos, no se modificó tienda ni workflows, y no se accedió a Supabase, staging, producción ni datos reales.
