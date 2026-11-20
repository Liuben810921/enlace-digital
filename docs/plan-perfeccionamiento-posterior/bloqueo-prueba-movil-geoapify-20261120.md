# Prueba móvil focalizada Geoapify — 2026-11-20

Base `3b86de2e461983da531764a4793cc474b4593aee`; comparación inicial con la rama: `identical`. Se conservaron commits posteriores (ninguno al inicio).

## Comprobaciones ejecutadas

- Node.js `v22.16.0` disponible; binario `/usr/bin/chromium` disponible.
- Se recuperó el contenido de `index.html` desde GitHub por conector: longitud 418485 caracteres, blob SHA `e03883314869a1c2a24a486696d5199cbdb1caa5`. Esta lectura **no materializa el HTML localmente**.
- Se intentó acceder a la copia exacta desde `raw.githubusercontent.com` mediante `curl -IL --max-time 8`; error `curl: (6) Could not resolve host: raw.githubusercontent.com`.
- Se construyó un archivo HTML **sintético y aislado** con la lógica del adaptador, un único origen ficticio, `responses:[]` y un indicador `PASS_MOBILE_PENDING_NO_FEE`; se intentó ejecutarlo en Chromium headless con ventana 393×873. **La ejecución superó el tiempo límite de 20 segundos y no produjo resultado comprobable**. No se atribuye ningún PASS a esta prueba.
- No se realizaron llamadas Geoapify, solicitudes a Supabase, pruebas sobre staging o producción ni despliegues.

## Estado verificable

**NO VERIFICADO:** renderizado móvil dinámico de la página exacta, checkout completo, visibilidad real de `PENDIENTE` y ausencia de importes de mensajería en el DOM del sitio. El contrato offline sigue diseñado para no suministrar rutas verificadas al checkout; los 13 casos unitarios focalizados anteriores están documentados en `evidencias-geoapify-offline-20261120.md`.

**Sin defecto reproducido del producto.** No modificar código operativo basándose en un bloqueo de DNS o un timeout del navegador.

## Siguiente paso técnico

Obtener el `index.html` exacto en un entorno de navegador aislado con acceso al archivo, y ejecutar Chromium con red externa bloqueada, datos ficticios y captura de DOM/capturas; comprobar rutas vacías, error 429, revisión inválida, dos orígenes y cuarentena. Si el navegador vuelve a agotar tiempo, diagnosticar proceso/flags del propio entorno antes de inferir fallos del sitio. Solo corregir defectos demostrados.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas externas, despliegues ni costos. Persistencia compartida insegura y atomicidad entre pestañas siguen PENDIENTES.
