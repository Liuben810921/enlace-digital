# Auditoría: frontera inclusiva de envío gratuito — 13 noviembre 2026

## HEAD inicial
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con `7c2bf20f4b08427ce5835cab47a62b92e32c0578`. No se detectaron cambios concurrentes.

## Riesgo prioritario
El cotizador `quote_preview` ofrece envío gratuito cuando `subtotal_usd >= free_threshold_usd`. Un error en la frontera de igualdad o en el redondeo de centavos podría cobrar una entrega que debe ser gratuita o regalar una que debe cobrarse. La auditoría comprueba el umbral exacto y un centavo por debajo, incluyendo el replay idempotente.

## Prueba reproducible
En PostgreSQL desechable, el administrador del laboratorio ajusta temporalmente el subtotal sintético de `cart-b` al umbral vigente y después a `umbral - 0.01 USD`, utilizando claves nuevas. Exige `customer_fee=0` exactamente en el umbral y `customer_fee=gross` un centavo por debajo, verifica el replay en el umbral y restaura el subtotal original en un bloque `finally`. No se utiliza ningún cliente ni pedido real. Commit de regresión `6d3594494d5b2e2f60383706a0832da879449c70`.

## Criterio de cierre
Si CI pasa, cerrar sin modificar SQL: no se ha demostrado defecto. Si CI falla, inspeccionar logs y corregir únicamente el fallo reproducido antes de repetir las pruebas.

**Estado: pendiente de GitHub Actions.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
