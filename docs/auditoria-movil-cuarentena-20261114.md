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

## Seguimiento de seis tests offline del índice — pendiente de CI
- Se consultó dos veces `.github/ci-evidence/latest-chromium-run.json`: `run_id=43643569932`, `head_sha=028cc019cf1fe5a4f5b2ec43fed10e45ac61a9b1`, `chromium_job_result=success`. El SHA es anterior a la protección `fef87ffe` y a la integración de pruebas `1c011123`.
- Se releyó `tests/test_chromium_run_registry.py`: contiene seis casos con simulación de API GitHub en memoria, sin red ni credenciales. Se revisaron las rutas de creación, avance, ejecución obsoleta, repetición, nuevo intento y conflicto 409. La inspección estática no equivale a una ejecución PASS.
- No existe un identificador posterior accesible mediante el registro para obtener jobs/logs/artefactos; no se atribuye aprobación a las pruebas nuevas. Sin fallos demostrados no se hicieron modificaciones de código.
- Pendiente: cuando el registro publique un `head_sha` posterior o igual a `1c011123`, verificar específicamente el paso `Test run registry ordering and retries offline` en `record-run-id`, el resultado Chromium, los logs y el artefacto. Si falla el propio registro, será necesario localizar el run por una vía alternativa.

## Verificación definitiva de seis pruebas de concurrencia — PASS #43643665784
- Registro automático leído sin intervención: `run_id=43643665784`, `head_sha=d591569db3e09b4d5f611b7e233102b4a2044d90`, `chromium_job_result=success`; commit posterior a `1c011123`.
- Job `chromium-accessibility` `132596498987`: **success**. Logs confirman `PASS Chromium width=320/375/430 zoom 100/200%, keyboard, quarantine and invalidation`, `PASS real CSS text contrast and keyboard focus on 320/375/430px`.
- Job `Record isolated Chromium run identifier` `132596676801`: **success**. Los seis casos `test_conflict_retries_with_fresh_sha`, `test_first_run_creates_record`, `test_new_attempt_replaces_old_attempt`, `test_newer_run_replaces_older`, `test_same_attempt_is_idempotent` y `test_stale_run_does_not_replace_newer` reportan `ok`. Resumen literal: `Ran 6 tests in 0.008s`, `OK`. La publicación posterior del índice también tuvo éxito en el primer intento.
- Artefacto `delivery-chromium-zoom-keyboard`, ID `14133361555`, tamaño **1 092 431 bytes**, digest `sha256:e0b33bac8cbe5bd4d242e1d2f15303d3f282a37e74e17bb94d5c12764412ca36`. Publicación confirmada; capturas individuales no inspeccionadas.
- Conclusión: protección de orden e idempotencia del índice validada en pruebas offline y CI real. No se identificaron defectos que requieran cambios. No equivale a haber reproducido una carrera real de GitHub; las pruebas simulan conflictos API. Sin acceso a Supabase, staging, producción, clientes o pedidos, ni despliegues.

## Accesibilidad del formulario de almacenes — etiquetas explícitas
- Hallazgo verificado por inspección de `index.html`: siete controles del formulario `edDeliveryOriginsPanel()` tenían elementos `label` sin `for`, pese a que los controles disponían de ID. La dirección ya tenía asociación correcta. Riesgo: el nombre accesible no estaba garantizado en lector de pantalla.
- Corrección `6108c4b5`: se añaden asociaciones `for` a `edOriginName`, `edOriginType`, `edOriginSupplier`, `edOriginMunicipality`, `edOriginOsmAnd`, `edOriginLat` y `edOriginLng`. Sin alteraciones de la lógica de guardado ni la cuarentena.
- Regresión `a02a89e6`: el test Chromium existente verifica en DOM real `element.labels` y `for` para los siete campos y `edOriginAddress`, con el formulario bloqueado por cuarentena, en cada ancho 320/375/430 px. Emite `PASS warehouse form explicit labels for 8 controls`.
- Estado: cambio y prueba incorporados a la rama aislada. **Pendiente** confirmar ejecución CI posterior a `a02a89e6` mediante el registro automático, jobs, logs y artefactos. No atribuir PASS antes de esa ejecución.

## Cierre de regresión de ocho etiquetas accesibles — PASS #43644019357
- El índice automático publicó `run_id=43644019357`, `head_sha=a02a89e67c190008a7188099128562860836460a`, `chromium_job_result=success`. La ejecución incluye la prueba nueva de ocho controles.
- Job Chromium `132597659903`: **success** en todos los pasos. Los logs muestran tres veces `PASS warehouse form explicit labels for 8 controls` (320, 375, 430 px); también `PASS Chromium width=320/375/430 zoom 100/200%, keyboard, quarantine and invalidation` y `PASS real CSS text contrast and keyboard focus on 320/375/430px`.
- Job índice `132597836087`: **success**. Los seis tests offline reportan `ok`, resumen `Ran 6 tests in 0.007s` / `OK`; publicación de metadatos exitosa en intento 1.
- Artefacto `delivery-chromium-zoom-keyboard`, ID `14133212739`, tamaño **1 092 449 bytes**, digest `sha256:f47c6cbdb217cf692e3a97564993f41da4cdada4450a70d0ed1f05b16dfd8d03`. Se verificó publicación y metadata, no inspección individual de capturas.
- Conclusión: las siete asociaciones nuevas y la octava ya existente superan la regresión en Chromium real. Sin defectos confirmados que corregir. Solo rama aislada; sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Auditoría siguiente: nombres accesibles de acciones de proveedores y almacenes
- Hallazgo por inspección del código real `edDeliveryOriginsPanel()`: acciones repetidas `Editar` y `Activar/Desactivar` sin contexto en su nombre accesible; con varios registros los lectores de pantalla no distinguen el objetivo del botón.
- Corrección `0b9bcf37`: añade `aria-label` específico por proveedor/punto de salida y nombre escapado del registro a los cuatro tipos de acciones. Conserva el texto visible, el bloqueo `disabled aria-disabled` en cuarentena y los manejadores existentes.
- Regresión `d460f16d`: Chromium verifica que las cuatro acciones de datos sintéticos se encuentran por nombre accesible exacto y único, además de las comprobaciones preexistentes de teclado, cuarentena, zoom, ocho etiquetas y contraste.
- Estado: cambio y prueba incorporados; **pendiente** comprobar un run con `head_sha` igual o posterior a `d460f16d`, revisar logs de `PASS supplier and warehouse action accessible names`, los seis tests offline del índice y los artefactos. No se ha demostrado todavía PASS de la nueva regresión.

## Seguimiento de regresión de nombres accesibles — sin run posterior confirmado
- El registro `.github/ci-evidence/latest-chromium-run.json` se consultó tres veces y seguía en `run_id=43644113879`, `head_sha=666b9bfb09a61e72b23beff5f87c183019a161f2`, anterior a `d460f16d`.
- La consulta alternativa `fetch_commit_workflow_runs(d460f16d)` devolvió `workflow_runs=[]`. Esta API puede no incluir ejecuciones disparadas por `push`, por lo que el resultado **no demuestra** que GitHub Actions no se haya ejecutado.
- Sin un identificador de ejecución posterior no se pueden asociar con rigor jobs, logs ni artefactos a la regresión nueva. No se atribuye PASS ni fallo. Se conserva el código y las pruebas sin modificaciones por falta de defectos demostrados.
- Pendiente: consultar registro actualizado; verificar `PASS supplier and warehouse action accessible names` en los tres anchos, las ocho etiquetas, teclado, cuarentena, zoom, contraste, seis tests del índice, jobs y artefacto.

## Cierre de regresión de nombres accesibles — PASS #43644182333
- El registro automático publicó `run_id=43644182333`, `head_sha=b038926853cf935bd333c66d73c6695122674faa`, `chromium_job_result=success`; SHA posterior a `d460f16d`.
- Job `chromium-accessibility` `132598151329`: **success**. Logs confirman `PASS supplier and warehouse action accessible names` tres veces (320/375/430 px); `PASS warehouse form explicit labels for 8 controls` tres veces; `PASS Chromium width=320/375/430 zoom 100/200%, keyboard, quarantine and invalidation`; `PASS real CSS text contrast and keyboard focus on 320/375/430px`; prueba Node de aviso de cuarentena también PASS.
- Job `Record isolated Chromium run identifier` `132598308100`: **success**. Seis casos offline individuales `ok`, resumen `Ran 6 tests in 0.008s`, `OK`; publicación de índice exitosa en intento 1.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14132529501`, tamaño **1 092 433 bytes**, digest `sha256:5e1100b792b5015b0f77b86f90a64aded5fed29a43d9387d670fd79806976255`, no expirado. Metadata y publicación verificadas, capturas individuales no inspeccionadas.
- No hay fallos confirmados que corregir. La prueba cubre fixture sintético y módulo extraído, no una auditoría de accesibilidad integral de producción. Sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Auditoría de foco tras edición y recuperación de cuarentena
- Hallazgo por inspección del módulo real: `edDeliveryOriginEdit` desplazaba el encabezado del formulario con `scrollIntoView` sin trasladar foco al formulario. `edDeliveryQuarantineRecoverFromPanel` reconstruía el panel mediante `adminTab('delivery')` después de activar el botón de recuperación, eliminando el elemento enfocado del DOM sin destino explícito de foco.
- Corrección `dd752ba9`: tras editar un almacén se enfoca `edOriginName`; tras recuperación exitosa se enfoca `h3#edDeliveryPanelTitle[tabindex="-1"]` para orientar al usuario sin introducir una parada adicional en el orden Tab. El foco solo se traslada cuando la recuperación es válida. No se modifica la lógica de bloqueo ni de persistencia.
- Regresión `786468da`: Chromium comprueba foco inicial y avance Tab desde nombre hasta tipo al editar; tras activar recuperación por teclado comprueba foco en el encabezado y `tabindex=-1`. Se mantienen los ensayos previos de cuarentena, ocho etiquetas, nombres accesibles, zoom, contraste y seis pruebas offline del índice.
- Estado: **pendiente de CI**. No atribuir PASS antes de obtener run con SHA posterior a `786468da`, inspeccionar jobs, logs y artefactos. Alcance exclusivamente GitHub rama aislada; no Supabase, staging, producción, clientes, pedidos ni despliegues.

## Seguimiento CI de foco y navegación — ejecución de corrección, regresión aún pendiente
- El índice automático se consultó cuatro veces: `run_id=43644340014`, `head_sha=dd752ba9a1282344654e5e3e6f794f95989c5f52`, `chromium_job_result=success`. Esta ejecución incluye la corrección de foco, pero es anterior a la prueba `786468da`.
- Jobs de la ejecución: `chromium-accessibility` `132598635723` **success** y `Record isolated Chromium run identifier` `132598761388` **success**.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14133337989`, tamaño **1 092 453 bytes**, digest `sha256:727f62ae36211acd790689a9a691233ce6250168c38f434bec1118cc1f38fd05`.
- No se atribuye PASS a `PASS warehouse editing focus and keyboard order` ni `PASS quarantine recovery restores accessible focus` hasta observar un run con `head_sha` posterior o igual a `786468da` y revisar sus logs. No hay defectos nuevos confirmados, por lo que no se altera el código.

## Cierre de regresión de foco y teclado — PASS #43644351339
- Registro automático: `run_id=43644351339`, `head_sha=786468da95eb191af2f582c884b4424df31586f0`, `chromium_job_result=success`. Incluye el commit de pruebas de foco.
- Job `chromium-accessibility` `132598670752`: **success**. Logs confirman `PASS warehouse editing focus and keyboard order`, `PASS quarantine recovery restores accessible focus`, `PASS supplier and warehouse action accessible names` y `PASS warehouse form explicit labels for 8 controls`, cada uno en los anchos 320, 375 y 430 px. También `PASS Chromium width=320/375/430 zoom 100/200%, keyboard, quarantine and invalidation`, `PASS real CSS text contrast and keyboard focus on 320/375/430px` y `PASS mobile quarantine warning accurately describes cause and editing actions disabled`.
- Job `Record isolated Chromium run identifier` `132598923275`: **success**. Los seis tests offline reportan `ok`; resumen `Ran 6 tests in 0.008s`, `OK`. Publicación del índice exitosa en primer intento.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14132654331`, tamaño **1 092 458 bytes**, digest `sha256:3e79704e8d2f343e94845c18f40a90222eaa1acd82ef80ff8371c0904eed7b67`, no expirado. Publicación y metadata verificadas; capturas individuales no inspeccionadas.
- Conclusión: regresión de foco tras edición y recuperación de cuarentena validada en Chromium real y fixture sintético. No hay fallos demostrados que corregir. Alcance solo rama aislada de GitHub, sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Auditoría de guardado, limpieza, persistencia y recuperación fallida
- Hallazgo por inspección: `edDeliveryOriginReset` limpiaba campos sin reposicionar foco; `edDeliveryOriginSave` y `edDeliverySupplierAdd` reemplazaban el panel mediante `adminTab('delivery')` sin destino explícito para el foco tras persistencia exitosa.
- Corrección `529e134c`: limpieza enfoca `edOriginName`; guardado de almacén y alta de proveedor enfocan `#edDeliveryPanelTitle[tabindex=-1]` únicamente si la persistencia e invalidación fueron exitosas.
- Regresión `8838ecc7`: Chromium comprueba foco y valor vacío después de limpiar, foco y persistencia del almacén después de guardar, foco y persistencia del proveedor tras registrar.
- Regresión `1817c327`: tras recuperación fallida por asociaciones inválidas, verifica `role=alert`, botón de recuperación disponible, ambos `fieldset:disabled` y marca de cuarentena persistida.
- Pendiente CI: localizar run posterior a `1817c327`, verificar logs, seis tests offline y artefactos. No se atribuye PASS sin ejecución. Sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Seguimiento de CI para persistencia, foco y recuperación fallida
- Se consultó tres veces el índice automático: permanece en `run_id=43644481430`, `head_sha=3e31675df8b4462247ef01759ade714f18c1fef8`, anterior a la regresión `1817c327`.
- No hay ejecución posterior confirmada mediante el índice en este seguimiento. No se pueden atribuir resultados de Chromium, seis tests offline, jobs, logs o artefactos a la nueva regresión sin `head_sha` apropiado.
- Se mantienen intactas las correcciones y pruebas incorporadas; no se modificó código sin fallo demostrado. Pendiente: comprobar registro posterior a `1817c327`, inspeccionar `PASS reset/save/add focus and local persistence` y `PASS failed quarantine recovery remains announced and locked`, y verificar los restantes controles y artefactos.

## Fallo confirmado y corrección mínima — CI #43644563510
- Registro: `run_id=43644563510`, `head_sha=a32acd69ecdb9523e2e9d35f934f9c35a4608982`, `chromium_job_result=failure`, posterior a `1817c327`.
- Job Chromium `132599324242` falló en `AssertionError: Supplier and warehouse edit must be disabled`: `actual: 3`, expectativa 2. La prueba anterior había añadido correctamente un proveedor sintético, por lo que la expectativa de dos botones ya no reflejaba el fixture. Logs muestran `PASS reset/save/add focus and local persistence`.
- Job índice `132599493284` **success**: seis tests offline `ok`, `Ran 6 tests in 0.011s`, `OK`. Artefacto parcial `delivery-chromium-zoom-keyboard` ID `14133850260`, tamaño 3792 bytes, digest `sha256:037a4d3f8c87249794e0137db41a8452512063db293fd55f98eabf749ac9cc17`; no representa el conjunto completo de capturas.
- Corrección mínima `16e88741`: ajusta a tres las expectativas de botones Editar y Desactivar deshabilitados tras alta de proveedor; no cambia lógica operativa. **Pendiente** ejecución posterior a este commit para validar recuperación fallida, anuncios, zoom, foco y artefactos.

## Cierre de regresión de persistencia, foco y cuarentena — PASS #43644660610
- Índice automático: `run_id=43644660610`, `head_sha=16e88741913024ce63476b14a091332251b5ddbb`, `chromium_job_result=success`, ejecución del commit correctivo.
- Job `chromium-accessibility` `132599629135` **success**, sin pasos fallidos. Logs muestran tres veces (320, 375, 430 px) `PASS reset/save/add focus and local persistence`, `PASS warehouse editing focus and keyboard order`, `PASS supplier and warehouse action accessible names`, `PASS warehouse form explicit labels for 8 controls`, `PASS quarantine recovery restores accessible focus`, `PASS failed quarantine recovery remains announced and locked` y `PASS Chromium width=... zoom 100/200%, keyboard, quarantine and invalidation`. También `PASS real CSS text contrast and keyboard focus on 320/375/430px` y `PASS mobile quarantine warning accurately describes cause and editing actions disabled`.
- Job `Record isolated Chromium run identifier` `132599761675` **success**: seis pruebas offline `ok`; `Ran 6 tests in 0.011s`, `OK`, registro publicado en primer intento.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14133129097`, tamaño **1 132 789 bytes**, digest `sha256:762da219780bf87b7af72487b4fb76a13f294484ff3316bf4f84009bc2afd0a0`, no expirado. Se verificó metadata, no se inspeccionaron individualmente las capturas.
- La corrección mínima `16e88741` resolvió el fallo de conteo de botones deshabilitados después del alta sintética. Sin fallos nuevos demostrados; no se altera código operativo. Alcance solo rama aislada, sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Validación de guardado inválido y revisión de integridad
- Hallazgo por inspección: el guardado de almacén con campos obligatorios vacíos emitía `alert` sin mover el foco al campo que debía corregirse. El usuario de teclado no recibía orientación directa hacia el error.
- Corrección `7e66e822`: en la rama de validación obligatoria, enfoca el primer campo inválido (nombre, tipo, municipio o dirección) antes del aviso existente; no altera almacenamiento ni reglas de validación.
- Prueba Chromium `42f39be8`: intenta guardar con nombre vacío, exige foco en `edOriginName` y comprueba que tanto la representación persistida de almacenes como la revisión de cotización permanecen idénticas. Se mantienen las demás pruebas de cuarentena, persistencia, accesibilidad y zoom.
- Estado: pendiente de ejecución CI con `head_sha` que incluya `42f39be8`; no se atribuye PASS todavía. No se modificaron Supabase, staging, producción, clientes, pedidos ni despliegues.

## Seguimiento de CI — guardado inválido y revisión de cotizaciones
- Cuatro consultas del registro automático devolvieron `run_id=43644745405`, `head_sha=58744cd738d4a912cb0917b3c00cd5f8fef5a15e`, `chromium_job_result=success`, anterior a la regresión `42f39be8`.
- No se atribuye PASS a la prueba nueva `PASS invalid warehouse save focuses field without persistence or quote invalidation` sin ejecución que incluya `42f39be8`.
- La ausencia de run nuevo en el registro no demuestra fallo del workflow ni autoriza modificaciones. Mantener el código intacto y verificar jobs, logs, seis tests offline y artefactos cuando se publique un `head_sha` apropiado. Solo GitHub, rama aislada, sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Cierre de regresión de guardado inválido — PASS #43644824477
- Registro automático: `run_id=43644824477`, `head_sha=9f61a24f7bec7e5b581873bd3bd55468c5c2d483`, `chromium_job_result=success`, posterior a `42f39be8`.
- Job `chromium-accessibility` `132600138555` **success**. Logs: `PASS invalid warehouse save focuses field without persistence or quote invalidation` en 320/375/430 px; también `PASS reset/save/add focus and local persistence`, `PASS warehouse editing focus and keyboard order`, `PASS supplier and warehouse action accessible names`, `PASS warehouse form explicit labels for 8 controls`, `PASS quarantine recovery restores accessible focus`, `PASS failed quarantine recovery remains announced and locked`, `PASS Chromium width=... zoom 100/200%, keyboard, quarantine and invalidation`, `PASS real CSS text contrast and keyboard focus on 320/375/430px` y aviso de cuarentena móvil PASS.
- Job `Record isolated Chromium run identifier` `132600295274` **success**. Seis pruebas offline `ok`, `Ran 6 tests in 0.010s`, `OK`, registro publicado.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14133438345`, tamaño **1 132 775 bytes**, digest `sha256:b78e340a3b31252be353a0411a47915d232931f199c08e1df96ddf6813e88b36`, no expirado. Metadata comprobada; capturas individuales no inspeccionadas.
- Sin fallos confirmados pendientes en este bloque. No se modifica código operativo adicional; rama aislada, sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Auditoría de coordenadas y proveedor — bloque siguiente
- Defecto confirmado por inspección: guardado de almacén con proveedor no activo, pareja de coordenadas incompleta o coordenada fuera de rango mostraba `alert` sin enfocar el control incorrecto.
- Corrección `ba8738eb`: foco explícito en `edOriginSupplier`, coordenada ausente o coordenada fuera de rango antes de avisar; sin modificar la lógica de persistencia.
- Prueba `838ef087`: Chromium verifica foco de latitud 91°, longitud faltante y proveedor no seleccionado; comprueba que los datos locales y revisión de cotizaciones permanecen iguales tras los tres rechazos.
- Revisión de código de `edDeliveryPersistAndInvalidate`: guarda valor previo, intenta escritura, invalida revisión solo tras escritura, revierte si falla invalidación y activa cuarentena si no puede confirmar rollback. No se ha confirmado defecto adicional en esta inspección; falta batería reproducible de fallos simulados de localStorage.
- Pendiente: ejecutar nueva regresión Chromium y seis tests offline; verificar jobs, logs, artefactos mediante registro automático. Sin Supabase, staging, producción, clientes, pedidos ni despliegues.

- Prueba adicional `f9381a7f`: simula excepción de `Storage.prototype.setItem` exclusivamente para la clave de revisión; exige resultado falso, rollback de almacenes, revisión intacta y ausencia de cuarentena cuando el rollback sí funciona. Pendiente de CI; no se afirma PASS.

## Cierre de coordenadas, proveedor y rollback — PASS #43645311659
- Índice automático `run_id=43645311659`, `head_sha=ff5dc2acec751b85256affd436219eaad5ac0c23`, `chromium_job_result=success`, posterior a `f9381a7f`.
- Job `chromium-accessibility` `132601632158` **success**, sin fallos reportados. En 320, 375 y 430 px: `PASS coordinate and inactive supplier validation focus and quote integrity`, `PASS simulated localStorage revision failure rolls back without quote invalidation`, `PASS invalid warehouse save focuses field without persistence or quote invalidation`, `PASS reset/save/add focus and local persistence`, `PASS warehouse form explicit labels for 8 controls`, `PASS quarantine recovery restores accessible focus`, `PASS failed quarantine recovery remains announced and locked`, `PASS Chromium width=... zoom 100/200%, keyboard, quarantine and invalidation`. También PASS en nombres accesibles y contraste CSS.
- Job `Record isolated Chromium run identifier` `132601887251` **success**: seis tests offline `ok`, `Ran 6 tests in 0.008s`, `OK`, índice actualizado.
- Artefacto `delivery-chromium-zoom-keyboard` ID `14134015560`, tamaño **1 132 785 bytes**, digest `sha256:f731dce833f2d51322387be028ca1c409f7ee79b715356b034b056eb31481d10`, no expirado. Metadata verificada; capturas individuales no inspeccionadas.
- Sin fallos confirmados en esta ejecución; no se requieren correcciones. Alcance: solo rama aislada de GitHub, sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Fallos parciales y rollback fallido — batería sintética
- Revisión de `edDeliveryPersistAndInvalidate`: ante excepción de escritura comprueba si hubo mutación parcial y activa cuarentena; ante fallo de invalidación intenta revertir y activa cuarentena si falla el rollback. La validación de cotizaciones consulta cuarentena antes de permitir reutilización. No se observó un defecto demostrado que justifique alterar código operativo.
- Commit `9b736d30`: dos pruebas Chromium aisladas sobre `Storage.prototype.setItem`: (1) escritura que modifica el almacén y después lanza excepción; exige resultado falso, revisión intacta, cuarentena y cotización anterior inutilizable; (2) invalidación de revisión fallida más fallo de escritura al revertir; exige las mismas garantías. Cada prueba restaura explícitamente sus datos sintéticos y el estado de cuarentena del fixture para no contaminar regresiones posteriores.
- **Pendiente de CI**: localizar run posterior a `9b736d30`, revisar Chromium, seis pruebas offline, jobs, logs y artefactos. No se afirma PASS sin ejecución. Sin Supabase, staging, producción, clientes, pedidos ni despliegues.

## Integración local proveedor-almacén-producto — implementación inicial
- Auditoría: el formulario de producto ya disponía de selector de proveedor, lista de almacenes y persistencia local de asociaciones por identificadores. Sin embargo, para productos nuevos no seleccionaba automáticamente ningún proveedor/almacén y al cambiar de proveedor tampoco establecía predeterminado.
- Commit `4fcb6a22`: añade `edDeliveryPreferredOrigin` (respeta `defaultForSupplier===true`, con fallback al primer almacén elegible); para producto nuevo preselecciona primer proveedor activo con almacén válido y su almacén preferido; al cambiar proveedor actualiza la selección a un almacén elegible. Los almacenes propios continúan separados; identificadores previos se conservan, y la validación de elegibilidad sigue comprobando estado activo y cuarentena.
- Commit `86010c7d`: prueba sintética Chromium del formulario local con proveedor activo de dos almacenes, proveedor inactivo y almacén propio; exige almacén principal predeterminado y separación de origen propio. **Pendiente de CI**.
- Alcance deliberado: este cambio opera en el selector de asociaciones locales del formulario existente. No se ha cambiado el modelo remoto de inventario, ni se ha migrado Supabase, ni se ha habilitado compra/pedido. La selección por defecto se materializa al guardar la asociación existente; la lógica de invalidación local permanece.
- Pendientes para cierre completo: verificar CI y regresiones; ampliar UX para marcar/cambiar predeterminado en administración y revisar validación transaccional de producto/asociación antes de habilitar integración real. No se afirma que el flujo remoto sea transaccional.

## Selección predeterminada por proveedor y CI de integración
- Registro automático del commit `4767b368`: run `43646347628`, Chromium job `132604909420` **failure** por `page.evaluate: TypeError: Cannot read properties of null (reading 'value')` en test nuevo, después de pruebas PASS de rollback, cuarentena y persistencia. El escenario de producto se ejecutaba tras activar cuarentena y el selector no se renderizaba. Los seis tests offline del job `132605127770` pasaron (6/6). Artefacto parcial ID `14134451810`, 3786 bytes, no expirado, digest `sha256:47a870ebf190bc946a4846cda3f9ee9596769909ac323d9b1e483e794dbdedab`.
- Commit `3e52cb45`: mover test de selección de almacén antes de activar cuarentena. Cambio limitado al fixture.
- Commit `be4f3e57`: botón «Hacer predeterminado» en filas de almacenes de proveedor; solo permite almacenes y proveedores activos, respeta cuarentena y cambia el flag `defaultForSupplier` de forma exclusiva dentro del mismo proveedor mediante `edDeliveryPersistAndInvalidate`, que invalida revisión de cotizaciones y maneja rollback. Mantiene identificadores y compatibilidad con registros anteriores sin flag.
- Commit `12f8827a`: prueba Chromium sintética de cambio de almacén predeterminado, exclusividad, conservación del almacén propio e incremento de revisión.
- Riesgo auditado: `createProduct` guarda el inventario antes de `edProductOriginsSave` y no comprueba su resultado; si falla la asociación local, el producto podría quedar guardado sin vínculo. No se cambia este flujo remoto bajo la prohibición de tocar inventario remoto. Requiere una etapa de diseño/aislamiento específica antes de activarlo para datos reales.
- CI de los commits nuevos pendiente de registro; no se afirma PASS hasta verificar logs.

## Cierre CI de proveedor-almacén y propuesta de atomicidad
- Registro automático: run `43646837334`, commit `624d868d0a708ceed1fc0bad8cf74f0bb7bff71f`, resultado Chromium **success**. Job `chromium-accessibility` `132606411045` **success**; job `Record isolated Chromium run identifier` `132606695403` **success**. Seis tests offline **OK** (0.009 s).
- Chromium PASS en 320/375/430 px: selección de proveedor y almacén predeterminado; almacén propio separado; cambio de predeterminado conservando IDs e invalidando revisión; fallos simulados de escritura parcial y rollback, cuarentena, foco, etiquetas, teclado y zoom 100/200 %. PASS de contraste CSS y foco.
- Artefacto `delivery-chromium-zoom-keyboard`: ID `14134162247`, 1 132 792 bytes, `sha256:7cff64a1ce345c26ed3783f20b57f865cd8e532de519ea520b54ee94d8bdcf4d`, no expirado. Metadatos verificados; capturas individuales no inspeccionadas.
- **Riesgo confirmado por lectura del código**: `createProduct` ejecuta `state.products.push`, luego `save()` (que escribe `enlace_demo_v1` y encola `edQueueSave` y `edQueueInventory`) y finalmente `edProductOriginsSave(createdId, edProductOriginsCollect('new'))`, ignorando el booleano. Si falla la asociación, el producto puede quedar guardado y la sincronización remota ya encolada. No existe transacción entre esos dos almacenes.
- **Diseño propuesto, aún no aplicado**: en fase aislada crear un adaptador de persistencia sintético que reciba producto + proveedor + almacén como una sola intención, valide IDs y estado activo, cuarentena, tipo y revisión antes de escribir, y pruebe fallos de escritura/rollback con Chromium. Para integración futura, la operación autoritativa debe ser atómica en el backend (una transacción/RPC que confirme inventario y asociación juntos), o mantener producto como borrador no publicado hasta confirmación del vínculo y recuperación idempotente. No basta invertir el orden de dos escrituras ni confiar en rollback de localStorage tras encolar la sincronización. Preservar compatibilidad de productos existentes sin asociación mediante migración controlada y estado explícito «pendiente de asignación»; no suponer que un proveedor predeterminado corresponde a productos históricos.
- Sin correcciones operativas en este cierre; sin accesos a Supabase, staging, producción, clientes, pedidos ni despliegues.

## Prototipo sintético de operación atómica producto-proveedor-almacén
- Archivo tests/fixtures/product-bundle-atomic-isolated.js (e576612d): laboratorio independiente, no importado por la tienda. Un registro JSON local contiene producto draft no publicado, proveedor, almacenes, revisión e idempotencia por operación. Rechaza IDs vacíos, almacenes duplicados, proveedores/almacenes inactivos, conflictos de payload, revisiones obsoletas y productos repetidos. No modifica registros históricos.
- Archivo tests/delivery-chromium-zoom-keyboard-isolated.cjs (5ee53ab5): prueba Chromium de borrador, replay idempotente, conflicto de payload, revisión obsoleta, proveedor inactivo, almacén propio, escritura parcial con rollback y rollback imposible con cuarentena.
- La operación sintética escribe un único valor local para producto + vínculo + revisión; esto NO demuestra atomicidad en backend ni cubre interrupción de proceso entre escrituras. Ante excepción intenta revertir; si falla, activa cuarentena.
- Integración futura: RPC transaccional autoritativa con claves foráneas, RLS, idempotencia, versiones y recuperación de commit desconocido; producto no publicado hasta confirmar vínculo; migración controlada de históricos. Requiere autorización independiente para Supabase/staging/producción.
- CI pendiente posterior a 5ee53ab5; verificar logs, seis tests offline y artefactos antes de declarar PASS.

## Cierre CI del prototipo atómico sintético — 14 noviembre 2026
- Registro automático verificado: run 43647753931, SHA 5ee53ab54816b6fa75c21bce7ac6fc9c9460918f, resultado success. Job chromium-accessibility 132609204202: success; job Record isolated Chromium run identifier 132609353568: success.
- Logs Chromium: PASS synthetic atomic product bundle draft, idempotency, revision, write rollback and quarantine en anchos 320/375/430 px. PASS de selección automática de proveedor/almacén, cambio de predeterminado, IDs, revisión de cotizaciones, escritura parcial, rollback fallido, cuarentena, recuperación, foco, teclado, zoom 100/200 % y contraste CSS.
- Seis pruebas offline del registro: 6/6 OK, 0.011 s.
- Artefacto delivery-chromium-zoom-keyboard ID 14134414434, 1132784 bytes, sha256:dc036fcf831a891c29c2c3573f1eaee6e1b385e3fde0a25565f8ce46e8d06a9c, no expirado. Verificados metadatos, no capturas individuales.
- Ningún defecto nuevo confirmado en esta ejecución; no se modificó inventario operativo, Supabase, staging, producción, clientes, pedidos ni se desplegó. La operación atómica es exclusivamente sintética y no representa garantía transaccional de la persistencia remota.

## Ampliación sintética: concurrencia, resultado desconocido y cuarentena
- Commits b07455a7 y c6ab6e2e: Chromium simula dos instancias del adaptador sobre el mismo almacenamiento. El segundo escritor con revisión obsoleta debe recibir stale_revision; tras obtener revisión vigente puede confirmar. El primer escritor puede repetir su operación tras un resultado desconocido y recibir replay idempotente; reutilizar la clave con payload diferente debe fallar.
- Se inyecta una escritura parcialmente aplicada con rollback imposible: la cuarentena debe persistir en el almacenamiento y bloquear una instancia nueva, incluso tras reiniciar el adaptador.
- **Limitación de seguridad comprobable**: el adaptador actual hace read-modify-write sin compare-and-swap ni bloqueo transaccional. Una intercalación de dos escrituras puede confirmar ambas llamadas y perder una actualización (lost update). La prueba de intercalación demuestra expresamente ese riesgo en vez de atribuir atomicidad entre escritores al localStorage. El fixture es deliberadamente no apto para producción.
- Requisito de integración: transacción autoritativa con bloqueo o CAS en base de datos, revisión condicionada, unicidad por clave de operación, replay del resultado confirmado, recuperación ante respuesta perdida, garantías RLS y estados de borrador/publicación. No intentar resolver esta carrera solo con comprobación de revisión en JavaScript.
- CI posterior a c6ab6e2e pendiente de verificación; sin inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Seguimiento de CI de concurrencia — verificación de registro
- Se consultó el registro automático latest-chromium-run.json de la rama aislada: último resultado registrado success, run 43647845445, SHA c08a8f09c57ff119f0759ea19fcef0d585ec50ae, **anterior** a los commits de concurrencia b07455a7, c6ab6e2e y documentación 1a44d2ca.
- Se consultaron los workflow runs asociados individualmente a b07455a753cbb0a622b208fdd2d0a5fb0f0979c0, c6ab6e2e433dd1d5d9179b87a1ba1828c83388bd y 1a44d2ca37f161c5449f7afb9a61aebdf12b9dab; la consulta disponible, que solo enumera runs de pull_request, devolvió lista vacía en los tres casos. Esto **no prueba** ausencia de ejecuciones de otros disparadores.
- No se dispone todavía de run ID posterior confirmado; por tanto no se puede verificar conclusión Chromium, seis tests offline, logs ni artefactos de estos commits. No se afirma PASS.
- Limitación explícita: el prototipo local no dispone de compare-and-swap ni exclusión mutua transaccional. La prueba de intercalación modela pérdida de actualización; no convierte el prototipo en seguro para escritores concurrentes.
- Sin cambios al inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Cierre de CI de concurrencia — ejecución confirmada
- Registro automático: run 43647902724, head c6ab6e2e433dd1d5d9179b87a1ba1828c83388bd, chromium_job_result success.
- Jobs: chromium-accessibility 132609662352 completed/success; Record isolated Chromium run identifier 132609823323 completed/success.
- Chromium: PASS synthetic sequential concurrency, unknown commit replay, revision conflict and persistent quarantine; PASS synthetic interleaving exposes localStorage lost-update limitation (backend CAS required). Estos PASS se repiten en 320, 375 y 430 px, junto con zoom 100/200 %, teclado, foco, contraste, validaciones, rollback, cuarentena y selección de almacenes.
- Seis pruebas offline del registro: 6/6 OK (0.008 s).
- Artefacto delivery-chromium-zoom-keyboard ID 14134975612, tamaño 1132773 bytes, digest sha256:3e046d7ed5ae29afb9496cc3779c67d28d441cafb844654df6055ec96a83756c, no expirado. Se verificaron metadatos, no las capturas individuales.
- No se confirmaron fallos de CI. La prueba de lost update pasa porque reproduce el defecto de concurrencia; no es una corrección ni una garantía de seguridad. El prototipo local no cuenta con CAS. Requiere operación transaccional autoritativa para integración futura.
- Sin cambios al inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Laboratorio PostgreSQL desechable: atomicidad producto-proveedor-almacén
- Esquema sintético tests/postgres-product-bundle-atomic-lab.sql: tablas de contexto, proveedores, almacenes, productos y operaciones; RPC SECURITY DEFINER commit_bundle con bloqueo SELECT FOR UPDATE de la fila de revisión y validación CAS, idempotencia por clave, estado draft no publicado y actualización transaccional de producto, operación y revisión.
- Rol técnico ed_bundle_owner NOLOGIN NOBYPASSRLS; FORCE ROW LEVEL SECURITY y políticas explícitas sobre todas las tablas. Rol ed_bundle_client sin INSERT directo, con solo USAGE del esquema y EXECUTE sobre RPC. No se concede BYPASSRLS.
- Pruebas tests/postgres-product-bundle-atomic-lab.py: privilegios, proveedor inactivo, almacén propio, replay después de respuesta desconocida, conflicto de payload, revisión obsoleta, rollback completo y carrera real entre dos conexiones que compiten por la misma revisión y deben bloquearse hasta commit.
- Workflow .github/workflows/isolated-product-bundle-atomic.yml: PostgreSQL 16 efímero en GitHub Actions, psycopg 3, logs sintéticos como artefacto. No se conecta a Supabase ni reutiliza credenciales reales.
- Alcance y límites: este prototipo guarda un solo almacén por producto; no incluye publicación, migración de históricos, permisos multiempresa, pruebas de deadlock o fallos de red a mitad de commit. El resultado desconocido se simula repitiendo la misma clave después de confirmar. Antes de integrar se requieren auditoría RLS multiusuario, invariantes de cesta/dirección/ruta, idempotencia bajo desconexión, y autorización específica.
- **Ejecución de CI nueva pendiente de confirmación**. No atribuir PASS a los commits nuevos sin consultar jobs y logs.

## Verificación final PostgreSQL desechable — ejecución 43648163856
- Workflow isolated-product-bundle-atomic.yml: run 43648163856, head 93114e267fa1f9760a41f15500529414e617a3bd, completed/success. Job product-bundle-atomic ID 132610480795 completed/success.
- Logs confirman PostgreSQL 16 efímero y PASS: propietario técnico sin BYPASSRLS y cliente sin INSERT directo; CAS, borrador no publicado, validación de almacén, idempotencia y replay; rollback de producto/operación/revisión; dos conexiones con bloqueo de fila, rechazo de revisión obsoleta y reintento. La configuración SQL incluye ENABLE/FORCE RLS en las cinco tablas.
- Artefacto isolated-product-bundle-atomic ID 14134951111, 411 bytes, sha256:e1d965299cf26663487bdaa7c18b0758a6080ca3ed23804c7e3b600cd42f839d, no expirado. Metadatos y carga confirmados.
- Advertencia no bloqueante en logs: acciones checkout@v4 y upload-artifact@v4 usan Node 20 forzado a Node 24 por runner; conviene evaluar versiones actuales en una fase posterior, no se confirmó fallo.
- Alcance: la simulación de resultado desconocido consiste en repetir una clave tras commit confirmado, no en cortar una conexión durante COMMIT. La prueba de concurrencia cubre dos conexiones con la misma revisión, no un análisis exhaustivo de aislamiento. RLS está configurada y se prueba el rol técnico sin BYPASSRLS y ausencia de INSERT directo, pero no se ha realizado una auditoría exhaustiva de todas las políticas o de ataques multiusuario.
- Ningún cambio en inventario operativo, Supabase, staging, producción, clientes, pedidos o despliegues.

## Endurecimiento adversarial PostgreSQL — 14 noviembre 2026
- Commits 36ca123b, cc3a350d, 7d1c7ce9, b5dd7334 y 22e2dad1: RPC sintética commit_multi con asociación de múltiples almacenes, orden canónico para idempotencia, rechazo de duplicados e inactivos, CAS por bloqueo de fila, borrador no publicado y transacción conjunta de producto/asociaciones/operación/revisión.
- La nueva tabla product_warehouses aplica ENABLE y FORCE RLS, política para ed_bundle_owner sin BYPASSRLS y solo SELECT/INSERT para ese propietario técnico; el cliente únicamente EXECUTE de la RPC. La prueba adversarial comprueba denegación de SELECT, INSERT y UPDATE directos, y el acceso del propietario técnico.
- Tests adversariales de conflictos por operationId con payload diferente y producto existente; rollback de asociaciones; dos conexiones reales contendiendo por una operación; repetición idempotente después de commit cuya respuesta se descarta. La prueba no corta físicamente el socket durante COMMIT, por lo que no demuestra todos los desenlaces de fallo de red.
- Workflow reinicializa esquema y roles sintéticos entre la batería base y la adversarial; ambas usan únicamente PostgreSQL 16 desechable. No se conecta a Supabase ni a datos reales.
- Ejecución nueva identificada: run 43648339615 para SHA 22e2dad1707396004ea2568910012242595444ec, job 132611039237 en progreso al consultar. No afirmar PASS antes de revisar logs y artefactos.
- Pendientes de una futura integración: aislamiento multiempresa, autorizaciones por usuario, auditoría de permisos completos, bloqueo/desconexión durante COMMIT, publicación, compensaciones y múltiples almacenes con reglas de cotización. No se modificó inventario operativo ni servicios.

## Corrección verificada por diagnóstico de CI adversarial
- Run 43648339615, job 132611039237: completed/failure. Log de psql indica error de sintaxis en tests/postgres-product-bundle-atomic-lab.sql línea 76, cerca de '$' al declarar commit_multi. La batería no alcanzó las aserciones Python ni produjo artefacto.
- Causa confirmada: delimitadores dollar-quote de la nueva función escritos como AS $ y END $; en vez de AS $$ y END $$;. Corrección limitada al SQL en commit 3dd8687ce2c4b454eccaf4954c089b9fbe3a8fec.
- Nuevo run PostgreSQL 43648443974, job 132611351116, observado en progreso. No se declara PASS ni se atribuyen logs/artefactos hasta finalizar.
- El resto de la configuración permanece aislado; no se tocó inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Cierre de CI adversarial PostgreSQL — run 43648443974
- Run 43648443974 del workflow isolated-product-bundle-atomic.yml, job product-bundle-atomic ID 132611351116: completed/success tras corregir delimitadores dollar-quote PL/pgSQL en commit 3dd8687ce2c4b454eccaf4954c089b9fbe3a8fec.
- Logs: PASS RLS technical owner without BYPASSRLS, no direct client write; PASS CAS/draft/active warehouse/own origin/idempotency/replay; PASS rollback; PASS two-connection row-lock concurrency and stale loser; PASS direct SELECT INSERT UPDATE denied and FORCE RLS; PASS multiple warehouses/canonical order/duplicates/inactive origin; PASS multi-warehouse rollback; PASS concurrent operation and product conflict; PASS post-commit response loss simulation and payload conflict.
- Errores PostgreSQL permission denied en products y context son negativos esperados por los tests adversariales; no indican fallo de CI.
- Artefacto isolated-product-bundle-atomic ID 14135161130, SHA256 68ad9a88d746bc81b9df65104aee0e599cb781191c7a24042870e512e35b9634, no expirado. Advertencia no bloqueante Node.js 20 de checkout@v4/upload-artifact@v4.
- Limitaciones: no se corta la conexión durante COMMIT; se simula pérdida de respuesta después del commit confirmado. RLS multiusuario y aislamiento multiempresa, política de publicación, fallos de red reales y reglas de cotización por múltiples almacenes no están validados. Aprobación de CI no implica aptitud para integrar en producción.
- Sin modificación de inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Laboratorio de aislamiento multiempresa y terminación durante COMMIT
- Nuevos archivos aislados: tests/postgres-product-bundle-tenant-lab.sql y tests/postgres-product-bundle-tenant-recovery-lab.py; workflow isolated-product-bundle-atomic.yml ampliado.
- Identidades PostgreSQL ed_tenant_a y ed_tenant_b son roles LOGIN ficticios; la RPC SECURITY DEFINER obtiene la empresa desde session_user, con asignación fija en tabla tenants. No confía en una variable de sesión editable por cliente. Rol propietario técnico ed_tenant_owner NOLOGIN NOBYPASSRLS; FORCE RLS en tenants, records, ops y versions; política de filas basada en empresa autenticada, cliente sin SELECT/INSERT/UPDATE directo.
- Se prueban claves de operación y productos iguales en dos empresas, versiones independientes, replay y conflicto de payload, CAS obsoleto, borradores no publicados y commits simultáneos de dos empresas con listas de almacenes.
- Prueba de conexión interrumpida: un constraint trigger diferido en ed_bundle_lab.operations retrasa COMMIT; otro backend ejecuta pg_terminate_backend durante la espera. Después se verifica que producto, asociaciones, operación y revisión persisten todos o ninguno, y se reintenta con la misma clave. El desenlace esperado con terminación antes de confirmar es rollback; la prueba acepta también commit completo si la terminación llega después del punto de confirmación. No demuestra recuperación de pérdida de red entre WAL flush y respuesta.
- Alcance: el esquema multiempresa es un segundo prototipo separado del esquema de proveedores y almacenes; no implementa catálogo real, autorización administrativa, control de almacenes por empresa ni cuotas. Se necesita unificar políticas y modelo antes de considerar integración.
- CI inicial: run 43648650351, job 132611974602, en progreso al registrar. No afirmar PASS sin logs/artefactos.
- No se ha tocado inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## CI aislamiento y desconexión: fallo CAS y corrección
- Run 43648650351, job 132611974602: completed/failure, artefacto isolated-product-bundle-atomic ID 14134887486, SHA256 11aa17d4e2aed1edcd42cdea14bb4f676c51ec651746a61f37f35c3cfcae0215, no expirado.
- Logs: PASS todas las baterías originales y adversariales; PASS authenticated two-tenant isolation, independent revisions and idempotency; PASS simultaneous multiwarehouse commits isolated by tenant. Fallo Python tests/postgres-product-bundle-tenant-recovery-lab.py línea 72 en assert started.wait(8), antes de terminar la prueba de desconexión.
- Causa comprobable por inspección de las pruebas: la batería adversarial deja la revisión global sintética en 4; el test de interrupción solicitaba CAS 0 y esperaba status=draft. La validación devolvía stale_revision, por lo que el worker no señalaba started. Correcciones en 26f81bef y c0443d2d: CAS esperado 4 y revisión final 4+rows.
- Nueva ejecución para c0443d2d: run 43648754923, job 132612287966, en progreso al consultar. No declarar PASS de desconexión ni recuperación hasta verificar logs y artefacto de esta ejecución.
- Límites persistentes: el test usa terminación controlada de backend durante trigger diferido; no simula una pérdida arbitraria de red ni demuestra todas las ventanas entre WAL durable y ACK.

## Cierre confirmado de aislamiento y recuperación — run 43648754923
- Run 43648754923 (SHA c0443d2d05f4cc9faed0e4c99f34b485221c1845), job product-bundle-atomic 132612287966: completed/success. Las tres baterías sintéticas de PostgreSQL 16 registraron PASS en logs.
- Base: RLS owner sin BYPASSRLS, cliente sin escritura directa, CAS, borrador, origen activo, idempotencia/replay, rollback y concurrencia de dos conexiones.
- Adversarial: SELECT/INSERT/UPDATE denegados, FORCE RLS, múltiples almacenes, orden canónico, duplicados/inactivos, rollback, conflicto concurrente de operación/producto y pérdida de respuesta después de COMMIT.
- Multiempresa: PASS authenticated two-tenant isolation, independent revisions and idempotency; PASS simultaneous multiwarehouse commits isolated by tenant.
- Desconexión real: PASS actual connection termination during deferred COMMIT; atomic outcome connection_lost 0. El backend fue terminado durante el trigger diferido; no persistió la operación interrumpida ni cambios parciales. PASS idempotent recovery from real commit interruption. No se demostró la ventana de resultado ambiguo posterior a flush durable WAL y anterior al ACK.
- Artefacto isolated-product-bundle-atomic ID 14134583991, tamaño 699 bytes, SHA256 8726986f49b0830cbb79d43f55aa91f0f192145b1ec98ac93c44e80421eff35c, no expirado. Errores permission denied son aserciones negativas esperadas; advertencia Node.js 20 en checkout@v4 y upload-artifact@v4 no bloqueante.
- La aprobación es exclusiva del laboratorio sintético. El esquema de identidad multiempresa está separado del esquema producto/proveedor/almacén, no hay validación de pertenencia real de almacenes a empresas, ni autorización de publicación ni auditoría exhaustiva de fallos de red.
- Sin cambios en inventario operativo, Supabase, staging, producción, clientes, pedidos o despliegues.

## Integración sintética multiempresa proveedor-almacén-producto — 14 noviembre 2026
- Nuevos archivos tests/postgres-product-bundle-integrated-lab.sql y tests/postgres-product-bundle-integrated-lab.py. CI existente isolated-product-bundle-atomic.yml amplía su cuarta batería; run inicial 43648940930, job 132612844517, observado en progreso (no se afirma PASS).
- Tablas de identities, versions, suppliers, warehouses, products, product_warehouses y operations con identidad de empresa. Claves foráneas compuestas (tenant,id) evitan referencias cruzadas entre empresas. Productos CHECK published=false y status=draft.
- Propietario SECURITY DEFINER ed_integrated_owner NOLOGIN NOBYPASSRLS; FORCE RLS en las siete tablas; políticas tenant=(SELECT tenant FROM identities WHERE login_name=session_user). Los roles de empresa LOGIN únicamente tienen EXECUTE de la RPC, no SELECT/INSERT/UPDATE directos.
- commit_bundle valida proveedor activo, cada almacén activo, tipo y pertenencia de empresa; ordena lista de almacenes para replay idempotente; usa bloqueo FOR UPDATE sobre versión de la empresa, CAS y escritura transaccional de producto, asociaciones, revisión y operación.
- Batería: mismo producto/op entre empresas; rechazo de proveedor inactivo, almacén inactivo y almacén inexistente o ajeno; duplicados; conflictos de payload/producto; rollback; concurrencia real misma empresa con bloqueo y operación conflictiva; operaciones paralelas entre empresas.
- Límites: no hay registro real de identidad, política de roles administrativos, catálogo de productos reales, cotización logística, permisos de lectura por empresa, publicación ni conexión a servicios externos. Es prototipo sintético y no una migración aprobada.
- No se ha modificado inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Cierre verificado de CI integrada multiempresa — 43648940930
- Workflow isolated-product-bundle-atomic.yml, run 43648940930, job 132612844517: completed/success en PostgreSQL 16 desechable. Se verificaron logs de las cuatro baterías, todas PASS.
- Nueva batería integrada: PASS FORCE RLS and minimum privileges on integrated tables; PASS cross-tenant ownership, active supplier, multiwarehouse, draft and idempotency; PASS rollback of product, links, revision and operation; PASS concurrent same-tenant CAS and cross-tenant independent commits; PASS integrated synthetic multi-tenant product-supplier-warehouse laboratory.
- Baterías anteriores: PASS atomicidad, CAS, idempotencia, multialmacén adversarial, dos empresas autenticadas, desconexión real durante trigger diferido de COMMIT (connection_lost 0) y recuperación idempotente.
- Artefacto isolated-product-bundle-atomic ID 14134843434, SHA256 61d8b2bef352d049ad9f97fe4e390dc9eb4a6eab31920ea20422feaba97e8a3b, no expirado. Errores de permisos denegados en logs de PostgreSQL corresponden a pruebas negativas previstas; aviso Node.js 20 de acciones checkout/upload no bloqueante.
- Límites: las claves foráneas compuestas se comprueban por su diseño y por operaciones RPC, pero no hay prueba explícita de violación directa de FK por un actor privilegiado. El propietario técnico tiene SELECT en tabla de identidades con política permisiva; la separación se basa en session_user y roles LOGIN ficticios. No se ha ensayado todo tipo de carrera ni fallos arbitrarios de red. No hay integración operativa, publicación, cotizador real, autorización administrativa ni despliegue.
- Resultado: laboratorio sintético aprobado; no implica autorización para staging o producción. Sin modificaciones de inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Quinta batería adversarial integrada — identidad, RLS, FK y CAS
- Archivo tests/postgres-product-bundle-integrated-adversarial.py, incorporado a workflow isolated-product-bundle-atomic.yml. Run inicial 43649388325, job 132614240142, observado en progreso al registrar; no afirmar PASS sin logs.
- Intentos de suplantación: cliente a/b sin SELECT a identities, products, ni UPDATE versions, INSERT products o SET ROLE del propietario o de la otra empresa. Se manipula una variable de sesión app.tenant no confiable para verificar que la RPC usa session_user autenticado.
- RLS efectiva: función de diagnóstico SECURITY DEFINER, propiedad del mismo rol técnico sin BYPASSRLS, lista únicamente productos de la empresa del invocador; FORCE RLS en tablas integradas.
- FK compuestas: ataques directos con cuenta de pruebas privilegiada contra proveedor y almacén existentes de otra empresa, y contra asociaciones producto-almacén entre empresas; se espera ForeignKeyViolation, sin conservar inserciones.
- CAS e idempotencia: ganador y perdedor concurrentes dentro de la misma empresa, bloqueo hasta commit, perdedor stale_revision, replay con orden canónico, conflicto de payload y revisiones finales; todos los productos permanecen draft/unpublished.
- Limitaciones: cuentas y contraseñas son exclusivamente sintéticas de PostgreSQL desechable; rol privilegiado usado solo para pruebas negativas FK. La función diagnóstica se crea únicamente en laboratorio. No se prueba una identidad externa real, revocación dinámica de permisos, conexiones con proxy ni todo fallo de red posible.
- No se ha modificado inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Cierre verificado de quinta batería adversarial — run 43649388325
- Run 43649388325, job 132614240142: completed/success; PostgreSQL 16 desechable. Cinco baterías ejecutadas con PASS, incluida tests/postgres-product-bundle-integrated-adversarial.py.
- PASS identity spoofing denied, untrusted session variable ignored, client table privileges denied.
- PASS FORCE RLS filters actual rows inside technical SECURITY DEFINER function.
- PASS composite foreign keys reject cross-company supplier, product and warehouse references.
- PASS concurrent CAS winner, stale loser, replay and idempotency conflict; all drafts unpublished.
- Baterías previas mantienen PASS de aislamiento multiempresa, permisos mínimos, rollback, concurrencia, idempotencia y terminación real durante trigger diferido de COMMIT con recuperación.
- Artefacto isolated-product-bundle-atomic ID 14135432429, SHA256 d407a8cabde1e55667e3d026423289b5690b84f65f509460e95bf6a3ad4392ec, no expirado. Logs muestran errores de permisos y FK esperados en pruebas negativas, no fallos CI. Aviso deprecación Node.js 20 para checkout@v4/upload-artifact@v4 no bloqueante.
- Límites: rol postgres privilegiado únicamente para aserciones negativas de FK; roles LOGIN y contraseñas sintéticas. RLS probada con session_user y función de diagnóstico del laboratorio; no demuestra autenticación de producción, revocación de roles en vivo, integración de catálogos reales, publicación ni todos los fallos posibles de red. La prueba de COMMIT demuestra terminación previa a persistencia, no la ventana de confirmación durable con respuesta perdida.
- Sin cambios en inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Sexta batería avanzada: revocación, estados concurrentes y replay durable
- Archivo tests/postgres-product-bundle-integrated-advanced.py; ejecución agregada al workflow PostgreSQL aislado en commit 57ddfab5f5280f8f86b2dd7de6ba6eb919b20db3.
- Run inicial 43649572768, job 132614804627, observado in_progress; no declarar aprobado sin logs y artefactos.
- Revocación: conexión de empresa A ya abierta; REVOKE EXECUTE por rol administrativo del laboratorio, denegación esperada para sentencia RPC posterior; GRANT y recuperación en la misma conexión.
- Estado: proveedor desactivado y almacén desactivado tras commit deben rechazar nuevos borradores. Prueba concurrente de UPDATE de almacén sin commit frente a RPC busca detectar validación de estado obsoleto.
- Durable: COMMIT completado, respuesta ignorada deliberadamente por cliente, reconexión y replay idempotente con misma clave; conflicto para payload diferente; un solo producto y operación.
- Riesgo que requiere validación: SELECT sin bloqueo explícito de almacenes/proveedores puede observar la última versión confirmada durante UPDATE concurrente; la carrera debe considerarse fallo si la operación publica borrador con origen que fue desactivado antes de su commit. Corregir únicamente tras observarlo en CI.
- Límite: el ensayo de respuesta perdida descarta el resultado en el cliente después de COMMIT; no provoca caída real de red después del flush WAL.
- Exclusivamente sintético, sin modificar inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Seguimiento CI sexta batería — fallo de recuperación tras GRANT
- Run 43649572768, job 132614804627: completed/failure, artefacto isolated-product-bundle-atomic ID 14135975229, SHA256 2832d9c29bdba4cc47ff7bf056d828fd751338199ea54e2480200ad5ac4747d9.
- Cinco baterías anteriores PASS. La sexta falló en tests/postgres-product-bundle-integrated-advanced.py línea 36: psycopg.errors.InsufficientPrivilege: permission denied for function commit_bundle al reintentar tras GRANT EXECUTE en conexión ya abierta.
- Corrección de la prueba en e13f7918938fc704e1d5b80aa8356789a9773ede: finalizar la transacción de la conexión cliente después de GRANT y antes de verificar ejecución restaurada. No se ha cambiado el contrato RPC ni RLS.
- Nueva CI 43649655515, job 132615060702, observada in_progress. No afirmar validación de carreras de estado ni durable replay hasta disponer de logs.
- Nota de seguridad: el resultado muestra que el permiso revocado bloqueó la sesión; la recuperación del permiso requiere observar límites transaccionales, no implica eludir la revocación.

## Corrección comprobada de carrera de estado — sexta batería
- Run 43649655515, job 132615060702: completed/failure; artefacto isolated-product-bundle-atomic ID 14135597581, SHA256 a136f17f7434ff81b3c181bfc66cebac9e031ae8777a4cc5ead670d9392a2624.
- PASS revocación/restauración EXECUTE en sesión activa y rechazo de proveedor/almacén previamente desactivados. FAIL en advanced.py línea 67: una RPC concurrente no devolvió invalid_origin después de UPDATE de almacén confirmado. Carrera real entre lectura del estado y modificación concurrente.
- Corrección SQL en 4fb772387c7647e2308929d853c68e50e4d0b3c9: PERFORM ... FOR SHARE sobre proveedor y cada almacén elegido (orden canónico) antes de comprobar active; bloqueos se mantienen hasta final de transacción y se enfrentan a UPDATE concurrente. La validación posterior lee estado confirmado después de esperar bloqueos.
- Nueva ejecución 43649768597, job 132615398065, inicialmente in_progress; verificar resultado antes de cerrar.
- Límites: el modelo aún no implementa un flujo administrativo versionado para cambios de proveedor/almacén; FOR SHARE protege la operación RPC frente a UPDATE concurrente pero no elimina posibles interbloqueos con flujos administrativos que bloqueen filas en otro orden. No se ha probado pérdida de ACK de red real después de WAL durable.

## Cierre verificado de sexta batería — FOR SHARE y permisos
- GitHub Actions run 43649768597, job 132615398065: completed/success, PostgreSQL 16 desechable. Artefacto isolated-product-bundle-atomic ID 14135642715, SHA256 cdae9d928bdd4859284ca42afd1a45a431a65427a535b6939cdf23ba77b05c24, no expirado.
- Logs PASS de seis baterías: permisos y RLS sin BYPASSRLS, CAS e idempotencia, rollback, claves foráneas compuestas, aislamiento multiempresa, denegación de suplantación, y todos los borradores unpublished.
- Nueva batería PASS active-session REVOKE blocks new RPC statements, GRANT restores access.
- PASS committed supplier/warehouse deactivation rejects new draft.
- PASS concurrent warehouse state change rejects stale draft: bloqueo FOR SHARE antes de comprobar active, tras esperar UPDATE concurrente.
- PASS durable COMMIT with deliberately lost application response, replay exactly once; payload diferente sigue dando conflicto.
- La terminación real de conexión durante COMMIT de otra batería produjo resultado no persistido y recuperación idempotente; el escenario de respuesta perdida tras COMMIT durable es simulación de aplicación, no caída de red real.
- Límites: no se probó aún carrera equivalente de desactivación de proveedor mientras la RPC está esperando, ni orden de bloqueo del administrador, ni deadlocks/reintentos con múltiples proveedores/almacenes. La protección se comprobó en laboratorio, no en Supabase/staging/producción. Warning de Node.js 20 en acciones GitHub no bloqueante.
- No se modificaron inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Séptima batería sintética: proveedor concurrente y deadlock administrativo
- Nuevo tests/postgres-product-bundle-integrated-deadlocks.py ejecutado al final de workflow PostgreSQL 16 aislado; commit de workflow 0aeaaefc0956a3c8ab9b3a70b2e3f55179956fb8.
- Ensayo: UPDATE supplier.active=false sin confirmar en conexión administrativa mientras RPC con session_user empresa A espera FOR SHARE; después del commit debe devolver invalid_origin sin aumentar revisión ni insertar borrador.
- Ensayo: dos conexiones administrativas actualizan almacenes w1/w2 en orden opuesto, sincronizadas por barrera; comprobar un aborto PostgreSQL SQLSTATE 40P01 y un commit. Administración usa rol postgres solo en PostgreSQL efímero, no representa los privilegios administrativos definitivos.
- Ensayo: reintento de operación administrativa abortada con orden consistente, rollback RPC antes de COMMIT, reintento con misma clave, replay idempotente y conflicto de payload; todos los productos continúan unpublished/draft.
- Run inicial 43650454626, job 132617519104 observado in_progress; resultados no validados todavía.
- Limitaciones: se fuerza un interbloqueo de dos filas, no prueba exhaustiva de topologías multi-almacén ni política de reintentos con backoff exponencial y jitter; no se modifica código operativo ni se hacen pruebas en Supabase/staging/producción.

## Cierre verificado de séptima batería — proveedor concurrente y deadlock 40P01
- GitHub Actions PostgreSQL 16 run 43650454626, job 132617519104: completed/success; artefacto isolated-product-bundle-atomic ID 14136040800, SHA256 b166a6f079778fcf85b55ffd8456602d168128def6b8d88b054a95a6c214dd51, no expirado.
- Logs PASS supplier deactivation concurrent with FOR SHARE rejects stale origin, no draft.
- Logs PASS opposite administrative row-lock order yields one PostgreSQL 40P01 victim; dos conexiones y barrera reproducen ciclo, una transacción aborta y otra confirma.
- Logs PASS deadlock-victim administrative retry, RPC rollback retry, idempotent replay, drafts unpublished.
- Se mantienen PASS de RLS forzada dentro de SECURITY DEFINER sin BYPASSRLS, privilegios mínimos, CAS, aislamiento multiempresa, claves foráneas compuestas, rollback y recuperación idempotente.
- Límite: el reintento administrativo fue manual en el laboratorio, no implementa todavía política automática acotada de backoff/jitter ni manejo de 40001; el ciclo de dos almacenes no demuestra ausencia de otros deadlocks. La prueba de respuesta descartada tras COMMIT es simulación a nivel de aplicación. Warning Node.js 20 de GitHub Actions no bloqueante.
- Alcance: solo PostgreSQL desechable en GitHub Actions y rama aislada. No inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Octava batería — reintentos automáticos 40P01 y 40001
- tests/postgres-product-bundle-integrated-retries.py, commit 2f9f1ad02f0f996604d138dbb1a883583ccb28e9; workflow commit 556cd0fdc3e73d00e032212e5b68de10fe08e592.
- retry_transaction: conexión/transacción nueva por intento, rollback implícito al error, máximo tres intentos, backoff exponencial acotado a 120 ms y jitter determinista de hasta 6 ms; solo SQLSTATE 40P01 y 40001 son reintentables, los demás se propagan.
- Dos conexiones generan un deadlock 40P01 real sobre almacenes w1/w2 en orden inverso; reintento usa orden canónico. Dos transacciones SERIALIZABLE leen/escriben la revisión de empresa B para generar 40001 real.
- Ensayo de agotamiento fuerza error SQLSTATE 40001 en DO PostgreSQL, comprueba exactamente tres intentos sin mutación persistida.
- Ensayo RPC fuerza rollback mediante error 40001 después de crear borrador sin confirmar; segundo intento conserva misma clave y revisión, verifica un solo producto/operación, replay, conflicto de payload, FORCE RLS, NOBYPASSRLS y borradores no publicados.
- CI 43651338682, job 132620259326 inicialmente in_progress. No atribuir PASS sin logs.
- Límites: jitter reproducible, no entropía criptográfica ni perfil de latencia productivo; la prueba RPC inyecta 40001 deliberadamente, mientras los escenarios administrativos provocan conflictos 40P01/40001 genuinos. No cubre commit de resultado desconocido a nivel de red, ni agotamiento de 40P01 específicamente.

## Cierre verificado octava batería — reintentos acotados
- Run PostgreSQL 16 #43651338682, job 132620259326: completed/success. Artefacto isolated-product-bundle-atomic ID 14136251741, SHA256 0468a292300f03c6f5936464e21d5a6fd12b0ee655013b43079f359955789772.
- Logs PASS real 40P01 bounded automatic retry, canonical lock order, exponential backoff+jitter; PASS real 40001 SERIALIZABLE concurrent write, bounded automatic retry; PASS bounded retry exhaustion at 3 attempts; PASS rollback before automatic RPC retry, one draft and operation, replay and payload conflict; PASS FORCE RLS, non-BYPASSRLS technical owner, no published products.
- También PASS de baterías previas: proveedor concurrente con FOR SHARE, permisos, RLS, CAS, rollback, idempotencia y aislamiento multiempresa.
- Advertencia no bloqueante: acciones de GitHub basadas en Node.js 20 forzadas a Node.js 24. No representa fallo de PostgreSQL.
- Límites: prueba RPC usa error 40001 inyectado después de la escritura sin confirmar; 40001 genuino se reproduce en dos transacciones SERIALIZABLE administrativas. Jitter determinista, backoff muy corto de laboratorio. No demuestra rendimiento ni ausencia de todos los deadlocks, ni pérdida de ACK real después de COMMIT durable.
- Alcance: rama aislada y PostgreSQL desechable, sin modificar inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Novena batería — resultado COMMIT incierto y presupuesto temporal
- Nuevo tests/postgres-product-bundle-integrated-unknown-commit.py commit f4a5c6459a4ce1dc783515ffff42e1894db1f8fc; integrado en workflow commit ac4e8f8a29a17cd47f1ceb514a16637f5063f8f6.
- Comprueba respuesta descartada después de COMMIT confirmado, replay con misma clave y un único borrador; conexión cerrada antes de COMMIT con rollback servidor, recuperación posterior con misma clave.
- Política experimental de presupuesto temporal comprobada mediante reloj inyectable: deadline antes de intento y de espera, máximo tres intentos, SQLSTATE 40P01/40001 reintentables y 23505 no reintentable. La octava batería ya prueba backoff y jitter; esta añade deadline reproducible.
- Comprueba revisión CAS, RLS FORCE, propietario NOBYPASSRLS y ausencia de productos publicados.
- Run inicial 43652600357, job 132624144521 observado in_progress; falta validar logs y artefacto.
- Límites: el COMMIT durable con respuesta perdida es una simulación de aplicación; el cierre de conexión se realiza antes de COMMIT y no simula incertidumbre de ACK de red durante COMMIT. Reloj de presupuesto es sintético, no valida tiempo real de red ni cancelación de consulta ya iniciada.

## Cierre verificado de novena batería — recuperación ante resultado incierto
- GitHub Actions PostgreSQL 16 run #43652600357, job 132624144521: completed/success.
- Artefacto isolated-product-bundle-atomic ID 14136648014, SHA256 45cd978dc24081a5d54fd09221be0b6f3de415e37340f296819a1d4529660e20, no expirado.
- Logs PASS durable commit with discarded response: same-key replay exactly once; PASS connection termination before COMMIT rolls back; same-key recovery creates one draft.
- Logs PASS retry time budget prevents extra attempts and excessive sleep; PASS non-retryable 23505 immediately propagated, no extra attempts.
- Logs PASS RLS FORCE, non-BYPASSRLS owner, CAS revisions, drafts unpublished; las baterías anteriores de 40P01, 40001, CAS, aislamiento, permisos, rollback y revocación/restauración también PASS.
- Límite: pérdida de respuesta tras COMMIT durable simulada a nivel de aplicación; cierre de conexión antes de COMMIT sí es real. No se afirma reproducción de pérdida de ACK de red durante COMMIT. Deadline se prueba con reloj sintético y no cancela SQL ya iniciado.
- Warning Node.js 20/24 en GitHub Actions no bloqueante. Sin cambios en inventario operativo, Supabase, staging, producción, clientes, pedidos ni despliegues.

## Décima batería — terminación real dentro de COMMIT y timeouts PostgreSQL
- tests/postgres-product-bundle-integrated-commit-kill.py commit 1a67da7de806c850f6cafffce1e7731d407e9744; workflow commit 635f97d2e919519302c94f404f8d8be1c4f1c42b.
- Constraint trigger DEFERRABLE INITIALLY DEFERRED induce pg_sleep dentro de COMMIT. Otro backend desechable comprueba pg_stat_activity y termina la conexión real con pg_terminate_backend. Tras desconexión se comprueba atomicidad de producto/operación/revisión, se reconcilia la misma clave de operación y se verifica replay sin duplicados.
- lock_timeout PostgreSQL real 100ms ante UPDATE que mantiene lock de versión; espera SQLSTATE 55P03, rollback sin producto. statement_timeout PostgreSQL real 100ms ante pg_sleep; espera SQLSTATE 57014.
- Verifica FORCE RLS, rol técnico sin BYPASSRLS, CAS y borradores no publicados. Run #43654620338, job 132630318734 inicialmente in_progress; no afirmar éxito sin logs.
- Límites: interrupción controlada mientras COMMIT ejecuta un trigger diferido, no demuestra incertidumbre de ACK después de WAL durable; timeout SQL no garantiza límite estricto de tiempo total del cliente bajo fallos de red. No modifica inventario, Supabase, staging ni producción.
