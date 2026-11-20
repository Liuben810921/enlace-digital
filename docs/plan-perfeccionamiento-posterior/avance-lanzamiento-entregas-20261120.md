# Avance del mínimo funcional de entregas — 2026-11-20

Base `e4ee5089c3f7f5aecf0b35a2289768a8c2937fca`, rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial `identical`. Cambio `10135683cb1d79942bae5ea8265443686fb3fb64`, blob `20a3095bbbc2d9da4d2d26a0642fcb82a70e8b43`.

## Mejora esencial implementada

Tras registrar un proveedor, el formulario de punto de salida se prepara automáticamente con tipo proveedor, proveedor recién creado y nombre sugerido; foco en municipio. Se utiliza la misma persistencia de proveedores, con comprobación del valor anterior. La dirección y coordenadas siguen siendo introducidas por el operador, sin inventarlas ni geocodificarlas. El proveedor y su punto de salida continúan guardándose en pasos separados; no se simula una transacción entre claves.

## Pruebas focalizadas dinámicas

Código real de `edDeliverySupplierAdd` extraído de `index.html`, ejecutado en V8 con DOM y localStorage simulados. **6/6**:

1. Alta correcta y preparación de punto de salida: true; una escritura.
2. Nombre duplicado: false; cero escrituras.
3. Nombre vacío: false; cero escrituras.
4. Cuarentena: false; cero escrituras.
5. Cambio del registro durante persistencia simulada: false; cero escrituras.
6. Formulario de punto de salida ausente: alta válida y foco alternativo; una escritura.

No se ha ejecutado navegador real ni batería integral.

## Estado del cierre de Administración de entregas

- Registro de proveedores y puntos de salida: implementado en entorno de demostración local; ahora con continuación simplificada.
- Asociación individual de productos: implementada, pendiente de prueba integrada de aceptación.
- Distancia por carretera: **BLOQUEANTE**. No hay motor vial integrado y verificado para La Habana; la cotización conserva el estado `pending_verified_road_distance`.
- Tarifa final: **BLOQUEANTE** hasta obtener distancia vial verificada y probar reglas de tarifa.
- Persistencia compartida y atomicidad entre pestañas: **PENDIENTE**. No usar como garantía de pedidos reales.
- Mejoras de transferencias masivas, automatización de dependencias y gestión de grandes volúmenes: posponer según el README de esta carpeta.

No GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
