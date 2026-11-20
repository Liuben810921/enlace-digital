# Eliminación de almacenes: snapshot consistente — 2026-11-19

Base b34b5ff1eeef4a14bf5d3b94f1b6f1b58f098e76, comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto y corrección
edDeliveryOriginDelete validaba las asociaciones en una primera lectura y obtenía una segunda lectura para su snapshot. Si aparecían dependencias entre ambas lecturas, la segunda podía adoptarse como referencia y el borrado proseguir. Commit e2a12e4e66fa8763e4317827295de2bd4a93f577; index.html blob 2389fe13e8e74ca085cd247d6ccf42b0774f9b88.

Se conserva el raw de asociaciones de la primera lectura (la usada para validar) y se compara con ese mismo raw después de confirmar. Sin escrituras adicionales ni modificaciones de otras claves.

## Pruebas focalizadas
Función real con localStorage sintético:
1. Sin dependencias: true, una escritura.
2. Con producto p1 asociado: false, cero escrituras.
3. Aparece p1 entre validación y confirmación: false, cero escrituras.
**3/3 escenarios esperados**. Sintaxis validada. Sin navegador ni batería integral.

## Límites
La comprobación no ofrece atomicidad entre pestañas. Persistencia compartida insegura: PENDIENTE. No se accedió a sistemas reales ni se desplegó.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
