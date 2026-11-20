# Cotizador vial offline acotado a producto — 2026-11-20

Base `5a7b512e9dbdb77e260133be7af051ab4170ee31`, comparación de rama `identical`. Código `dacbe32a298125999f91e9fa6249a24e72dd31f2` en `experiments/havana-delivery-quote/quote.js`.

## Función

`quoteProductDelivery` recibe `productOriginIds`, valida que existan, sean únicos, estén activos, correspondan a un solo tipo y a un único proveedor cuando proceda; rechaza proveedores inactivos. Solo pasa los orígenes del producto a `quoteDelivery`, evitando cobrar según almacenes ajenos. Conserva tarifa mínima de 3 km, tarifa por km, tarifa especial y distancia mayor entre orígenes del mismo producto. Exportada para Node y navegador, pero **no conectada al checkout**.

## Pruebas dinámicas focalizadas

Se ejecutó el código real extraído de GitHub en V8 con rutas ficticias de estado `verified`, no obtenidas de servicio real. **12/12 satisfactorias**: origen único 4 km→800 CUP; dos orígenes compatibles 4 y 8 km→1600 CUP; rechazo de proveedores mezclados; rechazo de origen inexistente; duplicados; falta de ruta; ruta sin verificar; proveedor inactivo; origen inactivo; mínimo 1 km→600 CUP; tarifa especial 1500 CUP; rechazo de revisión de contexto obsoleta.

## Bloqueantes

**BLOQUEANTE:** las rutas `verified` de las pruebas son ficticias. No hay integración con cartografía vial real ni un motor OSRM operativo validado para La Habana. No convertir simulaciones en precios reales.

**BLOQUEANTE:** falta integración y prueba de aceptación del flujo completo de checkout. El cotizador permanece aislado.

**PENDIENTE:** persistencia compartida insegura y atomicidad entre pestañas. No garantizar consistencia entre clientes.

Mejoras no esenciales de optimización logística y operaciones masivas siguen en el plan posterior. No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
