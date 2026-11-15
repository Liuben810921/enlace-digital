# Dictamen final de revisión TOCTOU — 2026-11-15

Base: `4b3e3ac3117ef2527e57eca759db8c20b0192ff1`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Código de endurecimiento: `86401ccbc2d3563cfc13b2796ec89f02975aeb27`.

## Hallazgos comprobados
La revisión del archivo exacto de 25 pruebas identificó que los dos casos de escritura concurrente aceptaban cualquier excepción de las clases `OSError`, `ValueError`, `TypeError` o `UnicodeError`, siempre que se ejecutara el hook. Una excepción no relacionada podía producir un falso PASS. Se corrigió **solo** esta insuficiencia comprobada: ambos casos exigen ahora `ValueError` cuyo mensaje comience con `changed_during_read:`, además de confirmar que el hook se ejecutó. No se modificó el verificador.

Las pruebas de limpieza de descriptores comparan el recuento de `/proc/self/fd` antes y después de 80 aperturas fallidas, **solo cuando existe** esa interfaz Linux. La prueba no demuestra ausencia de fugas en todas las rutas de éxito, ni en plataformas sin `/proc`. La sustitución de raíz confirma retención del descriptor original en la intercalación ensayada; no prueba todas las intercalaciones.

## Pruebas ejecutadas
La copia local de la batería corregida tiene 10854 bytes, Git blob SHA-1 `68d2da71bf2af5feaaeaf9a9201b23155c1ddf16`, coincidente con el blob GitHub del commit de endurecimiento, y SHA-256 `b3e31dbab3ef05283914bf92da94cb620afc7d76444e92a1d5ca69a6a3eef7b0`.

| Comando (BUNDLE = /mnt/data/ed_verified_bundle) | stdout | stderr | Exit |
|---|---|---|---:|
| `python tests/verify-havana-offline-source-bundle.py BUNDLE` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| `python -O tests/verify-havana-offline-source-bundle.py BUNDLE` | `PASS offline source bundle: 3 pinned files; no network or execution` | vacío | 0 |
| `python tests/test-havana-offline-source-bundle.py BUNDLE` | `PASS offline bundle adversarial: 25` | vacío | 0 |
| `python -O tests/test-havana-offline-source-bundle.py BUNDLE` | `PASS offline bundle adversarial: 25` | vacío | 0 |

### Prueba negativa de sensibilidad
Se preparó **solo en un directorio temporal local** una variante del verificador que sustituyó `fail("changed_during_read:" + relative)` por `fail("unexpected_rejection:" + relative)`. La batería endurecida rechazó la variante en ambos modos, código de salida 1 y mensaje final `RuntimeError: FAILED: in-place write rejected for correct reason`. Esto demuestra sensibilidad a la **causa del rechazo** en el escenario de escritura sobre inode, sin modificar el verificador publicado. No se ha demostrado por mutación independiente cada uno de los 25 escenarios.

### Límites de las pruebas de mutación exploratorias
Se ensayaron además, en copias temporales, variantes que retiraban comprobaciones concretas de raíz, escritura y descriptores. La retirada de comprobaciones **no es equivalente a introducir una vulnerabilidad real en el verificador**; por tanto, no se presentan sus códigos de salida como una medida de eficacia o falsos positivos. Los ensayos son exploratorios, no una puntuación de mutation testing.

## Dictamen
**PASS acotado** para la integridad del paquete y los 25 escenarios offline ejecutados. **NO-GO operativo** para cartografía, despliegue y servicios. Riesgos residuales: carreras no representadas, modificaciones del inode posteriores a la validación, falta de pruebas portables de limpieza de FD, y falta de verificación integral de las 25 pruebas mediante mutaciones adversariales independientes.

No se activaron GitHub Actions, no se descargó cartografía y no se accedió a Supabase, staging ni producción.
