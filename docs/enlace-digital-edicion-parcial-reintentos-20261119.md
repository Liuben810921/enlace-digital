# Edición de productos: confirmaciones parciales y reintentos — 2026-11-19

Base: `96e173bc4405c4e46c8cfbe6e25a646820ce1c37`; HEAD verificado idéntico al iniciar. No se cambió código operativo: no se reprodujo defecto en los casos focalizados.

## Método
Se ejecutó la función real `saveEditedProduct` extraída de `index.html` (con su declaración `async`), sustituyendo exclusivamente DOM, persistencia, cola de inventario, alias y asociaciones por dependencias simuladas. Producto ficticio ID 7, edición de nombre y precio, rol principal. No se accedió a servicios reales.

## Pruebas (5/5 PASS)
1. Alias privado falla después de inventario confirmado: eventos `inventory,alias`; alerta de fallo, editor permanece abierto, botón vuelve a habilitarse; asociaciones no ejecutadas.
2. Asociación falla después de inventario y alias confirmados: eventos `inventory,alias,association`; alerta, editor permanece abierto, botón habilitado.
3. Flujo exitoso: eventos `inventory,alias,association,render,close`; sin alerta, editor cerrado.
4. Primer intento falla en alias; segundo intento: alias ejecutado dos veces, asociación una, cierre solo tras confirmación.
5. Primer intento falla en asociación; segundo intento: alias y asociación se vuelven a intentar, cierre solo tras confirmación.

## PENDIENTE
Persistencia de confirmaciones parciales tras reinicio real; coordinación transaccional entre inventario, alias y almacenes; reintentos concurrentes entre pestañas/dispositivos; coherencia del origen con datos remotos; pruebas integrales sujetas a autorización previa. Los resultados corresponden a funciones reales con dependencias simuladas, no a integración remota.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
