# Auditoría móvil de cuarentena — 2026-11-14

## Alcance y procedencia
Rama aislada `plan/maestro-finalizacion-seguridad-20261113`. Artefactos de GitHub Actions: #43635752486 (14129472980) y #43635752475 (14129188949), ambos asociados al commit 4620a6772b4498255ba1f0c6af626c3e1f667fcd.

## Evidencia comprobada
- Ambas ejecuciones: jobs completados con conclusión `success`.
- Cada ZIP contiene nueve PNG: anchuras 320, 375 y 430; estados normal, quarantine y recovered.
- Se inspeccionó una hoja de contacto de las nueve capturas del primer artefacto. Los tres estados se distinguen visualmente, con aviso de cuarentena y aviso de asociación bloqueada. No se observó recorte horizontal evidente en las vistas completas, pero la inspección de capturas no prueba accesibilidad ni interactividad.
- La prueba `tests/delivery-mobile-quarantine-accessibility.test.cjs` comprueba `disabled aria-disabled="true"` en HTML generado durante cuarentena y aviso adecuado.
- La prueba `tests/delivery-mobile-quarantine-visibility.test.cjs` comprueba que la cuarentena vacía orígenes efectivos, invalida snapshot, impide guardar asociaciones, permite recuperación de asociaciones válidas y rechaza recuperación de asociaciones inconsistentes.
- Estas pruebas figuran exitosas en CI #43635752475.

## Pendientes explícitos (NO verificados)
- Chromium a zoom 200% con comprobación de desbordamiento horizontal y reflujo a 320/375/430 px.
- Recorrido Tab / Shift+Tab / Enter / Space: orden de foco, visibilidad del foco y ausencia de acciones de escritura durante cuarentena.
- Accesibilidad: nombres accesibles, anuncios de estado `role=alert`, contraste, asociación de etiquetas y comportamiento de controles inhabilitados con lector de pantalla.
- Inspección ampliada de píxeles a tamaño completo de ambos paquetes y comparación de diferencias.
- Pruebas end-to-end en navegador de recuperación y de invalidación después de desbloquear; las aserciones existentes son de Node/VM.

## Seguridad y límites
No se modificó Supabase, staging, producción, clientes, pedidos, servicios ni despliegues. Esta auditoría no autoriza activación ni merge.

## Criterios de cierre
Ejecutar pruebas Chromium reales para zoom 200%, teclado y árbol de accesibilidad; incorporar aserciones reproducibles al workflow aislado; corregir solamente fallos observados y conservar las capturas como evidencia.

## Ampliación 2026-11-14 — implementación pendiente de CI
- Defecto comprobado por inspección del HTML: los botones Editar/Activar/Desactivar de proveedores no recibían `lockAttribute` durante cuarentena, a diferencia de los almacenes. Corregido en commit `dd36e61a`.
- Defensa en profundidad: `edDeliverySupplierEdit`, `edDeliverySupplierToggle` y `edDeliveryOriginEdit` rechazan llamadas directas durante cuarentena.
- Nueva prueba `tests/delivery-chromium-zoom-keyboard-isolated.cjs` y workflow `.github/workflows/delivery-chromium-zoom-keyboard.yml`. Ejecuta Chromium con origen HTTP ficticio interceptado (sin servidor ni despliegue), a 320/375/430 px, zoom CSS 100/200%, navegación Tab/Enter/Space, bloqueo, recuperación e invalidación de snapshot.
- Limitación: zoom CSS 200% simula escala del contenido pero no sustituye una comprobación del zoom nativo del navegador ni una auditoría WCAG completa. El fixture es una página aislada con funciones reales extraídas de `index.html`, no la página de producción.
- Estado de ejecución: el workflow fue incorporado a GitHub, pero **no se ha confirmado todavía una ejecución exitosa del nuevo workflow**. No afirmar PASS hasta obtener jobs y capturas.

## Seguimiento de CI — 2026-11-14
- Se consultaron las ejecuciones vinculadas a `f3712f63` y `b6be38b6`; el conector devolvió listas vacías. **Esta consulta solo devuelve ejecuciones disparadas por pull request y no permite concluir que los workflows push hayan pasado o fallado.**
- Auditoría estática del test Chromium: detectado un defecto del fixture por uso de `(0,eval)(src)` con declaraciones léxicas `const`; sustituido por `page.addScriptTag({content:moduleSource})` en commit `75f4b2c4`.
- La ejecución real de la nueva batería y sus capturas siguen **sin verificación**. No se atribuyen resultados PASS a Chromium.
- El entorno local dispone de Chromium y Playwright para Python, pero no de una copia accesible del repositorio; por tanto, no se ha ejecutado aquí la batería exacta de GitHub.
- Pendiente: inspeccionar el run de GitHub Actions, revisar logs, descargar artefactos, resolver fallos y repetir hasta PASS antes de cerrar esta etapa.

## Seguimiento 2026-11-14 — verificación de workflow
- Rama `plan/maestro-finalizacion-seguridad-20261113`: confirmada mediante búsqueda de ramas.
- Commit `4c4e05985991130a7c18bd9108b8b242711697d1`: `fetch_commit_workflow_runs` devuelve `[]` (el conector solo cubre PR-triggered runs), y `get_commit_combined_status` devuelve `statuses: []`. Ninguna consulta demuestra ejecución satisfactoria o fallida de un workflow `push`.
- Acceso directo a GitHub desde el entorno local: falló por resolución DNS; no fue posible descargar logs ni capturas nuevas.
- Resultado verificable: **CI del nuevo workflow sin verificar**; no se ejecutaron pruebas Chromium en esta revisión, no se atribuyen resultados PASS, y no se reintentaron jobs sin un ID de ejecución.
- Siguiente paso externo: abrir `https://github.com/Liuben810921/enlace-digital/actions/workflows/delivery-chromium-zoom-keyboard.yml`, localizar un run de la rama y copiar su ID/URL. Si no hay runs, comprobar si el workflow se ha registrado y si Actions está habilitado para la rama; evitar cambios de configuración sin aprobación.
