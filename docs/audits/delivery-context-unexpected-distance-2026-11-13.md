# Auditoría: distancia inesperada en mutaciones ajenas a ruta — 13 noviembre 2026

## HEAD inicial
Se verificó que `audit/delivery-map-readonly-20261113` coincidía exactamente con `443e74e99d18ee21cd2c140ac6ea057d6ff523a6`. No se detectaron cambios concurrentes.

## Riesgo
La RPC `ed_rpc_lab.mutate_context` acepta `p_distance numeric DEFAULT NULL` para cuatro tipos de mutación. El valor solo tiene sentido cuando `p_kind='route'`. En los casos `cart`, `destination` y `warehouse`, un `p_distance` no nulo se ignora silenciosamente mientras se incrementa la versión y se inserta un registro de auditoría. El comportamiento podría ocultar una selección incorrecta del tipo de operación. Se exige fallo explícito `22023` sin efectos secundarios.

## Prueba reproducible
Se añadieron pruebas para `cart`, `destination` y `warehouse` con distancia inesperada `5`, verificando `InvalidParameterValue` y ausencia de modificaciones de versiones o auditoría. Commit de regresión `69c8ef22b9eccea06b148d150489a9a7832904ba` en `tests/postgres-delivery-rpc-rls-lab.py`.

## Procedimiento
Primero ejecutar la regresión en GitHub Actions. Corregir SQL exclusivamente si el fallo queda demostrado y repetir las pruebas. Preservar el contrato válido de `warehouse` con identificador de cesta opcional, ya documentado.

**Estado: pendiente de evidencia CI.** Solo GitHub y PostgreSQL desechable; sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
