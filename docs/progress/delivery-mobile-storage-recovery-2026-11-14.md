# Integración móvil y recuperación local — 14-11-2026

## Estado verificado
- [GitHub Actions #43632645618](https://github.com/Liuben810921/enlace-digital/actions/runs/43632645618) **success**: asociación de productos, almacenes activos y proveedores, invalidación de cotizaciones y selección explícita.
- [GitHub Actions #43632799136](https://github.com/Liuben810921/enlace-digital/actions/runs/43632799136) **success**: endurecimiento de revisión local, previo a la nueva batería de fallos de almacenamiento.

## Cambios
- `index.html`: al cambiar proveedor, el selector conserva marcados únicamente los almacenes que pertenecen al nuevo proveedor y siguen activos.
- La lectura del contador local de revisión ahora falla de forma cerrada: errores de acceso o valores corruptos producen `null`, no la revisión 0. `edDeliveryQuoteStillValid` rechaza esas revisiones.
- Guardado de asociaciones: detecta fallos de lectura/escritura de `localStorage`; si se guarda la asociación pero falla la invalidación de revisión, intenta restaurar la asociación anterior y devuelve fallo. **No es una transacción atómica**: si también falla la restauración, debe tratarse la asociación como no confirmada y bloquear el uso de cotizaciones antiguas.
- `tests/delivery-mobile-storage-failure.test.cjs`: simula errores de escritura de asociaciones, fallo de escritura de revisión, error de lectura, revisión corrupta y cambio de proveedor con selección filtrada.
- El workflow aislado ejecuta la nueva prueba. [CI #43632869361](https://github.com/Liuben810921/enlace-digital/actions/runs/43632869361) requiere verificación final.

## Límites
La prueba de UI usa DOM simulado y no reemplaza una validación visual en dispositivo móvil. La persistencia local de demostración no es un backend seguro para confirmar pedidos. No se calculan distancias viales reales, no se activa checkout y no se modifican Supabase, staging, producción, clientes ni pedidos. La selección efectiva requiere validación de servidor antes de habilitar compras.
