# ENLACE DIGITAL — Filtro de almacenes asociados a cesta ficticia
Fecha: 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`. Base inicial `67abe928dfd65ec09e45fd5e05896b65e3a734fc` (comparación GitHub: identical).

## Código nuevo y hashes exactos
- `experiments/havana-delivery-quote/cart-origins.js`: Git SHA `1e49376c176aec2a082ab956bfc449d6a6e5a1c2`.
- `experiments/havana-delivery-quote/cart-origins.test.js`: Git SHA `98fbdd1ade14229e61d5b2ecf87c2ac377127f4d`.
- Dependencias sin cambios: `integration.js` Git SHA `7776a981eda835856485f7f31a5bd63473ffc079`; `quote.js` Git SHA `39f82bed45f7645b935e5951f559a68af27cdda9`.

Se compararon los SHA obtenidos por `git hash-object` en archivos locales ejecutados con `fetch_file` de GitHub; coinciden.

## Comportamiento
`selectCartOrigins` valida configuración y revisión, exige cesta ficticia no vacía con cantidad positiva y asociación explícita por producto, rechaza listas vacías, duplicados, orígenes desconocidos e inactivos y proveedores inactivos. Deduplica almacenes entre productos y devuelve únicamente los asociados.

`quoteCartDelivery` reutiliza `adaptCheckoutDelivery` y `quoteDelivery` con la configuración filtrada; conserva `PENDIENTE` y `productTotalAdjustment:0`, `collection:'DIRECT_TO_COURIER'`. Los resultados calculados siguen marcados `simulationOnly:true`.

## Pruebas nuevas
Node.js `v22.16.0`:
```sh
node experiments/havana-delivery-quote/cart-origins.test.js
# PASS 24 cart-origin offline assertions
```
Comprobaciones: selección propia/proveedor, origen más lejano y tarifa 1400 CUP, solo producto propio y mínimo 600 CUP, producto con múltiples orígenes, cesta duplicada, asociación ausente/vacía/duplicada/desconocida, almacén o proveedor inactivo, revisión caducada, cesta vacía o cantidad inválida, rutas ausentes, tarifa especial 900/750 CUP, mensajería fuera de caja, estado de simulación, cuarentena y distancia no correspondiente al origen.

## Limitaciones explícitas
- La asociación `associations` es una entrada ficticia suministrada al módulo, no una consulta empresarial autenticada ni una conexión a inventario real.
- La ruta `status:'verified'` en los fixtures no certifica cartografía real; las pruebas son sintéticas.
- No existe persistencia compartida ni integración con `index.html`/checkout operativo.
- **Regla de tarifas especiales por cesta mixta todavía pendiente de especificación:** el módulo recibe una sola `specialFeeCup`; no determina por sí mismo cómo combinar varias tarifas especiales por producto. Antes de integración real, decidir la política comercial y probarla.
- No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, cartografía externa, despliegues ni costos.

## Estado
**Aprobado:** selección offline por productos y comportamiento seguro ante asociaciones inválidas. **Pendiente:** regla de combinación de tarifas especiales, persistencia multiusuario, rutas reales verificadas y conexión móvil final al checkout.
