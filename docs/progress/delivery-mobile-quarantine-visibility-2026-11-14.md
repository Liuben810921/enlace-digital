# Integración móvil: visibilidad y cuarentena de almacenes — 14-11-2026

## Verificación
- [GitHub Actions #43634105198](https://github.com/Liuben810921/enlace-digital/actions/runs/43634105198) **success**: escritura ambigua, bloqueo y recuperación de datos locales.
- Se revisaron las funciones de asociaciones, proveedores, almacenes efectivos, cambio de proveedor y cotizaciones en `index.html`.

## Ajustes
- `edDeliveryEffectiveOrigins` devuelve lista vacía si hay cuarentena, incluso si persisten asociaciones anteriores.
- `edDeliveryOriginEligible` rechaza cualquier almacén durante cuarentena.
- `edProductOriginsPanel` sustituye los selectores por un aviso visible `role=alert`, con instrucción de ir a Administración de entregas para verificar y desbloquear.
- Cambio de proveedor, alta rápida y recolección de almacenes respetan el bloqueo.
- `tests/delivery-mobile-quarantine-visibility.test.cjs` comprueba el panel simulado, almacenes propios y de proveedor, bloqueo, recuperación explícita, invalidación de cotizaciones anteriores y rechazo de asociaciones inexistentes.
- [CI #43634436458](https://github.com/Liuben810921/enlace-digital/actions/runs/43634436458) pendiente de verificación.

## Alcance
Pruebas funcionales de DOM simulado, **no** captura o validación visual en Android. No se desplegó ni se activaron pedidos. No se accedió a Supabase, staging, producción, clientes reales o servicios. El prototipo de localStorage no garantiza transacciones ni permisos de backend.
