# Auditoría de atribución de cambios globales de almacenes — 13 noviembre 2026

## Hallazgo comprobado por inspección SQL
`ed_rpc_lab.mutate_context` aceptaba un parámetro `p_cart` incluso en la rama `p_kind='warehouse'`, que representa un cambio global sin cesta concreta. Al final de la función, `context_audit` registraba incondicionalmente `p_cart`. Un administrador podía provocar que una modificación global de almacenes apareciera asociada a una cesta arbitraria en el historial, afectando la fidelidad de la auditoría.

## Corrección
La inserción de `context_audit` utiliza `CASE WHEN p_kind='warehouse' THEN NULL ELSE p_cart END`. No se modifica el contrato de bloqueo, las políticas RLS, los roles, los privilegios ni las versiones. La modificación es exclusivamente del prototipo PostgreSQL desechable.

## Prueba reproducible
`tests/postgres-delivery-rpc-rls-lab.py` invoca como administrador `mutate_context('warehouse','cart-b',version_actual,NULL)` y comprueba:
1. Incremento exactamente unitario de la versión de almacenes.
2. Último evento de auditoría con `change_kind='warehouse'`, `cart_id IS NULL` y versiones correctas.
3. Incremento exactamente unitario del número de eventos de auditoría.

## Evidencia
- Corrección SQL: [c3030cd11d0274eba6bc357dbc6bd89816d8d9dd](https://github.com/Liuben810921/enlace-digital/commit/c3030cd11d0274eba6bc357dbc6bd89816d8d9dd).
- Prueba: [1a847106b70a0188793a49c98e9259882ca326b9](https://github.com/Liuben810921/enlace-digital/commit/1a847106b70a0188793a49c98e9259882ca326b9).
- [GitHub Actions #43512075820](https://github.com/Liuben810921/enlace-digital/actions/runs/43512075820): en ejecución en primera consulta.
- [GitHub Actions #43512094716](https://github.com/Liuben810921/enlace-digital/actions/runs/43512094716): en cola en primera consulta.

**CI pendiente:** esta fase no puede declararse aprobada hasta confirmar el resultado de la ejecución que incluye la prueba nueva. Ningún despliegue ni fusión. No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.
