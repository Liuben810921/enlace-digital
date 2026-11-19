# ENLACE DIGITAL — cierre del laboratorio y avance funcional de entregas
Fecha: 2026-11-19. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Decisión ejecutiva aplicada
Se cierra la etapa de auditorías estáticas repetitivas del ejecutor PostgreSQL. Se conserva el código sin declarar aprobadas las pruebas integradas. No se modificó el laboratorio en esta intervención.

## Funcionalidades inspeccionadas
- **Proveedores:** alta, edición, activación/desactivación y selección en el formulario de almacenes ya están presentes; los cambios usan `edDeliveryPersistAndInvalidate`.
- **Almacenes:** creación/edición, coordenadas opcionales, proveedor asociado y activación/desactivación ya están presentes; cambios invalidan la versión local.
- **Destinos:** alta con municipio, referencia manual y coordenadas opcionales ya estaba presente, pero su guardado escribía directamente en localStorage **sin invalidar la versión de cotización**.
- **Cotización:** `experiments/havana-delivery-quote/quote.js` implementa un contrato offline de cotización simulada; exige rutas verificadas, contexto válido y almacenes activos. La interfaz solo crea distancias ficticias en modo sintético y mantiene `PENDIENTE` sin rutas verificadas. No se habilitan tarifas reales.

## Defecto reproducido y corregido
**Antes:** ejecución aislada de `edDeliveryDestinationSave` con DOM y almacenamiento ficticios: se guardó un destino y se renderizó el panel, pero la versión de cotización quedó en cero. **Reproducción realizada** sin navegador ni red.

**Después:** `edDeliveryDestinationSave` invoca `edDeliveryPersistAndInvalidate(ED_DELIVERY_DESTINATIONS_KEY,items,'destination_added')`, y solo refresca el panel cuando la persistencia e invalidación tienen éxito. Se añade un sufijo aleatorio al identificador para evitar colisiones por dos altas en el mismo milisegundo.

## Verificación de la corrección
- Archivo `index.html` releído de GitHub, blob `4261e365dfbd2ac9bd0ea7e64b5633e781208d85`.
- **PASS** parseo estático V8 del JavaScript inline final.
- **PASS** prueba aislada de la función con dependencias simuladas: un alta invoca invalidación una vez y actualiza la versión simulada.
- **PASS** prueba aislada del fallo de invalidación: no se refresca el panel.
- **NO ejecutado:** navegador Chromium, flujo completo móvil, PostgreSQL, GitHub Actions, Supabase, staging, producción, rutas reales.

## Bloqueantes imprescindibles para cerrar entregas
1. Verificar con Chromium móvil la interfaz real de altas, cambios, recuperación de cuarentena, asociación de almacenes y destinos. Esta verificación no se sustituye por el parseo estático.
2. Integrar o validar una fuente autorizada de distancias viales verificadas para cotización real; sin ella, `PENDIENTE` es el comportamiento correcto. No se autoriza cartografía ni descargas en esta etapa.
3. Validar la batería PostgreSQL desechable antes de aprobar la seguridad transaccional de una integración futura. No reabrir auditorías repetitivas del runner sin defecto concreto.

**Restricciones respetadas:** rama aislada; sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
