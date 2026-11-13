# Auditoría de motivos de actualización de tarifa con espacios de control — 13 noviembre 2026

## Hallazgo y riesgo
La función sintética `ed_rpc_lab.update_rate` exigía un motivo de 3 a 160 caracteres tras `trim(p_reason)`. En PostgreSQL, el recorte predeterminado elimina espacios ordinarios, pero no tabulaciones ni saltos de línea. Por tanto, motivos compuestos exclusivamente por caracteres de control podían satisfacer la longitud mínima y generar una entrada de auditoría sin explicación sustantiva.

## Regresión reproducible
En `tests/postgres-delivery-rpc-rls-lab.py` se añadieron casos con tabulaciones, saltos de línea y combinaciones de espacios/tabulaciones. Cada uno debe generar `InvalidParameterValue` (`22023`). Se comprueba además que ni la versión/tarifa ni el número de eventos de auditoría cambien.

## Corrección mínima
En `tests/postgres-delivery-rpc-rls-lab.sql` se sustituyó el recorte predeterminado por `btrim(p_reason, ' ' || chr(9) || chr(10) || chr(11) || chr(12) || chr(13))`, manteniendo los límites 3–160 y el resto de validaciones.

## Evidencias y estado
- Base autorizada: `053f5b6bcd36d4f85caf4fdbacd2f64ab93683c9`, rama idéntica antes de los cambios.
- Prueba: `10cb212d4c9a4573adbea9904b65da6844252d9e`.
- Corrección: `a05d2e9e3528f5d15075cd9cead06b729c5de650`.
- CI: **pendiente de confirmación de éxito sobre el commit que incluye corrección y regresión**.

**Estado:** abierto hasta que GitHub Actions valide el conjunto. Alcance restringido a GitHub y laboratorio PostgreSQL desechable; sin acceso ni modificaciones de Supabase, staging, producción, clientes reales o pedidos.

## Incidencia de CI y corrección de fixture

[GitHub Actions #43515287691](https://github.com/Liuben810921/enlace-digital/actions/runs/43515287691) terminó `completed/failure` en el commit `a05d2e9`. Los logs identificaron `AssertionError` en la línea 153 de `tests/postgres-delivery-rpc-rls-lab.py`: la prueba enviaba secuencias literales escapadas (barra invertida más letra), en vez de caracteres de control. El fallo no demuestra un defecto de la corrección SQL; demuestra un defecto en el fixture de regresión.

Se corrigió únicamente la representación de los casos de prueba para que Python envíe tabulaciones y saltos de línea reales mediante escapes de cadena normales. Commit: `01d7ab63bd6ccd29bbc468ef4f4b3fb17ce8a72f`.

**Estado:** pendiente de nueva ejecución CI con el fixture corregido; no cerrar hasta `completed/success`.

## Cierre definitivo — CI aprobada

Se verificó la ejecución [GitHub Actions #43515759697](https://github.com/Liuben810921/enlace-digital/actions/runs/43515759697): estado `completed`, conclusión `success`. El trabajo `test` (ID `132197183737`) también terminó `completed/success`.

Commit probado: `01d7ab63bd6ccd29bbc468ef4f4b3fb17ce8a72f`. Este commit incluye la validación SQL de motivos de tarifa compuestos únicamente por caracteres de control y la corrección del fixture de regresión. La incidencia de CI anterior (#43515287691) se atribuyó a secuencias escapadas incorrectamente en el fixture, no a la lógica SQL; la nueva batería ha pasado.

**Dictamen:** auditoría de motivos de tarifa con espacios de control **cerrada satisfactoriamente** para el laboratorio PostgreSQL desechable. Este cierre es exclusivamente documental y no constituye despliegue, fusión o validación de entornos reales. No se accedió ni modificó Supabase, staging, producción, clientes reales o pedidos.
