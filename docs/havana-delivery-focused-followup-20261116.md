# ENLACE DIGITAL — seguimiento focalizado de Administración de entregas (16 noviembre 2026)

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Base: `61f8483cfea1312d11a03a894779ed185a620156`.

## Defecto previamente reproducido
La prueba Chromium móvil documentada en `docs/havana-delivery-exact-html-chromium-mobile-20261116.md` reprodujo que el campo «Tarifa ficticia CUP/km» volvía de 250 a 200 al redibujar el panel.

## Corrección acotada
Commit `01b1d13d0c33b6520824ac96d721c31e50eae14b`: el campo conserva su borrador en una variable de memoria de página; `oninput` actualiza el borrador y el renderizador lo reutiliza. No se persiste en localStorage, no afecta tarifas operativas, checkout ni contrato `quote.js`.

## Evidencia verificable en este turno
- `compare_commits` confirma modificación exclusivamente de `index.html` (5 líneas añadidas, 1 eliminada).
- Lectura de `index.html` desde la rama confirma declaración única de `edQuoteDemoRateDraft`, actualización con `oninput`, renderizado desde el borrador y ausencia de almacenamiento del borrador en localStorage.
- Se confirmó que la expresión de conversión de tarifa para el contrato offline sigue intacta.
- No se ejecutó Chromium en este turno: el entorno actual no contiene el HTML exacto materializado, y el acceso directo a raw.githubusercontent.com desde el contenedor está bloqueado. La lectura exacta por conector GitHub permite verificar el código, pero no constituye una ejecución del navegador. **La corrección aún necesita regresión móvil real.**

## Pendientes no atribuidos como superados
- Regresión Chromium móvil de la tarifa tras redibujado.
- Edición de proveedor y almacén.
- Coordenadas inválidas.
- Cuarentena, bloqueo y recuperación.
- Navegación por teclado y zoom 200 %.

No se declaran resultados funcionales de estos escenarios sin ejecutarlos. No se accedió a Supabase, staging, producción, pedidos, cartografía ni servicios operativos. No se descargaron mapas ni se activaron costos.
