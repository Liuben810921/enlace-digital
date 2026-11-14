# Concurrencia de cotizaciones — 14 noviembre 2026

## Comprobado antes del cambio
GitHub Actions [#43631617435](https://github.com/Liuben810921/enlace-digital/actions/runs/43631617435) terminó **success**, commit `354bd45694cea23f74b9e3ff585a4997c14703a4`.

## Nuevo laboratorio sintético
- `tests/delivery-quote-concurrency-isolated.cjs`: operaciones `prepare`, `mutate` y `confirm` serializadas mediante cola Promise en memoria, con revisión de versiones justo antes de confirmar.
- `tests/delivery-quote-concurrency-isolated.test.cjs`: carreras en seis dimensiones (cesta, destino, ruta, almacenes, asociaciones, tarifa), confirmación anterior/posterior a cambios, doble confirmación, cambios múltiples y rechazo sin distancia vial disponible.
- Reutiliza selección explícita de almacén efectivo: almacenes alternativos no intervienen en la distancia máxima salvo selección efectiva. Las distancias de los fixtures son ficticias.
- Workflow aislado actualizado para ejecutar el nuevo test. CI [#43631785651](https://github.com/Liuben810921/enlace-digital/actions/runs/43631785651) requiere comprobación final.

## Limitaciones explícitas
Este es un **modelo de intercalación concurrente de promesas dentro de un proceso**, no una transacción PostgreSQL ni una simulación de múltiples procesos. No prueba bloqueo, aislamiento SQL ni resiliencia de conexiones. Para ello se requieren pruebas PostgreSQL desechables adicionales. La confirmación de laboratorio no es una orden real ni autoriza pagos.

Sin acceso o cambios a Supabase, staging, producción, datos reales, pedidos, correos o despliegues. El almacén real confirmado en 23.13024, -82.36028 permanece sin nombre comercial.

## Siguiente trabajo
Comprobar CI, corregir errores; después unir la verificación versionada a la batería PostgreSQL desechable y validar carreras de transacciones reales antes de proponer integración en servidor.
