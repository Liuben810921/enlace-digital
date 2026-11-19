# Pruebas focalizadas: orden de creación y asociaciones — 2026-11-19

Base: `626c516920fb9fd2df4b0b3fcaa526710fbdce0d`. Corrección: `e077b2325bf34fab64066e0766a4ccee05ee55ed`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Defecto reproducido
Antes de la corrección, `createProduct()` invocaba `edProductOriginsSave()` inmediatamente después del guardado local, incluso si `edInventoryQueue` posteriormente resolvía `false`. El alias ya se bloqueaba tras sincronización fallida, pero las asociaciones quedaban confirmadas prematuramente.

## Corrección
Se captura la selección de almacenes y el alias antes de limpiar el formulario. Se espera `edInventoryQueue`; si no devuelve `true`, no se intentan asociaciones ni alias. Si confirma, se guardan asociaciones y luego alias con advertencias independientes ante fallo.

## Ejecución real de createProduct con dependencias simuladas (4/4 PASS)
1. Sincronización y asociaciones exitosas: asociación y alias invocados, sin alertas.
2. Sincronización fallida: ninguna asociación ni alias invocados, advertencia.
3. Sincronización exitosa y asociación fallida: advertencia de almacenes, alias intentado.
4. Sincronización exitosa, asociación exitosa y fallo del alias: advertencia de alias.

## Límites
No existe transacción atómica entre inventario remoto, alias y asociaciones locales. El reintento automático e idempotente de operaciones parciales, la verificación del estado remoto tras timeout y la persistencia del trabajo pendiente permanecen **PENDIENTE**. La creación completa en navegador y la batería integral no se ejecutaron. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
