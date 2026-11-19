# Gestión de dependencias de almacenes: desvinculación y control de cambios — 2026-11-19

Base `58c8edaad13437915b33e7beceb2dbcef56afeea`. Implementaciones: `e359ee6b270c75adf1d0ef526ccb252bc678c001`, `5a7753725ad38a0438a3761ac2a3a55cf477c5d1`.

## Operaciones
1. Reasignación masiva: detecta modificaciones del mapa de asociaciones ocurridas mientras el administrador confirma, cancela sin sobrescribir cambios posteriores.
2. Desvinculación masiva: desde el almacén se pueden quitar todas las asociaciones de productos con ese almacén, sin necesidad de tener un almacén alternativo. Confirma expresamente que algunos productos pueden quedar sin punto de salida. Conserva otros almacenes del producto, comprueba cambios intermedios, verifica persistencia local e invalida el contexto de cotización. En caso de fallo intenta restauración, con cuarentena si no se puede verificar.

## Pruebas focalizadas — PASS
- Reasignación con cambio del mapa durante la confirmación: cero escrituras, conserva cambio concurrente; caso normal: reasigna y escribe una vez.
- Desvinculación con dos productos ficticios, [a] y [a,b]: cancelar = cero escrituras; aceptar = [ ] y [b], una escritura.

## PENDIENTE
La persistencia continúa limitada al navegador. No se han probado integración multiadministrador, interfaz visual móvil, cartografía vial ni tarifas reales. Batería integral reservada para autorización previa. Los productos desvinculados requieren nueva asociación antes de cotizar entregas.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
