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

## Incidencia de integración CI y corrección — 13 noviembre 2026

- Run [#43512075820](https://github.com/Liuben810921/enlace-digital/actions/runs/43512075820), commit `c3030cd11d0274eba6bc357dbc6bd89816d8d9dd`: `completed/success`.
- Run [#43512094716](https://github.com/Liuben810921/enlace-digital/actions/runs/43512094716), commit `1a847106b70a0188793a49c98e9259882ca326b9`: `completed/failure`. Log del trabajo `132184627259`: `tests/postgres-delivery-context-races-lab.py`, línea 58, `psycopg.errors.SerializationFailure: stale_route`.
- **Causa comprobada:** la nueva prueba de atribución incrementa la versión global de almacenes, invalidando intencionalmente la ruta sintética; la batería de carreras que corre después asume una ruta válida. El fallo es de aislamiento/secuenciación de fixtures, no de privilegios.
- **Corrección limitada:** [commit ba0030c318350877ca4ab2689f6f2db44c06ea58](https://github.com/Liuben810921/enlace-digital/commit/ba0030c318350877ca4ab2689f6f2db44c06ea58). La prueba actualiza la ruta sintética mediante la RPC administrativa existente al concluir la comprobación de almacenes. No altera SQL, permisos, RLS ni lógica operativa.
- **Nueva CI:** [#43513419881](https://github.com/Liuben810921/enlace-digital/actions/runs/43513419881), en cola en la consulta inicial. **Cierre pendiente de `completed/success`.**

El alcance sigue limitado a GitHub y PostgreSQL desechable, sin Supabase, staging, producción, clientes reales ni pedidos.

## Cierre definitivo verificado — 13 noviembre 2026

La ejecución de recuperación [GitHub Actions #43513419881](https://github.com/Liuben810921/enlace-digital/actions/runs/43513419881) sobre el commit `ba0030c318350877ca4ab2689f6f2db44c06ea58` finalizó `completed/success`. El trabajo `test` (ID `132189148497`) también finalizó `completed/success`.

La ejecución aprobada incluye la prueba de atribución global de almacenes (`cart_id IS NULL`), su verificación de versiones y auditoría, y el restablecimiento controlado de la coherencia de ruta sintética antes de la batería de carreras. El fallo previo `stale_route` de la ejecución #43512094716 queda resuelto. La corrección SQL inicial había superado por separado la ejecución #43512075820 (`completed/success`).

**Dictamen:** auditoría de atribución de almacenes cerrada satisfactoriamente para el laboratorio PostgreSQL desechable. Este commit de cierre es exclusivamente documental y no requiere ejecutar de nuevo las pruebas. No implica despliegue, fusión ni validación de staging o producción.

**Restricciones cumplidas:** solo rama aislada GitHub; sin acceso ni modificación de Supabase, staging, producción, clientes reales ni pedidos.
