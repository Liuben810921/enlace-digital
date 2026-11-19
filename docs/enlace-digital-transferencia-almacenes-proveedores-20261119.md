# Transferencia de almacenes entre proveedores — 2026-11-19

Base: cfcbe7414bb7a52aeea57e4a85d2c564d8357bf8.
Implementación: 8a919c8519f9b1b5564fece8007114f309885784.
Corrección de presentación: 27c82c5e3a981396f15f85fc80b5be73b969650a.

## Cambio operativo
Desde la ficha de proveedor se ofrece **Transferir almacenes**. El administrador elige un proveedor destino activo mediante su ID y confirma el número de almacenes afectados. Se cambia únicamente supplierId de los almacenes del proveedor origen. No se eliminan proveedores ni se modifican asociaciones de productos.

## Reglas de seguridad
- Rechaza cuarentena, proveedor inexistente, ausencia de destino activo o ausencia de almacenes.
- Rechaza estructuras de asociaciones no verificables y **cualquier producto asociado** a los almacenes que se transferirían. Antes debe usarse la operación ya existente de reasignación o desvinculación de productos.
- Tras la confirmación vuelve a leer proveedores, almacenes y asociaciones y cancela ante diferencias detectadas.
- Utiliza el guardado verificado e invalidación de cotizaciones existente; ante error, conserva el mecanismo de reversión y cuarentena.
- Limitación: la comparación de instantáneas y el almacenamiento local no proporcionan transacciones entre navegadores o administradores.

## Verificación focalizada realizada
- Se leyó de nuevo index.html desde la rama después del commit: el botón y la función están presentes.
- Se comprobó la presencia de las guardas de cuarentena, asociaciones y cambios intermedios, y la llamada al guardado verificado.
- Se corrigió el formato de los saltos de línea en la selección de proveedor.
- **PENDIENTE:** ejecución dinámica con navegador, pruebas de interacción móvil, carreras entre pestañas y batería integral. No se declara PASS funcional sin ejecución.

## Restricciones
Solo GitHub en rama aislada. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. La batería integral requiere autorización independiente.
