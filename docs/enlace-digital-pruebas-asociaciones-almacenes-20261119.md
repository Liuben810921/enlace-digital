# Evidencia funcional focalizada: asociaciones de almacenes — 2026-11-19

Base verificada: `67de4a2367152244fe0c8e026b6c2f7c3c336d4c`; rama `plan/havana-osrm-benchmark-offline-20261114` sin commits posteriores al inicio.

## Método
Se ejecutó el cuerpo **real** de `edProductOriginsSave()` extraído de `index.html` mediante JavaScript con almacenamiento local simulado y dependencias controladas. No se ejecutó la interfaz completa ni hubo acceso a servicios externos.

## Resultados (6/6 PASS)
1. Asociación propia válida: devuelve `true` y actualiza el mapa.
2. Almacén de proveedor para producto propio: devuelve `false` y conserva el mapa.
3. Identificadores duplicados: devuelve `false` y conserva el mapa.
4. Fallo de invalidación: devuelve `false` y restaura la representación serializada previa.
5. Escritura parcial con excepción: devuelve `false` y restaura la representación previa.
6. Escritura parcial y fallo de rollback: devuelve `false` y activa cuarentena.

## Pendientes
Guardado completo del editor en navegador, sincronización remota, fallo combinado entre inventario y asociaciones, coherencia de alias de proveedor y transacciones entre almacenes e inventario: **PENDIENTE**. No se considera validado el flujo integral. No se repitieron auditorías ni pruebas anteriores. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
