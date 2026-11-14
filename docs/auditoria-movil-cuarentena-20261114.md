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
