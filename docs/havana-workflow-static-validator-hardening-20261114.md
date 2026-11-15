# Endurecimiento reproducible del validador cartográfico — 2026-11-14

## Alcance
Se trabajó exclusivamente sobre `tests/audit-havana-manifest-workflows-offline.py` en la rama aislada. Los workflows `.github/workflows/havana-manifest-offline-{candidate,preparation}.yml` permanecen sin cambios, con `on: {}` y `if: ${{ false }}`.

## Fallos y correcciones
1. El loader PyYAML alteraba listas de resolutores compartidas con `yaml.SafeLoader`. Ahora realiza una copia independiente antes de modificar la interpretación YAML 1.1 de `on`.
2. YAML con alias, anchors, tags, referencias cíclicas o claves no hashables podía provocar errores o semántica ambigua. Ahora se rechazan tokens Anchor/Alias/Tag, claves duplicadas y tipos de clave no textuales; se capturan excepciones relevantes sin permitir el archivo.
3. Se agregó límite de 32 KiB por workflow para evitar entradas desproporcionadas.
4. Antes se permitía cualquier valor de `name` pese a estar en la lista de claves autorizadas. Ahora se exige el nombre literal exacto de cada workflow, bloqueando expresiones dinámicas.
5. Las pruebas adversariales se ampliaron con cambios de nombre, redirecciones Git, bypass del namespace, dependencias y cargas YAML malformadas. Se corrigieron cadenas de casos adversariales para usar escapes de nueva línea YAML reales.
6. Se conservan los hashes SHA-256 de los dos cuerpos de comandos, verificados con los YAML consultados de GitHub:
   - Bootstrap: `043cb738b79aa6a9a75437e316f9ca77b1084241b4e17519d86c7c3d69d91dc8`
   - Namespace: `f1e1808e44f82205346c804bc63e232ff304aef09282dc178a367e44e1f29240`

## Pruebas ejecutadas localmente sin red
Se reconstruyeron los dos YAML a partir del contenido leído mediante la conexión GitHub y se recalcularon ambos SHA-256 mediante Python 3 y PyYAML 6.0.3 preinstalado: **coincidencia exacta de ambos hashes**. Un comprobador local equivalente validó ambos YAML base y rechazó **25 mutaciones adversariales de YAML, comandos, triggers, permisos, servicios y red**.

**Límite de evidencia:** las 25 mutaciones corresponden al comprobador local equivalente, no a una ejecución del archivo Python exacto del último commit remoto. La matriz ampliada del repositorio se ha revisado estáticamente, pero todavía debe ejecutarse byte a byte contra los YAML del repositorio para certificar reproducibilidad completa. No se afirma que GitHub Actions haya validado o ejecutado los workflows.

## Riesgos y decisión
- `git fetch` necesita red antes de `unshare`; el egress exclusivo a GitHub no está demostrado.
- La disponibilidad de namespaces sin privilegios en el runner GitHub-hosted tampoco está demostrada.
- La facturación y la gratuidad futura no se han certificado; la ejecución continúa bloqueada.
- No se han instalado dependencias, descargado datos, activado GitHub Actions, accedido a Supabase, staging o producción ni ejecutado OSRM.

**Decisión:** conservar `on: {}`, `if: false`, flags comerciales desactivados y SHA obsoleto de bloqueo; no solicitar ejecución todavía.
