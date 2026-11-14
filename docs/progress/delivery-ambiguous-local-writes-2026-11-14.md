# Auditoría integral de escrituras locales ambiguas — 14 noviembre 2026

## Evidencia confirmada
- [GitHub Actions #43633908857](https://github.com/Liuben810921/enlace-digital/actions/runs/43633908857) **success**: pruebas de proveedores, almacenes, rollback, cuarentena, recuperación, asociaciones e invalidación.
- Inspección de `index.html`: las rutas operativas de alta/edición/estado de proveedores y almacenes pasan por `edDeliveryPersistAndInvalidate`. Se retiró la función auxiliar de escritura directa de almacenes que ya no tenía consumidores.

## Endurecimiento
- En caso de excepción de `localStorage.setItem`, el guardado de proveedores/almacenes vuelve a leer el valor: si difiere del anterior o la lectura falla, declara estado ambiguo y activa cuarentena.
- La asociación de productos aplica la misma comprobación ante errores de escritura.
- La recuperación explícita rechaza asociaciones duplicadas o IDs no textuales además de los almacenes inactivos y proveedores inactivos.
- `tests/delivery-ambiguous-local-write.test.cjs` simula excepción antes y después de escribir, bloqueo del panel, invalidación de cotización y rechazo de recuperación con asociación inconsistente.
- [GitHub Actions #43634105198](https://github.com/Liuben810921/enlace-digital/actions/runs/43634105198) es la ejecución nueva a verificar.

## Limitaciones
Las pruebas usan DOM y almacenamiento simulados, no un navegador Android real. La cuarentena local no ofrece garantías transaccionales o de integridad ante manipulación del navegador. Las cotizaciones comerciales siguen bloqueadas hasta disponer de validación transaccional en servidor y rutas viales verificadas. Ninguna operación en Supabase, staging, producción, clientes, pedidos, correos ni servicios.
