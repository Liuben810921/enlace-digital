# ENLACE DIGITAL — Contratos offline de integración de entregas
Fecha: 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`. Base inicial `8c8b73374d6cc21ed08a82fdc12579bc6f58e614`, comparación inicial GitHub: identical.

## Archivos publicados
- `experiments/havana-delivery-quote/integration.js` — SHA Git `7776a981eda835856485f7f31a5bd63473ffc079`.
- `experiments/havana-delivery-quote/integration.test.js` — SHA Git `b91438fc3242be595464f697a5f56fbb5c0062e0`.
- Dependencia histórica reutilizada sin cambios: `experiments/havana-delivery-quote/quote.js` — SHA Git `39f82bed45f7645b935e5951f559a68af27cdda9`.

Se compararon hashes con `git hash-object` de los archivos locales efectivamente ejecutados y con `fetch_file` del repositorio.

## Funcionalidad
`validateConfiguration`: valida versión 1, revisión entera, colecciones, IDs únicos, proveedor activo/inactivo, tipos de origen y pertenencia de almacenes de proveedores, y referencias mínimas de destino.

`updateConfiguration`: contrato puro de actualización optimista por revisión esperada; rechaza conflictos y exige incremento exacto de revisión. **No implementa persistencia física ni operaciones transaccionales en servidor.**

`adaptCheckoutDelivery`: contrato puro que invoca `quoteDelivery` original con la configuración versionada y la matriz vial suministrada; devuelve `PENDIENTE` sin datos suficientes, ante cuarentena o revisión caducada; marca explícitamente `simulationOnly:true` y `COTIZACION_SIMULADA` en casos sintéticos. Devuelve `productTotalAdjustment:0` y `collection:'DIRECT_TO_COURIER'`, sin modificar importes de productos ni emitir pedidos.

**Advertencia importante:** el contrato confía en el campo `status:'verified'` de las rutas que recibe; **no autentica procedencia de cartografía ni demuestra distancias reales**. No usar para cobro real.

## Pruebas ejecutadas
Node.js `v22.16.0` local, comando:
```sh
node experiments/havana-delivery-quote/integration.test.js
# PASS 24 offline delivery integration assertions
```
Exit 0. Un fallo inicial de expectativa del test para proveedor desactivado fue corregido: el origen propio sigue siendo elegible y produce 600 CUP por mínimo de 3 km; no era defecto del módulo. Resultado final: 24 comprobaciones aprobadas.

Casos: esquema, duplicados, referencia de proveedor, conflicto de revisión, incremento requerido, almacén más lejano (2 km y 7 km -> 1400 CUP), tarifa especial 900 CUP, cobro separado, revisión desactualizada, destino inexistente, rutas faltantes/duplicadas/no verificadas, cuarentena, contrato ausente, tarifa inválida, proveedor desactivado, orígenes vacíos y mínimo de kilómetros.

## Restricciones y pasos pendientes
1. **Persistencia empresarial:** diseñar y autorizar almacenamiento multiusuario, roles y migración; ninguna conexión a Supabase ni staging fue realizada.
2. **Distancias verificadas:** disponer de fuente vial real con cobertura de La Habana, licencias y recursos aprobados; no se descargó cartografía.
3. **Integración operativa:** conectar el adaptador a checkout tras disponer de configuración y distancias confiables, manteniendo mensajería fuera de caja; requiere pruebas móviles integradas con pedidos reales desactivados.
4. **Cierre:** no declarar el sistema comercial de entregas completo hasta verificar estos tres puntos.

No se modificó `index.html`, `quote.js`, producción, staging, Supabase ni pedidos. No se ejecutaron GitHub Actions ni se generaron costos.
