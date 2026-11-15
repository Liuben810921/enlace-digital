# Auditoría offline de paquete — avance y bloqueantes verificables — 2026-11-14

Referencia: `1aa2538c43b23232fe983900042e20a104b0deaf`.

Se inspeccionaron por el conector GitHub el verificador, la batería de 13 pruebas, el lockfile y los tres archivos de origen. **Hallazgo comprobado:** el verificador remoto contenía `b"\\\\0"` en la construcción del preimagen Git blob, que corresponde a una barra invertida seguida del carácter cero, en lugar del separador NUL exigido por Git. Se corrigió usando `bytes([0])`.

Se añadieron protecciones estáticas frente a symlinks en el archivo final y sus directorios padres, `O_NOFOLLOW` en la apertura, y cotejo de dispositivo, inode, tamaño, `mtime_ns` y `ctime_ns` antes/después de leer. Estas comprobaciones reducen ventanas TOCTOU pero **no** proporcionan una instantánea atómica ante un atacante que modifique concurrentemente el árbol. Se añadieron cuatro pruebas negativas de symlinks (tres archivos y un directorio padre) a la batería existente de 13 casos.

## Estado de la evidencia
- Los tres archivos originales de GitHub fueron inspeccionados, pero las copias locales disponibles de ambos scripts `.cjs` **no coincidían** con sus hashes Git remotos. El JSON sí coincidía. Por tanto no se debe declarar que la batería completa haya sido ejecutada contra los tres archivos exactos.
- Una ejecución local del verificador previo sobre un directorio sin lockfile devolvió **exit 1**, fallo cerrado esperado, pero no acredita los casos adversariales ni la aceptación de un paquete válido.
- **Pendiente:** ejecutar el verificador corregido y sus 17 casos (13 originales + 4 symlinks) con los cuatro archivos exactos y lockfile, en Python normal y `-O`; registrar salida y códigos de salida. No se afirma PASS.
- **Pendiente:** fijar SHA-256 por archivo. Los valores Git SHA-1 del manifiesto fueron consultados y coinciden con los metadatos del repositorio, pero **no son SHA-256**. No se inventan hashes SHA-256 de archivos cuyos bytes locales no han sido cotejados.
- **Pendiente:** prueba determinista de carreras mediante inyección de cambios durante la lectura y prueba con directorio renombrado, sin activar red.

## Riesgos residuales
- Un paquete entregado al runner necesita procedencia externa y una forma segura de distribución; este prototipo no garantiza aprovisionamiento sin red.
- El código verifica los archivos sin ejecutarlos. No se ejecutó Node, OSRM ni shell de los workflows.
- Los workflows originales permanecen intactos, con `on: {}`, `if: ${{ false }}`, `permissions: {}` y flags comerciales desactivados.
- No se activó GitHub Actions, no se descargaron mapas ni se accedió a Supabase, staging o producción.

**Decisión:** mantener NO-GO para CI hasta completar la reproducción exacta, SHA-256 y pruebas de carreras.
