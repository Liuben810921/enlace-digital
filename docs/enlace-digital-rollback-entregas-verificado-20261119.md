# Rollback de entregas ante invalidación fallida — 2026-11-19

Base: `c09820bcc4d59f395a23673627259e9345f5e983`. Corrección: `18ae4f108d4795d63fa283eb3a98ee81cf846722`.

## Defecto reproducido
Se ejecutó la función real `edDeliveryPersistAndInvalidate()` con almacenamiento ficticio. Configuración anterior `[\"old\"]`; se escribió `[\"new\"]` y la invalidación devolvió `null`. El intento de restauración anterior retornó sin escribir. Antes de corregir: resultado `false`, configuración nueva persistida y cuarentena **desactivada**.

## Corrección
Después de intentar restaurar el valor previo se verifica con `localStorage.getItem(key)`. Si no coincide, se activa cuarentena; también se activa ante excepción.

## Pruebas posteriores (2/2 PASS)
- Restauración silenciosamente fallida: resultado `false`, configuración nueva persistida, cuarentena **activada**.
- Restauración correcta: resultado `false`, configuración anterior restaurada, cuarentena **desactivada**.

## PENDIENTE
Persistencia tras reinicio real, confirmaciones parciales remotas de inventario y alias, recuperación automática de asociaciones y coherencia entre módulos; no se afirma que el rollback sea una transacción global. Batería integral reservada para autorización previa.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
