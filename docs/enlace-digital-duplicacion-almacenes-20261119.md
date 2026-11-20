# Duplicación de puntos de salida — 2026-11-19

Base f74f3a8b9bf5db63bf9afce3eb66028d5f0c8fc4; comparación inicial identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Función
Commit 34b879fcd56baf97aa3f00ac527d584674a8ae9d; index.html blob a07d993db9d44e72f5e6bc10f4693fd43268e3b0.

Nuevo botón Duplicar por almacén/punto de salida. edDeliveryOriginDuplicate(id) reinicia la edición anterior, rellena un borrador nuevo con nombre «(copia)», tipo, proveedor, municipio, dirección y coordenadas; mantiene ID vacío para crear registro independiente y no copia asociaciones de productos ni marca de almacén predeterminado. El usuario revisa y guarda con el flujo de creación existente. Bloqueado durante cuarentena.

## Pruebas focalizadas
Función real en entorno sintético:
1. Almacén existente: true, reinicio ejecutado, ID vacío, proveedor s1, nombre «Almacén A (copia)», coordenadas conservadas.
2. Cuarentena: false, sin cambios.
3. ID inexistente: false, sin cambios.
**3/3 escenarios esperados.** Sintaxis de función y panel validada. Sin navegador ni batería integral.

## Límites
No se probó guardado completo ni visualización en navegador. Persistencia compartida insegura y operaciones que exigen atomicidad entre pestañas: PENDIENTE. Sin despliegue, sistemas externos ni datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
