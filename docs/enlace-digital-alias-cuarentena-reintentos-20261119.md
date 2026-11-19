# Alias privado y recuperación de cuarentena — 2026-11-19

Base: `7b9fa513e91a8bb067045a634a9e2433478e73bc`. Corrección: `375803edf151559124e1ce9689660b1ffed93a4e`.

## Alias: timeout tras commit simulado
Se ejecutó la función real `edSaveSupplierAlias()` con una API ficticia: el primer `POST` persistió `producto_id=42`, `alias=Mayorista` y luego lanzó timeout; el segundo `POST` tuvo éxito. Ambas solicitudes usaron `on_conflict=producto_id` y `Prefer: resolution=merge-duplicates,return=minimal`. El almacenamiento ficticio terminó con **un solo registro**. No se modificó la función. Compatibilidad con restricciones y permisos reales: **PENDIENTE**.

## Defecto reproducido de recuperación
Se ejecutó la función real `edDeliveryRecoverQuarantine()` con almacenamiento ficticio. Una implementación de `removeItem` que retornaba sin eliminar la clave provocaba anteriormente `true` y sesión desbloqueada pese a mantener la cuarentena persistida. Se añadió verificación mediante `getItem` antes de desactivar cuarentena de sesión.

## Pruebas posteriores (2/2 PASS)
1. Eliminación silenciosamente fallida: devuelve `false`, mantiene cuarentena persistida y en sesión.
2. Eliminación correcta: devuelve `true` y desactiva cuarentena en sesión.

## Límites
No se verificó compatibilidad real de upsert, concurrencia, idempotencia de fotos, fallos parciales de escritura remota, recuperación tras recarga del navegador ni la batería integral. **PENDIENTE**. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
