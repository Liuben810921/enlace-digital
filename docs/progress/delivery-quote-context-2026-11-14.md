# Continuación de entregas — 14 noviembre 2026

## Verificaciones
- [GitHub Actions #43631286940](https://github.com/Liuben810921/enlace-digital/actions/runs/43631286940): **success**, incluidas regresiones del panel y cambio de coordenadas.
- Se añadió `tests/delivery-quote-context-isolated.cjs` y `.test.cjs` para contexto de cotización de seis versiones: cesta, destino, ruta, almacenes, asociaciones y tarifa. Se verifica invalidación y rechazo de alteración de payload.
- Se reutiliza `planDelivery`: selección explícita de orígenes efectivos, tarifa calculada sobre el origen efectivo más lejano y bloqueo si falta distancia vial. Todos los kilómetros del test son **ficticios**, no rutas verificadas.
- Workflow `isolated-delivery-quote.yml` actualizado para ejecutar las nuevas pruebas. CI de esta ampliación pendiente de resultado final.

## Alcance y límites
La invalidación del nuevo módulo es **sintética, en memoria y secuencial**. No constituye control de carreras transaccional ni seguridad de cotizaciones del servidor. Los ensayos PostgreSQL anteriores cubren otras carreras sintéticas, pero aún falta unir el nuevo contrato a un servicio persistente autorizado. El módulo no se conecta al checkout público.

El almacén real confirmado en `23.13024, -82.36028` continúa sin nombre comercial asignado. No se escribió ningún dato real en Supabase, staging ni producción.

## Próximo paquete
1. Confirmar CI del contrato de seis dimensiones y corregir fallos.
2. Añadir pruebas de concurrencia/TOCTOU para revalidación de versiones al confirmar cotización, en PostgreSQL desechable.
3. Consolidar interfaz móvil con UX de proveedores y almacenes, sin habilitar pedidos.
4. Diseñar y autorizar por separado rutas viales verificadas y backend de cotizaciones.
