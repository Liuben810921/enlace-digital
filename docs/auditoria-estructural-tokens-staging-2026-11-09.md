# Auditoría estructural de tokens — 2026-11-09

**Solo se modificó staging** `xqahthghvozeigbojhyi`. Producción `ubrvuplslconfxwpfzxj` fue consultada únicamente con SELECT.

## Hallazgos y correcciones comprobadas
Comparación de cinco tablas `enlace_auth`: `cliente_credenciales`, `cliente_sesiones`, `cliente_correo_tokens`, `configuracion_correo`, `solicitudes_limite`.

- Las columnas coinciden salvo valores por defecto ausentes en staging para `solicitudes_limite.ventana_inicio` y `cantidad`; restaurados.
- Faltaban seis restricciones CHECK (intentos de token, longitud de hash, intentos fallidos de credenciales, teléfono E.164, correo verificado requiere correo y proveedor válido); restauradas.
- Faltaban tres índices: `cliente_correo_tokens_cliente_idx`, `cliente_sesiones_cliente_idx`, `cliente_sesiones_expira_idx`; creados.
- Las FK de tokens y sesiones hacia credenciales carecían de `ON DELETE CASCADE`; corregidas.
- **Hallazgo de seguridad:** las cinco tablas tenían RLS desactivado y `service_role` tenía SELECT directo en staging, a diferencia de producción. Se habilitó RLS en las cinco y se revocaron los permisos directos de tablas a `service_role`. Consulta posterior confirma para las cinco `rls=true`, `anon_select=false`, `auth_select=false`, `service_select=false`, igual que producción.
- Migraciones aplicadas en staging: `align_mail_harness_constraints_indexes`, `align_mail_harness_rls_and_table_grants`. Ambas respondieron `success=true`.

## Diferencia deliberada pendiente
En producción `cliente_credenciales.cliente_numero` referencia `public.clientes_oficiales(numero)` con `ON DELETE RESTRICT`. Staging es un harness mínimo sin tabla `clientes_oficiales`, así que **esa FK no existe**. No debe declararse paridad completa hasta reproducir de forma segura la tabla padre con su estructura mínima y esa FK, o documentar explícitamente que las pruebas se limitan al subsistema de tokens.

## Pruebas funcionales
No ejecutadas: la operación de prueba transaccional fue bloqueada previamente por controles de ejecución. No se eludieron. Método recomendado: ejecutor autorizado con aislamiento transaccional, rollback garantizado, aserciones, datos ficticios y auditoría. No conectar SMTP ni habilitar envíos persistentes.

## Seguridad operativa
Los tres interruptores permanecen apagados; staging no tiene funciones Edge desplegadas. No se han copiado clientes, contraseñas ni secretos. Producción y pedidos reales permanecen sin cambios.
