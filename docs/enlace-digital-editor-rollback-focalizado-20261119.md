# Pruebas focalizadas del editor completo — 2026-11-19

Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base inicial: `355064f8806ae8e721f2ced7f25eb8c708e52cdd`. Correcciones: `4eb2691cbbff09ce81bf9c48c0cc678f6b6e89c0` y `936d83ee035e4a70a664b8f5f1f56372a9e6b4b8`.

## Reproducción
Se ejecutó el cuerpo real de `saveEditedProduct()` con DOM, inventario, persistencia y asociaciones simuladas. Antes de la corrección, cuando `save()` lanzaba una excepción, el producto cambiaba de «Original» a «Actualizado» en memoria, aunque el formulario quedaba abierto. Se reprodujo el defecto.

## Corrección
Se toma una copia JSON del producto antes de la mutación y se restaura el objeto si **la primera llamada local a `save()`** lanza una excepción. No se revierte automáticamente si falla la sincronización remota o la asociación local después del guardado, porque el estado remoto puede ser incierto.

## Ejecución posterior de la función real (4/4 PASS)
- Éxito: producto actualizado y editor cerrado.
- Excepción de `save()`: producto original restaurado, editor abierto, aviso mostrado.
- Fallo de sincronización: editor abierto y aviso; producto en memoria actualizado, **reconciliación PENDIENTE**.
- Fallo de asociación: editor abierto y aviso; producto en memoria actualizado, **coherencia remota/local PENDIENTE**.

## Límites
La prueba se ejecutó con dependencias simuladas, no en Chromium ni con servidor. La atomicidad entre inventario remoto, alias y asociaciones, y el guardado completo real permanecen **PENDIENTE**. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral reservada para autorización previa.
