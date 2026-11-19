# ENLACE DIGITAL — corrección funcional de almacén predeterminado
Fecha: 2026-11-19. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Base autorizada: `667c5924f38117ed2c17d83a85a3f724dc477988`; comparación inicial: identical.

## Defecto funcional reproducido
La función `edDeliveryOriginSave` reconstruía el objeto del almacén editado sin conservar `defaultForSupplier`. Una prueba aislada de ejecución real de la función JavaScript con formulario y persistencia simulados confirmó que editar un almacén predeterminado para el mismo proveedor eliminaba esa propiedad.

## Corrección
Se conserva `defaultForSupplier` **solo** si el almacén editado ya era predeterminado, sigue siendo de tipo `proveedor` y permanece asociado al mismo `supplierId`. Al cambiar de proveedor o convertirlo en almacén propio se desactiva la marca. Sin cambios en producción, pedidos ni servicios.

## Pruebas mínimas de la función corregida
Archivo `index.html` recuperado de GitHub: blob `438efb0a4b6bfd355efdadd7a5cc12dc3e2992ac`.
- Editar almacén predeterminado sin cambiar proveedor: marca conservada — **PASS**.
- Cambiar el almacén predeterminado a otro proveedor: marca retirada — **PASS**.
- Cambiar el tipo de almacén a propio: marca retirada — **PASS**.
- Editar almacén no predeterminado: permanece no predeterminado — **PASS**.
- Sintaxis del script inline de `index.html` mediante parser V8: **PASS**.

Estas son pruebas funcionales aisladas con dependencias simuladas, **no pruebas Chromium móvil**, ni PostgreSQL, ni de integración completa.

## Próximos bloqueantes útiles
La interfaz móvil sigue pendiente de una ejecución permitida de Chromium; en la intervención anterior la navegación estuvo bloqueada administrativamente. La cotización real sigue requiriendo distancias viales verificadas; mientras tanto debe permanecer `PENDIENTE`. La batería integral queda reservada para el final del desarrollo y antes de activar, con autorización.

No se utilizaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. No se reabrió la auditoría del ejecutor PostgreSQL.
