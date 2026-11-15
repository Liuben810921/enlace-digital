# Integridad del paquete offline: comprobaciones locales — 2026-11-14

Referencia de partida: `fcf3e30aaba3092cfaa1a0175a0391dd9d6b8728`.

## Fuentes consultadas
Los seis archivos se reabrieron mediante el conector GitHub al commit exacto. Para los tres archivos del paquete, los SHA de objeto Git son:
- `tests/havana-offline-cartography-manifest-isolated.cjs`: `c8503cb7a67c5d4517ef21ba34881a412fbddc6c`.
- `tests/havana-offline-cartography-manifest-isolated.test.cjs`: `af3bbcb60ff67237ed3691b45a30046cd52322e1`.
- `tests/fixtures/havana-offline-cartography-manifest.json`: `cf9f67c507d2619ee5979a39db0caef3e6ae7145`.

## Resultados ejecutados localmente
En `/mnt/data/ed_offline`:
- `git hash-object` del primer JavaScript local: `691562b039b9d5d066ec89be9f58673c2601a894` (**NO coincide**).
- `git hash-object` del segundo JavaScript local: `5459d56df3e9586e61e1be23861dfcd28274fb05` (**NO coincide**).
- `git hash-object` del JSON local: `cf9f67c507d2619ee5979a39db0caef3e6ae7145` (**coincide**).
- `python tests/verify-havana-offline-source-bundle.py .`: `exit 1`, falta el lockfile en ese directorio.
- `python -O tests/verify-havana-offline-source-bundle.py .`: `exit 1`, misma causa.
- Los dos códigos de salida constituyen **rechazo por paquete incompleto**, no éxito de las 18 pruebas.

SHA-256 de los archivos **locales no coincidentes**, exclusivamente para diagnóstico y **no para fijar en GitHub**:
- Primer JavaScript local: `68247c383488db75813de75b5c6acfd5d8cceba694ff183becaf344887f3fcdb`.
- Segundo JavaScript local: `b04c7aa6c986dea2659debbaf5e9049f0506195358aa4c4e52b3db6545808573`.
- JSON local (objeto Git coincidente): `092dfeac27878b4dc01d49222e21b352400c0327bce98745dd05139326546435`.

Se intentó recuperar el primer archivo fuente mediante URL pública de GitHub desde el contenedor, pero la resolución DNS no está disponible (`URLError: Temporary failure in name resolution`). No se descargó contenido. La lectura de texto del conector permite inspección, pero no constituye por sí sola una transferencia de bytes al contenedor local.

## Pendientes obligatorios
1. Materializar **los bytes exactos** de los dos JavaScript y del lockfile en el entorno local, verificar los SHA Git de cada archivo y calcular sus SHA-256.
2. Ejecutar el verificador y las 18 mutaciones en Python normal y `-O`, documentando stdout, stderr y exit codes. La prueba de carrera pre-open y las pruebas de symlink están definidas en GitHub, pero no ejecutadas aquí sobre el paquete exacto.
3. Añadir los SHA-256 independientes al manifiesto y al verificador **solo después** de confirmar identidad byte a byte.
4. Considerar la carrera de renombrado de directorios padres: `lstat` y apertura posterior por ruta no forman una operación atómica; requiere un enfoque por descriptores de directorio o directorio inmutable.

**NO-GO:** no se modifica el workflow ni se autoriza CI. Los bloqueos `on: {}`, `if: ${{ false }}`, `permissions: {}` y los flags comerciales permanecen. No se accedió a Supabase, staging o producción ni se descargó cartografía.
