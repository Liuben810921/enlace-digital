# Auditoría: cruce exacto de tarifa mínima y coste por distancia — 13 noviembre 2026

## Control de concurrencia
HEAD inicial de la rama aislada `audit/delivery-map-readonly-20261113` idéntico a `955e9e4ad1f11bb8f81edb2fb48f7de759944273`. No se detectaron cambios concurrentes.

## Riesgo
El cobro por mensajería debe tomar el máximo entre el cálculo por distancia y la tarifa mínima, sin errores de un CUP al cruzar el punto de igualdad.

## Regresión reproducible
En PostgreSQL 16 desechable, se calcula el importe sintético de `cart-a` y se fija temporalmente `min_fee_cup` en exactamente un CUP menos, igual y un CUP más que ese importe. Se exige que cada cotización corresponda a `max(coste_por_distancia, min_fee_cup)` y se restaura el mínimo original en `finally`. Las claves de idempotencia son distintas para cada caso. Commit de pruebas `0afda8f23ab5a6ac73c043422163d5c78434c8e5`.

## Criterio de cierre
Si CI pasa, cerrar sin modificar SQL; si falla, examinar logs y corregir únicamente el defecto demostrado.

**Estado: pendiente de GitHub Actions.** Sin acceso ni modificaciones a Supabase, staging, producción, clientes reales ni pedidos.
