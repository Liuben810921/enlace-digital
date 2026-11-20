# Administración de entregas: limpieza de edición — 2026-11-19

Base e478f293f3f0ebbc6a8824b2bf4b4523b9635ca9. Rama plan/havana-osrm-benchmark-offline-20261114; comparación al inicio identical, sin commits posteriores.

## Corrección funcional
Commit d996957ad72ee28e44961f26a96efed0f284c5a3; index.html blob 73f6f7b18b000a666d4365792ae93f9dd1cddb95.

- edDeliveryOriginReset: limpia edDeliveryEditSnapshots.origin y el selector edOriginSupplier, además de los campos previamente reiniciados.
- edDeliveryDestinationCancelEdit: limpia edDeliveryEditSnapshots.destination al abandonar la edición.

Antes, las instantáneas de edición persistían tras cancelar o reiniciar formularios y el selector de proveedor quedaba con un valor anterior en el formulario de almacén. El cambio elimina residuos de estado de edición; no modifica la persistencia de productos.

## Verificación focalizada
Se extrajeron y ejecutaron las dos funciones reales modificadas con un DOM sintético y snapshots inicialmente stale. Comprobaciones: originSnapshot=null, destinationSnapshot=null, edOriginSupplier='', edOriginId='', edDestinationId=''. **5/5 aserciones simples superadas**. Se compiló la función transformada mediante new Function. No se realizó prueba de navegador ni batería integral.

## Pendientes
Persistencia compartida insegura: PENDIENTE, investigación cerrada y no reabierta. Seguridad entre pestañas y reconciliación: PENDIENTE. Los cambios no están desplegados ni verificados en producción.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
