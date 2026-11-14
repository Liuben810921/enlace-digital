# Cuarentena de asociaciones locales tras rollback fallido — 14 noviembre 2026

## CI verificada
GitHub Actions [#43632869361](https://github.com/Liuben810921/enlace-digital/actions/runs/43632869361): **success**. Cambio de proveedor, fallos de lectura/escritura y revisiones corruptas aprobados.

## Cambios aislados
- `index.html`: cuarentena en memoria de la sesión y marcador persistente de advertencia `ed_delivery_associations_quarantine_demo_v1` cuando fracasa el rollback tras fallo de invalidación. Las cotizaciones locales se consideran inválidas mientras haya cuarentena.
- `edDeliveryRecoverQuarantine` revisa formato de almacenes, proveedores y asociaciones; rechaza asociaciones con almacenes desactivados o proveedores inactivos; requiere invalidar el contador de revisión antes de levantar el bloqueo.
- `edProductOriginsSave` rechaza nuevos cambios si no se puede resolver la cuarentena. La UI debe comunicar que la asociación no está confirmada.
- `tests/delivery-mobile-quarantine.test.cjs`: prueba fallo de rollback, cuarentena, invalidación de cotización, recuperación, y rechazo de JSON corrupto.
- Workflow actualizado. [CI #43633369189](https://github.com/Liuben810921/enlace-digital/actions/runs/43633369189) requiere verificación final.

## Riesgo residual
El almacenamiento del navegador no es transaccional y el usuario puede borrar o perder los marcadores; el bloqueo persistente es solo una defensa de demostración. **No constituye una autorización segura para pedidos**. La recuperación no sustituye la validación transaccional del servidor. Pruebas DOM simuladas, no revisión visual de dispositivo real. No se modificaron Supabase, staging, producción, clientes reales, pedidos, rutas ni servicios.
