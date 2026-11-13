# Auditoría: frontera inclusiva de envío gratuito — 13 noviembre 2026

## HEAD inicial
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con `7c2bf20f4b08427ce5835cab47a62b92e32c0578`. No se detectaron cambios concurrentes.

## Riesgo prioritario
El cotizador `quote_preview` ofrece envío gratuito cuando `subtotal_usd >= free_threshold_usd`. Un error en la frontera de igualdad o en el redondeo de centavos podría cobrar una entrega que debe ser gratuita o regalar una que debe cobrarse. La auditoría comprueba el umbral exacto y un centavo por debajo, incluyendo el replay idempotente.

## Prueba reproducible
En PostgreSQL desechable, el administrador del laboratorio ajusta temporalmente el subtotal sintético de `cart-b` al umbral vigente y después a `umbral - 0.01 USD`, utilizando claves nuevas. Exige `customer_fee=0` exactamente en el umbral y `customer_fee=gross` un centavo por debajo, verifica el replay en el umbral y restaura el subtotal original en un bloque `finally`. No se utiliza ningún cliente ni pedido real. Commit de regresión `6d3594494d5b2e2f60383706a0832da879449c70`.

## Criterio de cierre
Si CI pasa, cerrar sin modificar SQL: no se ha demostrado defecto. Si CI falla, inspeccionar logs y corregir únicamente el fallo reproducido antes de repetir las pruebas.

**Estado: auditoría cerrada; pruebas aprobadas, sin defecto SQL demostrado y sin modificaciones SQL.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.

## Diagnóstico del primer fallo

[GitHub Actions #43528287009](https://github.com/Liuben810921/enlace-digital/actions/runs/43528287009), commit `6d3594494d5b2e2f60383706a0832da879449c70`, trabajo `test` ID `132239353866`, informó `psycopg.errors.SerializationFailure: stale_route` en la línea 352. Una mutación sintética previa del almacén invalidó la ruta de `cart-b`; el ensayo del umbral no llegó a evaluar los importes. Es un defecto de preparación de la prueba, no evidencia de error SQL.

La prueba se corrigió para refrescar la ruta de `cart-b` mediante la RPC versionada, conservando la distancia previa, antes de las cotizaciones del umbral. Commit `0a1f5e4ffce4afe0caf33c6fca42b57dde5d7064`. **No se modificó SQL.** CI posterior completada satisfactoriamente.

## Cierre definitivo — regresión aprobada

[GitHub Actions #43528408150](https://github.com/Liuben810921/enlace-digital/actions/runs/43528408150) terminó `completed/success` sobre el commit `0a1f5e4ffce4afe0caf33c6fca42b57dde5d7064`. El trabajo `test` (ID `132239756037`) terminó `completed/success`.

La prueba comprobó el umbral inclusivo, la frontera de un centavo inferior y el replay idempotente, después de actualizar la ruta sintética invalidada por una prueba anterior. **Dictamen: sin defecto demostrado en el cotizador; auditoría cerrada satisfactoriamente sin modificar SQL.** El cierre solo actualiza documentación y no fusiona ni despliega cambios. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
