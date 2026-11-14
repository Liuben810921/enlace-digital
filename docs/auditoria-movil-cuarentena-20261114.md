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

## Seguimiento autónomo — instalación de Chromium
- El usuario aportó evidencia visual de que el workflow sí genera ejecuciones `push` y que la ejecución #6 falló en `Install isolated Playwright` antes de ejecutar el módulo de pruebas. No se dispone de texto del error ni de ID numérico de run/job; no se atribuye causa raíz.
- Se verificó en la rama que el workflow actual usa Node 22 y directorio temporal `$RUNNER_TEMP/ed-playwright`, en lugar de depender de `package.json` del repositorio.
- Se añadió captura persistente de `node --version`, `npm --version`, `npm install` y `playwright install --with-deps chromium` a `ci-evidence/*`, con `tee` y `pipefail`. Se conserva el código de salida y se suben los logs con `if: always()`, incluso si la instalación falla. Commit `faa00049`.
- La consulta `fetch_commit_workflow_runs` solo devuelve runs disparados por PR y `get_commit_combined_status` no expone checks de Actions: resultados vacíos no significan ausencia de ejecuciones.
- No se verificó PASS, ni se inspeccionaron nuevas capturas. Próxima comprobación: recuperar run/job ID por un mecanismo que liste ejecuciones `push` y examinar `ci-evidence`; si falla, corregir según log real.

## Continuación autónoma — diagnóstico y preflight sin Chromium
- Verificado el contenido actual del workflow: `setup-node@v4` con Node 22, instalación temporal de Playwright 1.56.1, `tee` + `pipefail`, y subida de `ci-evidence/*` incluso en caso de fallo.
- Se intentó consultar ejecuciones del commit `6981e9dc` mediante `fetch_commit_workflow_runs` y estados combinados: ambos vacíos. La primera consulta excluye workflows `push`; la segunda no expone checks de GitHub Actions. El acceso HTTP directo desde el entorno no estuvo disponible. **No se recuperaron logs nuevos ni artefactos del workflow**.
- Para que una falla de instalación no impida obtener toda evidencia, se agregó un preflight anterior a Playwright: `node --check` del test Chromium, y las pruebas Node/VM `delivery-mobile-quarantine-accessibility.test.cjs` y `delivery-mobile-quarantine-visibility.test.cjs`. Sus salidas se conservan en `ci-evidence/quarantine-*.log` (commit `4148e350`).
- Este preflight no sustituye Chromium: sus resultados **siguen sin confirmación de ejecución**. No se declara CI verde ni accesibilidad WCAG validada.
- Para acceder a logs y artefactos de una ejecución `push` es necesario obtener su ID numérico de ejecución por una API de listado que el conector actual no expone, o disponer de una URL de run. No se intentaron reejecuciones sin identificador válido.

## Diagnóstico confirmado mediante ejecución GitHub #43640001161
- Job `chromium-accessibility` ID `132585262579`, commit `6cfd822ef8168296bd00f94d0afd8e4e48dd4755`, conclusión **failure**.
- `Prepare isolated Node runtime`: PASS (Node 22.23.4, npm 10.9.9).
- `Validate JavaScript and quarantine logic without browser`: PASS; `node --check` sin errores, pruebas `delivery-mobile-quarantine-accessibility.test.cjs` y `delivery-mobile-quarantine-visibility.test.cjs` con mensajes PASS explícitos.
- `npm install playwright@1.56.1`: PASS, dos paquetes instalados. Causa raíz comprobada: el runner `ubuntu-latest` se resolvió a `ubuntu26.04-x64`; Playwright 1.56.1 rechazó `install --with-deps chromium` con `Cannot install dependencies for ubuntu26.04-x64 with Playwright 1.56.1` y `Playwright does not support chromium on ubuntu26.04-x64`.
- `Run actual extracted delivery module in Chromium`: SKIPPED. `Preserve screenshot evidence`: PASS, artefacto ID `14132055103` con 6 archivos de logs/preflight (sin capturas Chromium).
- Corrección mínima: fijar `runs-on: ubuntu-24.04` para evitar cambios no controlados de `ubuntu-latest`. Commit `c8e47bc5`. Pendiente comprobar nuevo run y pruebas Chromium reales. No se modificó Supabase, staging, producción ni datos de clientes.

## Ejecución #43640101055 — primer fallo funcional real en Chromium
- Run `43640101055`, job `132585565545`, commit `829f14350b142d3b45609582fc3edd14652a0025`, rama aislada.
- `setup-node`, preflight JavaScript/cuarentena y `Install isolated Playwright`: **PASS**. La corrección de `ubuntu-24.04` resolvió el bloqueo de instalación.
- `Run actual extracted delivery module in Chromium`: **FAIL**, aserción `Horizontal overflow at width 320 zoom 2` (test línea 44). Esto es una prueba sobre el panel aislado con `document.body.style.zoom=2`, no un dictamen de accesibilidad del sitio completo.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14130764158` (95 881 bytes) guardado. La prueba falló antes de tomar la captura a 200 %.
- Instrumentación correctiva en `d3ad33a6`: antes de lanzar el error, guardar captura completa y JSON con `scrollWidth`, viewport y hasta 30 elementos que sobrepasan el viewport. Mantener la aserción estricta. El workflow ya sube `chromium-*-quarantine.png` y `ci-evidence/*` en `if: always()`.
- Pendiente: ejecutar nuevo run, leer `chromium-overflow-320-zoom-2.json` y corregir el elemento exacto; no ocultar el fallo con `overflow-x:hidden` ni relajar el umbral sin justificación.

## Chromium #43640990881 — elemento responsable localizado
- Job `132588301550`, commit `42bd83b701e4cc3ec205be92c1ee7d1c3ffe56e9`: preflight PASS, instalación Chromium PASS, prueba de navegador FAIL.
- Diagnóstico del log: `Horizontal overflow at width 320 zoom 2`, `viewport:320`, `documentWidth:393`. Único elemento señalado: `TEXTAREA#edOriginAddress`, `left:46`, `right:393`, `width:347`. Artefacto `14132321278` guardado.
- Corrección acotada en `index.html`: `#edOriginAddress` recibe `display:block;width:100%;max-width:100%;min-width:0;box-sizing:border-box`, evitando que el tamaño intrínseco de textarea exceda el contenedor a zoom 200 %. Commit `a84ee9aa`.
- La corrección es una hipótesis técnica basada en el elemento medido; queda pendiente confirmación en una nueva ejecución real de Chromium a 320/375/430 px, teclado y recuperación. No se deshabilitó la aserción de overflow.

## Chromium #43641205396 — validación final PASS
- Run `43641205396`, job `132588960796`, commit `c7d1bb6827fa9b5caf655d09eeef3371871bb7c2`, rama aislada: **success** (todos los pasos).
- Logs: `PASS mobile quarantine warning accurately describes cause and editing actions disabled`; `PASS quarantine blocks mobile selectors and effective dispatch, explicit recovery restores only valid associations and invalidates snapshots`.
- Navegador Chromium: `PASS Chromium width=320 zoom 100/200%, keyboard, quarantine and invalidation`; igualmente `width=375` y `width=430`. Se verificó ausencia de overflow horizontal, acciones de edición deshabilitadas durante cuarentena, recuperación por teclado, rechazo de asociaciones inválidas y cotizaciones anteriores invalidadas.
- Artefacto de capturas `delivery-chromium-zoom-keyboard` ID `14131837952` (1 001 546 bytes), SHA-256 `9ecc4340e3c8f976e3610da19a0b126f2bdd715e0cfea0c2379265e535742f2d`, subido correctamente. Capturas conservadas; su inspección visual individual no se realizó en esta revisión.
- Advertencia no bloqueante en logs: Node.js 20 de acciones `checkout@v4`, `setup-node@v4`, `upload-artifact@v4` forzado a Node.js 24; planificar actualización de acciones en mantenimiento separado.
- Alcance: módulo extraído y datos sintéticos en Chromium; no prueba integral de sitio desplegado ni autorización para staging/producción.

## Seguimiento de accesibilidad posterior a Chromium PASS
- Inspección directa de `index.html`: el campo `textarea#edOriginAddress` mostraba `<label>Dirección de salida</label>` sin `for`; la etiqueta no estaba asociada programáticamente al control. Defecto verificado en el código fuente.
- Corrección acotada: `<label for="edOriginAddress">Dirección de salida</label>` (commit `7763c0e6`), sin modificar reglas de cuarentena, almacenamiento ni cotización.
- Prueba de regresión Chromium: comprobar existencia de `label[for="edOriginAddress"]` y `textarea.labels[0].textContent === 'Dirección de salida'` en el fixture que ejecuta funciones extraídas del HTML real (commit `0305a973`).
- **Pendiente de ejecución CI para estos dos commits**: el PASS #43641205396 corresponde al commit anterior `c7d1bb68`, por lo que no valida todavía la nueva asociación de etiqueta. No atribuir PASS hasta recuperar el nuevo run.
- Pendientes no cubiertos: auditoría completa de nombres accesibles de otros campos, contraste medido, zoom nativo, Shift+Tab, foco visible bajo diferentes estados y pruebas con lector de pantalla. Requieren pruebas específicas, no inferencias a partir del PASS existente.
- Restricciones: exclusivamente rama aislada, sin Supabase, staging, producción, clientes reales, pedidos ni despliegue.

## Extensión de pruebas de teclado y foco — posterior a 6a416711
- Consulta del commit `6a416711ec22b9167316491ca0b7e608c941792b` mediante `fetch_commit_workflow_runs`: lista vacía; no prueba ausencia de ejecuciones `push` ni permite declarar CI verde.
- Inspección del test `tests/delivery-chromium-zoom-keyboard-isolated.cjs`: se verificaba `Tab` seguido de `Enter` y posteriormente `Space`, pero no `Shift+Tab` ni el estilo computado del indicador de foco. Brecha de cobertura comprobada, no defecto visual demostrado.
- Ampliación aislada commit `82863e05`: en Chromium y cada ancho 320/375/430, comprobar `:focus-visible`, `outline-style` distinto de `none`, grosor de outline >= 2 px; retroceder con `Shift+Tab` desde el botón de recuperación, regresar con `Tab` y activar con `Enter`. Se conservan las pruebas anteriores de cuarentena, zoom 100/200 %, invalidación, asociación de etiqueta y rechazo de asociaciones inválidas.
- La prueba utiliza un fixture sintético que define `button:focus-visible{outline:3px solid #0b5673;outline-offset:2px}`; por tanto, valida el foco del fixture y el comportamiento de teclado, **no** certifica que el CSS del sitio completo tenga el mismo indicador. Pendiente auditoría específica del CSS real.
- **Pendiente de validación CI del nuevo commit**: no declarar PASS hasta obtener run/job y logs de esta revisión.
