# Evidencia focalizada — preparación de Chromium móvil y fronteras de vista previa

**Fecha:** 2026-11-20  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base verificada:** `38d372c09ed3c5378e75837e53e36b7c29aab99c` (HEAD idéntico al iniciar).

## Disponibilidad real del entorno

- `/usr/bin/chromium` existe; Playwright Python instalado.
- Se lanzó Chromium headless mediante Playwright con `--no-sandbox`: versión **144.0.7559.96**.
- No se encontró `index.html` ni `quote.js` en `/mnt/data`.
- La lectura autorizada de GitHub mediante conector sí recuperó `index.html` y ambos contratos JS.
- Intento de consulta HTTP HEAD a `raw.githubusercontent.com` desde el contenedor: `curl` devolvió código `000` y estado de salida **6** (resolución DNS fallida).
- **Bloqueo exacto:** no se pudo materializar una copia local exacta del HTML para abrirlo en Chromium; por tanto, **no se ejecutó una prueba de interfaz móvil real**, ni se infieren resultados visuales.

## Nuevos casos aislados ejecutados (6/6 PASS)

Se extrajo la función original `edDeliveryCheckoutPreview` del HTML obtenido por el conector, y se ejecutó en V8 con las exportaciones reales de `quote.js` y `geoapify-offline.js`, dobles locales de `localStorage`, orígenes y proveedores.

| Caso nuevo | Resultado |
|---|---|
| Producto asociado a almacén propio y almacén de proveedor inactivo | `PENDIENTE`; no cotización |
| Asociaciones en cuarentena | `PENDIENTE / Asociaciones en cuarentena` |
| Contrato de cotización ausente | `PENDIENTE / Cotizador offline no disponible` |
| Adaptador Geoapify ausente | `PENDIENTE / GEOAPIFY_ADAPTER_UNAVAILABLE` |
| IDs de asociación duplicados | `PENDIENTE / INVALID_ROUTE_SCOPE` |
| Asociación no representada por un arreglo | `PENDIENTE / Producto sin punto de salida` |

**Inspección adicional:** `index.html` declara las etiquetas de carga de `experiments/havana-delivery-quote/quote.js` y `experiments/havana-delivery-quote/geoapify-offline.js`; la existencia de las etiquetas no sustituye la prueba de carga en navegador.

## Conclusión y límites

- No se reprodujo un defecto que permita generar tarifas operativas a partir de fixtures ficticios. No se alteró el código operativo.
- Los seis casos anteriores de aislamiento y las diez pruebas del adaptador no se repitieron.
- El comportamiento visual móvil, la carga completa de recursos y la interacción real del DOM permanecen **SIN VERIFICAR**.
- La atomicidad entre pestañas y persistencia compartida insegura siguen **PENDIENTES**.
- No se activaron GitHub Actions, Supabase, staging, producción, pedidos reales, Geoapify ni otros servicios; sin instalaciones, despliegues ni costos.
