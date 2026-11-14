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

## Chromium #43642304904 — regresión de etiqueta, Shift+Tab y foco PASS
- Ejecución `43642304904`, job `132592327706`, commit `d20d3e4b7165465c7e34fdcc7f1d78dbded28209`: conclusión **success** en todos los pasos.
- Preflight Node y validación del módulo Chromium: PASS. Chromium reporta `PASS` en anchuras 320, 375 y 430 px con zoom CSS 100/200 %, teclado, cuarentena e invalidación.
- La batería ejecutada incorpora las aserciones de asociación explícita `label[for=edOriginAddress]`, `textarea.labels`, `:focus-visible`, outline de al menos 2 px y recorrido `Shift+Tab` / `Tab` / `Enter`; el job Chromium completo terminó exitosamente.
- Capturas y registros subidos al artefacto `14132157821` (1 001 551 bytes), SHA-256 `c7d603d5b69dc7bd30f7548f714a1b57f827c0918ebf882366c8e5a66870812c`. Las imágenes individuales no se inspeccionaron en esta revisión.
- Advertencia no bloqueante: acciones GitHub `checkout@v4`, `setup-node@v4`, `upload-artifact@v4` emplean Node 20 deprecado y el runner fuerza Node 24. Priorizar actualización controlada de acciones en mantenimiento separado.
- Límites: foco y contraste evaluados en fixture sintético, no en CSS real de toda la web; sin certificación WCAG integral ni pruebas de lector de pantalla.

## Auditoría estática del CSS real y mantenimiento CI — 2026-11-14
- Se leyó directamente `index.html` de la rama aislada, commit de partida `9ba7c1693ee629d4e90757bfef27306e5f507fd9`. Contiene 13 bloques `<style>`; se identificaron reglas de foco explícitas en `.search:focus`, `.cat:focus-visible`, `.product-name:focus-visible`, `.art-click:focus-visible`, `#modal.modal>.x:focus-visible` y otras variantes de categorías.
- La regla base `button{cursor:pointer}` y botones `.headbtn`, `.primary`, `.secondary` no establecen todos un estilo de foco explícito en el primer bloque CSS. **Esto es una brecha de consistencia potencial, no prueba de foco invisible**: Chromium puede aplicar el outline nativo; reglas posteriores pueden modificarlo. No se cambia CSS por mera ausencia de una regla.
- La prueba de foco de Chromium aprobada `#43642304904` usa un fixture con `button:focus-visible{outline:3px solid #0b5673}`, no el CSS real. Para medir contraste y foco reales hay que cargar los 13 bloques CSS en un fixture representativo, inspeccionar `getComputedStyle` y medir contraste por estado/fondo, o usar la web completa en un entorno aislado. Pendiente: revisión con capturas y mediciones automatizadas, sin presumir WCAG.
- GitHub Actions `.github/workflows/delivery-chromium-zoom-keyboard.yml` sigue con `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`; el último run aprobado registra advertencia de Node 20 deprecado, forzado a Node 24. La documentación oficial de `actions/setup-node` confirma que v5+ ejecuta Node 24, y `actions/upload-artifact` v6+ también; requieren runner >= 2.327.1. Se recomienda migración separada con verificación de versiones y compatibilidad, conservando Node 22 para las pruebas del proyecto y `ubuntu-24.04` para Playwright 1.56.1.
- **Decisión de esta revisión:** no modificar versiones de acciones ni CSS hasta disponer de prueba de regresión del comportamiento real y plan de reversión; evitar introducir riesgo en el workflow Chromium que ya está verde. No se ejecutaron nuevas pruebas ni se atribuye un PASS adicional.

## Batería nueva — CSS real, foco y contraste
- Nueva prueba `tests/delivery-real-css-focus-contrast-isolated.cjs` en rama aislada (commit `f1fe1292`): carga los 13 bloques CSS reales de `index.html` en documento sintético de Chromium, sin ejecutar scripts de tienda ni usar datos reales.
- Para anchuras 320/375/430 px comprueba los botones `.primary`, `.secondary` y `.headbtn`: contraste de texto normal >= 4.5:1 calculado con luminancia relativa sRGB, `:focus-visible`, contorno de foco y navegación Shift+Tab/Tab. Emite capturas por botón y JSON `ci-evidence/real-css-focus-contrast.json`.
- La prueba registra evidencias antes de las aserciones para diagnosticar un fallo real. No se introdujeron modificaciones de CSS ni umbrales suavizados.
- El workflow `.github/workflows/delivery-chromium-zoom-keyboard.yml` incorpora preflight sintáctico y un paso separado de auditoría CSS real (commit `933ba386`); los artefactos existentes `ci-evidence/*` recogen resultados incluso ante fallo.
- **CI pendiente de verificar:** estos cambios todavía no tienen resultado confirmado; las aserciones podrían revelar contrastes/focos insuficientes que habrá que corregir basándose en registros. Los tres botones son una muestra representativa, no una auditoría integral WCAG.
- Alcance estricto: GitHub aislado, sin staging, Supabase, producción, clientes, pedidos ni despliegues.

## Verificación de CI posterior a 292118b6
- Consultado `fetch_commit_workflow_runs` para `292118b6583ddaf46e1b278305479e866fcb6feb`: `[]`. Este método solo devuelve ejecuciones disparadas por pull request; no permite obtener por sí mismo el run `push` de Chromium.
- Verificado en la rama que `.github/workflows/delivery-chromium-zoom-keyboard.yml` contiene `node tests/delivery-real-css-focus-contrast-isolated.cjs` y sube `ci-evidence/*` mediante `if: always()`.
- Revisado el test: carga bloques CSS reales, ejecuta Chromium a 320/375/430 px, registra contraste y estado del foco, y guarda JSON/capturas. **No se han recuperado logs ni artefactos de una nueva ejecución**; tampoco se ha ejecutado el test localmente en esta revisión.
- Sin resultados Chromium nuevos, no se atribuye PASS ni se cambia CSS o umbrales sin defecto demostrado. Para continuar es necesario el ID/URL de la ejecución `push` de este commit, que permite consultar jobs, logs y artefactos con el conector.

## Registro automático de ejecuciones Chromium — mejora de autonomía
- Se creó `scripts/record_chromium_run.py` (commit `305be27c`), que publica exclusivamente `run_id`, `run_attempt`, `head_sha`, rama, resultado del job y URL de ejecución en `.github/ci-evidence/latest-chromium-run.json`.
- El workflow Chromium añade job independiente `record-run-id` con `needs: chromium-accessibility` e `if: always()` (commit `0f99ebff`). Solo este job recibe `contents: write`; las pruebas Chromium mantienen `contents: read`.
- El registro usa `secrets.GITHUB_TOKEN` temporal de GitHub Actions, no escribe ni imprime el token. Impide escritura fuera de `plan/maestro-finalizacion-seguridad-20261113`, usa la API Contents con SHA para evitar sobrescrituras ciegas, reintenta conflictos, y marca el commit `[skip ci]` para no iniciar una nueva batería por el registro. Las escrituras hechas con GITHUB_TOKEN tampoco disparan normalmente workflows `push`.
- El archivo permite al asistente obtener el identificador con `fetch_file` y consultar jobs/logs/artefactos con las herramientas existentes, sin pedir el enlace al usuario. Si el job de registro falla, el método vuelve a requerir diagnóstico puntual; la publicación automática aún debe verificarse en GitHub Actions.
- Limitaciones: registro del último run, no historial completo; no habilita monitoreo en segundo plano ni avisos automáticos sin una automatización independiente. No modifica Supabase, staging, producción, clientes, pedidos ni despliega.

## Segunda verificación del registro de CI — sin resultado concluyente
- En la rama aislada, `fetch_file(.github/ci-evidence/latest-chromium-run.json)` devuelve HTTP 404 después del commit `7ea151d3`.
- El workflow contiene el job `record-run-id`, `needs: chromium-accessibility`, `if: always()`, permiso `contents: write` restringido a ese job y script `scripts/record_chromium_run.py`.
- `get_commit_combined_status(7ea151d3)` devolvió `statuses: []`; esto no equivale a un resultado de GitHub Actions Checks.
- El conector disponible permite recuperar jobs/logs/artefactos cuando se conoce el ID, pero no listar ejecuciones `push` recientes. Por tanto no se puede determinar con estas consultas si el registro está pendiente, falló o fue bloqueado por permisos. **Sin evidencia del fallo, no se altera código ni permisos.**
- Próximo paso de diagnóstico: obtener una vez el ID de ejecución del workflow posterior a `7ea151d3` y consultar los logs del job `record-run-id`. Después, con el registro funcionando, las verificaciones futuras podrán localizar su ID sin intervención manual.

## CI Chromium #43643064400 — diagnóstico y corrección fundada
- Run `43643064400`, commit `b141bd4c`, rama aislada. Job Chromium `132594680529`: **failure** solo en `Audit real CSS keyboard focus and contrast`; preflight, instalación y pruebas Chromium de cuarentena/zoom a 320/375/430 px: **success**. Artefacto `14133041441` (1 086 301 bytes), SHA-256 `f35abdbe9645f8209f74d72558d820dd1ebb826afa32c40248f3292dc37b9e07`, contiene capturas y registros; las imágenes individuales no fueron inspeccionadas aquí.
- Error demostrado: botón `.primary` en anchura 320, texto blanco sobre `rgb(7,139,153)`: contraste **4,07:1**, menor que el umbral de prueba **4,5:1**. En foco por teclado, `:focus-visible=true` pero contorno automático de **1 px**, menor que los **2 px** exigidos por la batería. La aserción se detuvo en el primer error, por lo que no se afirman resultados de los demás botones.
- Job `132594833774` `Record isolated Chromium run identifier`: **success**. Confirmada escritura y lectura del archivo `.github/ci-evidence/latest-chromium-run.json` con `run_id=43643064400`, `chromium_job_result=failure` y SHA de origen. La búsqueda de run ID mediante archivo ya funciona sin enlaces manuales.
- Corrección dirigida en `index.html`, commit `c7be9b51`: `button.primary` con fondo `#08717d` (contraste teórico con blanco ~5,45:1) y foco visible de 3 px en botones principales, secundarios y encabezado, colores de contorno adaptados a fondo claro/oscuro. No se alteran datos, lógica, ni estados de pedido.
- **Pendiente:** verificar la nueva ejecución Chromium posterior a la corrección y sus nueve mediciones. El contraste teórico no sustituye el resultado calculado en navegador. La prueba es sintética y no certifica accesibilidad integral de la web.

## Seguimiento posterior a corrección c7be9b51
- Consulta directa de `.github/ci-evidence/latest-chromium-run.json`: último registro `run_id=43643064400`, `head_sha=b141bd4cf85d65f2c041cf605c061fcc7e00dfc8`, resultado `failure`; es **anterior** a la corrección CSS `c7be9b51`.
- Confirmado en `index.html` que permanecen las reglas de contraste/foco introducidas por `c7be9b51`, y en el workflow que `push` y `record-run-id` siguen configurados.
- No se ha localizado mediante el registro una ejecución nueva, y la herramienta de búsqueda de ejecuciones por commit no cubre `push`. No se dispone de ID posterior para consultar jobs/logs/artefactos. La API pública directa tampoco proporcionó una respuesta utilizable en esta revisión.
- **Estado: verificación Chromium posterior a corrección pendiente, no fallida**. No se atribuye PASS ni se modifica código por ausencia de resultados. El registro funciona en al menos una ejecución confirmada, pero su actualización continua todavía no está demostrada.

## Verificación automática definitiva — Chromium #43643329045 PASS
- El registro `.github/ci-evidence/latest-chromium-run.json` se actualizó automáticamente con `run_id=43643329045`, `head_sha=c7be9b51e2d78e4c705b2bebdb83074479983046`, `chromium_job_result=success`. El asistente obtuvo el ID mediante `fetch_file` y consultó jobs, logs y artefactos sin solicitar URL.
- Job Chromium `132595467386`: **success** en todas las etapas. Logs: `PASS mobile quarantine warning accurately describes cause and editing actions disabled`; `PASS Chromium width=320/375/430 zoom 100/200%, keyboard, quarantine and invalidation`; `PASS real CSS text contrast and keyboard focus on 320/375/430px`. Por tanto la corrección CSS `c7be9b51` supera la batería reproducible.
- Job de registro `132595645782`: **success**. Log confirma publicación de metadata de la ejecución con `attempt=1`.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14133341096`, tamaño 1 092 439 bytes, SHA-256 `5e855e1173a1298a535199532d71372809346e5fb8dd0af475d4ec8803ca95d5`. Se confirmó su publicación; no se han inspeccionado individualmente las capturas.
- Avisos no bloqueantes: deprecación de `punycode`/`url.parse()` y acciones `checkout@v4`, `setup-node@v4`, `upload-artifact@v4` forzadas de Node 20 a Node 24. Programar actualización separada con regresión; no es necesario alterar el workflow que ya pasa.
- Alcance: pruebas sintéticas de tres clases de botones y módulo de entregas; no es una auditoría WCAG completa. Sin modificaciones a Supabase, staging, producción, clientes ni pedidos; sin despliegues.

## Mantenimiento de acciones Node 24 — commit 1429c3bf
- Se verificó en el workflow aislado el uso previo de `actions/checkout@v4` (dos jobs), `actions/setup-node@v4` y `actions/upload-artifact@v4`. Los logs del Chromium PASS #43643329045 advertían que estas acciones Node 20 se forzaban a Node 24.
- Se migraron las tres acciones a `@v6`, conservando `runs-on: ubuntu-24.04` en ambos jobs y `node-version: '22'` para el código de pruebas. Se añadió `package-manager-cache: false` a setup-node para evitar caché npm implícita no requerida.
- Alcance del cambio: exclusivamente `.github/workflows/delivery-chromium-zoom-keyboard.yml`. Se mantienen los mismos jobs, permisos, tests, artefactos y registro de ejecución. Las versiones v6 de estas acciones usan Node 24; la ejecución efectiva necesita un runner compatible.
- Consulta posterior al commit: el registro automático seguía apuntando a `run_id=43643381906` / `head_sha=41346880283708b3cc7742259b0e5aec7045de9f`, anterior a `1429c3bf`. **No hay aún regresión confirmada ni PASS de la migración**. Revisar una nueva entrada con SHA igual o posterior a `1429c3bf`, recuperar jobs/logs/artefactos y comprobar ausencia de aviso Node 20.
- No se ha modificado Supabase, staging, producción, clientes, pedidos ni se ha desplegado.

## Revisión de regresión v6 posterior a 5b9249b7
- El registro automático consultado apunta a `run_id=43643426540`, `head_sha=c777d491ec21adbda18c4efd4e4046c6c11f97ce`, `chromium_job_result=success`. **Esta ejecución es anterior** a la migración `1429c3bf`; no demuestra que las acciones v6 funcionen.
- Se reabrió el workflow desde la rama aislada: `actions/checkout@v6`, `actions/setup-node@v6`, `actions/upload-artifact@v6`; `runs-on: ubuntu-24.04`, `node-version: '22'`, `package-manager-cache: false`. Configuración presente; ejecución posterior aún no verificada.
- `fetch_commit_workflow_runs(1429c3bf)` devolvió una lista vacía, insuficiente para concluir ausencia de ejecuciones `push`. No hay run ID posterior disponible para recuperar logs o artefactos.
- No se cambió código ni se revirtió la actualización por falta de fallos demostrados. Pendiente: cuando el índice registre un `head_sha` igual o posterior a `1429c3bf`, consultar jobs, logs y artefactos; confirmar PASS y ausencia de aviso Node 20. El registro almacena una sola ejecución, por lo que su actualización puede retrasarse o ser reemplazada por una ejecución posterior.

## Regresión definitiva de acciones v6 — PASS #43643460112
- El registro automático publicó `run_id=43643460112`, `head_sha=1429c3bf4fcf46fc2b35bea9d8d20251b5f27ed9`, `chromium_job_result=success`. Se recuperó directamente desde GitHub sin intervención manual.
- Job `chromium-accessibility` `132595864532`: **success** en todos los pasos, incluidos checkout@v6, setup-node@v6, instalación Playwright, pruebas de cuarentena/zoom/teclado, CSS real/contraste/foco y upload-artifact@v6. Los logs confirman Node **v22.23.4** y runner **ubuntu-24.04**.
- Logs: `PASS Chromium width=320 zoom 100/200%, keyboard, quarantine and invalidation`, también 375 y 430 px; `PASS real CSS text contrast and keyboard focus on 320/375/430px`.
- Job `Record isolated Chromium run identifier` `132596033221`: **success**, log de publicación confirma `run_id=43643460112`, `attempt=1`.
- **No aparece la advertencia `Node.js 20 is deprecated`** en los logs de ninguno de los dos jobs. Las acciones v6 ejecutan su runtime de manera compatible con el runner, conservando Node 22 para el proyecto.
- Artefacto publicado `delivery-chromium-zoom-keyboard` ID `14132448732`, tamaño **1 092 434 bytes**, digest `sha256:e89a230f70714c970271d39ae00b54184d8fc77af9495e3d9ca1bc99e2fc2ad9`. Se verificó metadata y publicación, no inspección visual individual de capturas.
- **Conclusión:** migración de acciones GitHub v6 validada por ejecución real y sin fallos demostrados; no se requieren correcciones adicionales. No se accedió ni modificó Supabase, staging, producción, clientes o pedidos, ni se desplegó.

## Siguiente bloque: consistencia concurrente del registro automático de CI
- Hallazgo por revisión del código: `scripts/record_chromium_run.py` escribía el registro más reciente con CAS de SHA pero sin comparar `run_id`. Dos runs que terminan fuera de orden podían sobrescribir la entrada nueva con otra antigua, impidiendo localizar la última ejecución. Es un riesgo lógico reproducible por simulación; no se ha observado una colisión real en los logs.
- Corrección `fef87ffe`: compara `(run_id, run_attempt)` con el registro existente antes de publicar. Si el existente es igual o posterior, omite escritura; si hay conflicto HTTP 409/422, vuelve a leer y comparar en el siguiente intento.
- Pruebas offline nuevas `tests/test_chromium_run_registry.py` (`ba898671`): primera escritura, actualización nueva, rechazo de ejecución antigua, idempotencia del mismo intento, nuevo intento y conflicto con reintento. No usan red, tokens ni datos reales.
- Integración `1c011123`: ejecuta `python3 -m unittest discover -s tests -p test_chromium_run_registry.py -v` en `record-run-id` antes de publicar el identificador; si falla, no se publica. No se cambian privilegios ni la ejecución Chromium.
- **Pendiente**: obtener un run posterior a `1c011123` mediante el registro automático y verificar ambos jobs y los seis tests. Los commits y la inspección estática no sustituyen una ejecución PASS.
