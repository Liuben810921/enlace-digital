# ENLACE DIGITAL — Política de tarifas especiales en cestas mixtas (offline)
Fecha: 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`; base `78d3de2a9a77db15e36b94d1ebca2e2b35f8ff0f` (comparación inicial GitHub: identical).

## Fuente inspeccionada
`index.html`, Git SHA `342a73d7698d2b9f5db7234e77d65dd56f6ca517`: `checkoutAmounts()` usa `state.fees[municipio|barrio]`, `freeShipping` y `actualShippingFee`; no contiene regla para agregar tarifas especiales por varios productos. `quote.js` admite una única `specialFeeCup`. El informe anterior `docs/enlace-digital-entregas-filtro-cesta-offline-20261118.md` declara expresamente pendiente esa decisión. **No hay política de cestas mixtas aprobada en estas fuentes.**

## Código publicado
- `experiments/havana-delivery-quote/special-policy.js` Git SHA `87a464d5175f8bda07bfb089da84aa0957319695`.
- `experiments/havana-delivery-quote/special-policy.test.js` Git SHA `311a85adfd4f01f63bbce04641dea25887169c82`.
Ambos hashes fueron comprobados con `git hash-object` sobre archivos locales exactos y `fetch_file` de GitHub.

`quoteWithSpecialPolicy` usa el filtro de cesta ya publicado y rechaza con `PENDIENTE / SPECIAL_POLICY_UNDECIDED` las cestas con mezcla normal/especial, dos productos especiales o múltiples unidades de un producto especial. Rechaza reglas ausentes, duplicadas e importes inválidos. Solo permite cálculo sintético normal o de un único producto especial con una unidad, sin inventar agregación.

## Pruebas nuevas ejecutadas
```sh
node /mnt/data/ed_filter/special-policy.test.js
# PASS 13 special policy offline assertions
```
Node.js v22.16.0, exit 0. Cobertura: normal 1000 CUP a 5 km y 200 CUP/km; único especial 900 CUP; dos productos normales; mezcla normal/especial; dos especiales; cantidad especial 2; regla ausente, duplicada o negativa; rutas ausentes; revisión caducada; `productTotalAdjustment:0`; `collection:'DIRECT_TO_COURIER'`.

## Decisión comercial pendiente
Elegir una política para cesta mixta, por ejemplo: (A) aplicar la tarifa especial máxima de la cesta como tarifa total; (B) sumar tarifas especiales y tarifa normal de otros artículos; (C) exigir cotización manual individualizada para cualquier cesta mixta. Son **opciones propuestas, no reglas aprobadas**. También decidir si la tarifa especial es por unidad o por tipo de producto. Mientras tanto, `PENDIENTE` es obligatorio para combinaciones ambiguas.

## Límites
No se modificó `index.html`, checkout, `quote.js`, Supabase, staging, producción ni pedidos. Las rutas son sintéticas; no hay cartografía real, despliegues, GitHub Actions ni costos.
