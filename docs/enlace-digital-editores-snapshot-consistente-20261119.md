# Apertura consistente de editores de almacenes y destinos — 2026-11-19

Base b90c5e1a003816547d916b5fe22c6428e6eb20bb, comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto
edDeliveryOriginEdit y edDeliveryDestinationEdit leían el registro antes de capturar el snapshot de edición. Un cambio entre ambas lecturas permitía mostrar datos antiguos y asociarles un snapshot más nuevo. Commit 539dcba16d76dbefb0fd5558025259d596dcd4ed; blob index.html 95c14a70348eefbd4605e59f0db2a2f2ee12cd16.

## Corrección
Ambos editores capturan primero el raw de su clave, cargan el registro, comprueban de nuevo el raw y solo entonces asignan el snapshot de edición y rellenan el formulario. Si se detecta cambio, se rechaza la apertura sin modificar campos.

## Verificación focalizada
Funciones reales con DOM/localStorage sintéticos:
- Almacén estable: apertura correcta, snapshot v1, nueve elementos de formulario manipulados.
- Almacén modificado entre lecturas: rechazo, snapshot null, cero campos modificados.
- Destino estable: apertura correcta, snapshot v1, ocho elementos manipulados.
- Destino modificado entre lecturas: rechazo, snapshot null, cero campos modificados.
**4/4 resultados esperados**. Sintaxis validada. Sin navegador ni batería integral.

## Límites
No se garantiza atomicidad entre pestañas. Persistencia compartida insegura y operaciones que la requieran: PENDIENTE. Sin sistemas reales ni despliegue.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
