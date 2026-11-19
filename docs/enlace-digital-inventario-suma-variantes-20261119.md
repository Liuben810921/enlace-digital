# Prueba focalizada — total de existencias por variantes (2026-11-19)

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Commit de corrección: `5e3792c6ad8af73997eb07d1be1a9bdc4bfbc0cc`.

## Defecto reproducido
El editor aceptaba cantidades individuales enteras seguras, pero sumaba las variantes sin validar el total. Dos variantes de `Number.MAX_SAFE_INTEGER` y `1` generaban un total fuera del rango seguro. La corrección calcula y valida el total **antes** de asignar valores al producto propio.

## Prueba focalizada offline (Node.js, datos ficticios)
Siete escenarios ejecutados sobre una reproducción aislada de las expresiones de validación: total normal, desbordamiento, máximo exacto, fracción, negativo, nombre duplicado y proveedor. **7/7 PASS**. No se ejecutó el HTML completo ni se probaron guardado remoto, sincronización, navegador, rollback o asociación real. Estos permanecen **PENDIENTE**.

## Límites y controles
Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. No se repitieron auditorías. La batería integral permanece reservada para autorización previa a activar.
