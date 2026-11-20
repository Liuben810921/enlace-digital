# Desactivación de almacenes con dependencias — 2026-11-19

Base fa878073bf90cbb19ac91fed376dee97a0ab83ad, comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Defecto concreto y corrección
Antes, edDeliveryOriginToggle permitía desactivar un almacén con productos asociados mediante confirmación, dejando asociaciones a un almacén inactivo. Commit 17e55a50efe2254ee0cdd3b9732bbbdafdd7ae13; index.html blob 83e30dec05bbda3fc36692584c28ad103b228dd9.

Ahora la desactivación verifica la estructura de asociaciones almacenadas, rechaza productos dependientes con instrucción de reasignar o desvincular y vuelve a comparar el snapshot de asociaciones antes de escribir. La activación permanece disponible. Solo se escribe la clave de almacenes.

## Verificación focalizada
Función real con dependencias y almacenamiento sintéticos:
1. Desactivar con p1 asociado: false, cero escrituras, almacén activo.
2. Desactivar sin asociaciones: true, una escritura, almacén inactivo.
3. Activar almacén inactivo: true, una escritura, almacén activo.
4. Asociaciones modificadas entre lectura y comprobación: false, cero escrituras.
**4/4 escenarios esperados**. Sintaxis validada. No navegador ni batería integral.

## Límites
La comparación local no garantiza atomicidad entre pestañas; persistencia compartida insegura y operaciones que requieran atomicidad: PENDIENTE. Sin despliegue ni datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
