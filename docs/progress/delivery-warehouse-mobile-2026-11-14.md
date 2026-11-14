# Administración móvil de almacenes — avance 14-11-2026

**Rama:** `plan/maestro-finalizacion-seguridad-20261113` · Sin Supabase, staging, producción, clientes ni pedidos.

## Evidencias

- CI anterior: [GitHub Actions #43630470132](https://github.com/Liuben810921/enlace-digital/actions/runs/43630470132) completada con éxito. No se encontraron fallos que corregir en ese run.
- Registro puro: `tests/delivery-warehouse-registry-isolated.cjs` con pruebas `.test.cjs`: proveedores, almacenes propios/externos, edición versionada, activación/desactivación y asociaciones multi-origen.
- Nueva interfaz móvil **aislada**: `tests/fixtures/delivery-warehouse-mobile-demo.html`; altas y edición de proveedores, altas/edición/activación/desactivación de almacenes, coordenadas y asociación de producto ficticio a varios almacenes. Persistencia exclusivamente en `localStorage` de ese navegador, sin llamadas de red.
- Nueva prueba de sintaxis/estructura y aislamiento de red: `tests/delivery-warehouse-mobile-demo.test.cjs`. Añadida al workflow `isolated-delivery-quote.yml` en la rama del plan.

## Distinciones y limitaciones

- **La interfaz está en un archivo de laboratorio, NO en la tienda desplegada.** No hay permisos administrativos reales ni persistencia de servidor. No usar para datos privados o transacciones.
- El almacén real del proveedor en `23.13024, -82.36028` se mantiene confirmado como origen en documentación y pruebas de dominio, **sin nombre comercial definitivo**. La interfaz no lo registra automáticamente; el propietario lo introducirá cuando se habilite un entorno autorizado.
- La interfaz usa controles locales y revisión/versionado conceptual; no está conectada a la invalidación transaccional del backend. Faltan pruebas dinámicas de interacción móvil y accesibilidad, más integración con las funciones existentes de `index.html`.
- Rutas viales reales, tarifa y checkout operativo siguen pendientes; no se inventan kilómetros.

## Siguientes pasos

1. Validar CI del nuevo workflow y corregir cualquier error reproducible.
2. Unificar la interfaz aislada con el panel existente de `index.html`, preservando controles de acceso y sin activar checkout.
3. Implementar vínculo transaccional entre revisión de almacén/origen y cotización sintética; pruebas de carreras e invalidación.
4. Seleccionar y validar proveedor de rutas para La Habana y luego solicitar autorización separada para cualquier integración externa.
