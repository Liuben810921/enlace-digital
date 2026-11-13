# Auditoría: ruta cero sin tarifas mínimas — 13 noviembre 2026

## Alcance y control de concurrencia
La rama aislada `audit/delivery-map-readonly-20261113` coincidía exactamente con `77ff3faf4a00fc90e4fd30cfd74d0f45f7800ccd` antes de la modificación. No se detectaron cambios concurrentes. El primer intento de escribir esta prueba fue bloqueado por la herramienta; en el reintento autorizado se incorporó mediante la operación GitHub habitual.

## Riesgo
Una ruta sintética de 0 km, con `min_km=0` y `min_fee_cup=0`, debe generar `gross=0`, `customer_fee=0` y `promo_coverage=0`, sin aplicar valores mínimos codificados ni importes residuales.

## Prueba reproducible
En el laboratorio PostgreSQL desechable, la prueba versiona la ruta de `cart-a` a distancia cero, desactiva temporalmente ambos mínimos y solicita una cotización con clave nueva. Exige resultado `committed,0,0,0` y replay `replayed,0,0,0`. En `finally` restaura los mínimos y la distancia previa. Commit de pruebas: `a4f50ee3c103b019e6d004e68905ffaf922f6536`.

## Criterio de cierre
Si GitHub Actions aprueba la prueba, cerrar sin modificar SQL. Si falla, revisar logs y corregir únicamente defectos reproducidos, distinguiendo errores del fixture de errores del cotizador.

**Estado: pendiente de CI.** No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
