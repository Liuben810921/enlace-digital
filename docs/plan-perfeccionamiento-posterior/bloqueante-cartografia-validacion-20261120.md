# Bloqueante de cartografía y validación vial — 2026-11-20

Base `72dacf6209f9deb541b63c5b6a1183317d6ce491` (rama idéntica). Código `1814818b90bb1d4db4f12a7939984186ae005beb` en `experiments/havana-delivery-quote/quote.js`.

## Implementado

`quoteVerifiedRoadDelivery` es una barrera fail-closed para una futura cotización no sintética. Rechaza rutas ausentes, flags `verified` sin procedencia y procedencias incompletas; incluso con una procedencia que afirma `source=osrm`, mantiene `ROAD_DATASET_NOT_TRUSTED` porque no existe un registro de datasets confiables verificados. No se conecta a pedidos reales. `quoteDelivery` sigue siendo un contrato de simulación; rechaza metadatos de procedencia malformados cuando se incluyen.

## Pruebas focalizadas

Código exacto ejecutado en V8, 7/7: sin ruta; flag verificado sin procedencia; procedencia incompleta; procedencia OSRM declarada pero sin dataset confiable; simulación compatible; procedencia malformada; revisión obsoleta.

## Autorizaciones y evidencias necesarias para desbloquear

1. Autorización específica para **descargar** un extracto de OpenStreetMap de Cuba o La Habana y revisar su fuente, licencia ODbL, atribución, cobertura y tamaño.
2. Confirmar disponibilidad y límites de un entorno local para procesar el extracto con OSRM, sin servicios de pago ni despliegues. Cualquier instalación/descarga adicional requiere autorización.
3. Crear manifiesto de dataset con hash, fecha, fuente, región, versión de grafo y reglas de atribución; comprobar que cubra los municipios y accesos pertinentes.
4. Ejecutar pruebas con rutas reales verificadas de origen a destino y revisar desvíos, ausencia de conexión y límites. Solo entonces definir un registro de confianza y habilitar la rama de cotización vial.
5. Probar en navegador el flujo completo de vista previa y, en una autorización separada, la batería integral antes de activar pedidos reales.

**Bloqueantes vigentes:** falta cartografía vial procesada y verificada; tarifa real bloqueada; persistencia compartida y atomicidad entre pestañas PENDIENTES. No GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
