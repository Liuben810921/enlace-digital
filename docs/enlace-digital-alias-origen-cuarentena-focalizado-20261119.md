# Coherencia de origen, alias y cuarentena — 2026-11-19

Base verificada: `71aed3708755a8f69528a10899309ae95a2d7da8`, sin commits posteriores al iniciar. No se modificó código operativo porque las pruebas focalizadas no reprodujeron defectos nuevos.

## Pruebas focalizadas (5/5 PASS)
Se extrajeron funciones reales de `index.html` y se ejecutaron con dependencias ficticias, sin servicios remotos.

1. Producto 7 tipo proveedor con asociación a almacén propio: `edDeliveryRecoverQuarantine` devuelve `false`; cuarentena activa, cero invalidaciones.
2. Producto proveedor asociado a almacén proveedor activo: recuperación `true`; cuarentena retirada, una invalidación.
3. Producto propio asociado a almacén propio activo: recuperación `true`; cuarentena retirada, una invalidación.
4. Eliminación silenciosamente fallida de marca de cuarentena: recuperación `false`; bloqueo persistente; revisión invalidada una vez, sin permitir uso de cotización anterior.
5. `edSaveSupplierAlias`: dos escrituras consecutivas para producto 7, primera aplicada en almacenamiento remoto ficticio pero con timeout simulado, segunda confirmada. Estados `rejected/fulfilled`, llamadas `Anterior, Nuevo`, alias final `Nuevo`.

## Límites y PENDIENTE
No se probó un flujo transaccional completo entre inventario, alias y asociaciones, ni recuperación tras reinicio real, ni concurrencia entre pestañas/dispositivos, ni durabilidad/seguridad de servicios reales. Una confirmación parcial puede exigir reconciliación manual. La batería integral requiere autorización previa.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
