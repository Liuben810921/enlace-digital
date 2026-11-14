# Cierre de consistencia móvil: recuperación explícita — 14 noviembre 2026

## CI verificada
- [#43633369189](https://github.com/Liuben810921/enlace-digital/actions/runs/43633369189) **success**: cuarentena de asociaciones locales y recuperación tras fallo de rollback, junto con pruebas anteriores de selección efectiva, proveedores e invalidación.

## Corrección de interfaz y seguridad
- La recuperación ya **no se ejecuta implícitamente** al guardar un producto: una cuarentena impide nuevas asociaciones hasta la intervención explícita del administrador.
- `edDeliveryOriginsPanel` muestra aviso visible `role=alert` y botón «Verificar y desbloquear» para que el administrador inspeccione proveedores y almacenes antes de intentar recuperación.
- `edDeliveryQuarantineRecoverFromPanel` ejecuta la comprobación existente, informa si el desbloqueo tuvo éxito o sigue bloqueado, e invalida versiones previas antes de permitir guardar.
- La regresión `tests/delivery-mobile-quarantine.test.cjs` exige que guardar permanezca bloqueado antes de la recuperación explícita y comprueba el aviso del panel.
- [CI #43633622571](https://github.com/Liuben810921/enlace-digital/actions/runs/43633622571) pendiente de verificación final.

## Restricciones
DOM sintético: no se realizó prueba manual en teléfono. El almacenamiento del navegador no equivale a transacciones de servidor ni autoriza cotizaciones reales. No se modificaron Supabase, staging, producción, clientes, pedidos ni servicios. Rutas viales reales siguen pendientes de verificación.
