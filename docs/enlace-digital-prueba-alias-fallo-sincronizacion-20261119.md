# Pruebas focalizadas de creación y alias privado — 2026-11-19

Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`. Base: `999f54d3dc5a7f2a21ec4939cfb8213818353b15`. Corrección: `9950ea1f7dd3cd643cf5a628369e5d63aaad076c`.

## Defecto reproducido
Se ejecutó el cuerpo real de `createProduct()` con dependencias simuladas. Cuando `edInventoryQueue` resolvía `false`, la cadena `.then(()=>edSaveSupplierAlias(...))` invocaba el guardado del alias de todas formas. Se observó una llamada al alias con sincronización fallida.

## Corrección
La cadena verifica `synced===true` antes de llamar `edSaveSupplierAlias`; en caso contrario informa que el alias no se confirmó.

## Pruebas posteriores (4/4 PASS)
- Inventario exitoso y asociaciones exitosas: asociación y alias invocados.
- Inventario fallido y asociaciones exitosas: asociación invocada, alias omitido, advertencia.
- Inventario exitoso y asociaciones fallidas: alias invocado, advertencia de asociación.
- Ambos fallidos: alias omitido, dos advertencias.

## Pendientes explícitos
La asociación local todavía se intenta antes de confirmar el inventario remoto en `createProduct()`. El caso inventario fallido/asociación exitosa **no es atómico**; la recuperación y reconciliación siguen **PENDIENTE**. Reintentos idempotentes y fallo parcial de `edSaveSupplierAlias` requieren pruebas adicionales. No se ejecutó navegador ni servicio remoto. No se activó ninguna operación real.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral reservada para autorización previa.
