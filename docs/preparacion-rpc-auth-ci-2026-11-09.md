# Estado de preparación de RPC, reversión y validación TypeScript — 2026-11-09

## Archivos
- `sql/propuestas/staging_auth_rpc_borrador_no_ejecutar.sql`: cinco RPC `SECURITY DEFINER` con `search_path=''`, grants restringidos a `service_role`. **Borrador, no listo para ejecutar**.
- `.github/workflows/staging-auth-static-check.yml`: `deno check` y aserciones estáticas, permisos `contents:read`, sin secretos ni conexión a Supabase.
- `sql/pruebas/plan_registro_sesiones_rollback_no_ejecutar.sql`: lista de aserciones y aislamiento; no es todavía una batería ejecutable.

## Reversión propuesta
Antes de cualquier despliegue futuro: obtener definiciones originales y esquema de staging, tomar snapshot de catálogo y datos, guardar hashes de funciones y grants. La reversión del DDL debe hacerse mediante migración inversa revisada; **no** borrar columnas o tablas con datos. La ejecución de pruebas debe ser una única transacción `BEGIN ... ROLLBACK` y luego SELECT de conteos y flags. No hay migración aplicada en este trabajo.

## Riesgos y bloqueos
1. La propuesta anterior de esquema debe revisarse junto a este borrador; staging todavía carece de columnas y secuencia `clientes_oficiales_numero_seq` necesarias.
2. El contrato de la función de login y de `profile` debe verificarse frente al JSON que espera la Edge Function, especialmente claves de `cliente_numero`, dirección y estados.
3. Las RPC `SECURITY DEFINER` exigen revisión de propietarios, `search_path`, permisos de esquemas y prevención de ejecución pública; el control de propietario de destinatarios está en Edge Function con `service_role`.
4. `deno check` puede descargar dependencias de `esm.sh` para resolver tipos. El workflow no contiene credenciales ni llamadas a producción, pero **no es un runner totalmente sin red**. Si se exige aislamiento de red total, usar dependencias vendorizadas y runner restringido.
5. La ejecución de GitHub Actions para el commit del workflow no estaba disponible al consultar inmediatamente después de crearlo. No se afirma que la compilación haya pasado.
6. Falta preparar SQL de pruebas ejecutable tras reconciliar todos los contratos. No autorizar despliegue todavía.

## Estado
Solo cambios en GitHub, rama `audit/registro-staging-aislado-20261109`. Sin SQL de escritura, sin Edge Functions desplegadas, sin producción ni merges.
