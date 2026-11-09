# Auditoría de seguridad en staging — 2026-11-09

Proyecto exclusivo: `xqahthghvozeigbojhyi`. No se modificó producción.

## Hallazgo verificado
Las dos funciones privadas `enlace_auth.ed_emitir_token_correo_privado` y `enlace_auth.ed_consumir_token_correo_privado` tenían `EXECUTE` concedido a `anon` y `authenticated`, aunque el acceso al esquema estaba restringido. Permiso redundante y potencialmente peligroso ante futuros cambios de USAGE del esquema.

## Corrección aplicada y verificada
Migración Supabase staging `revoke_private_mail_function_execution`: revocación de `EXECUTE` para `PUBLIC`, `anon` y `authenticated` en ambas funciones, conservando `service_role`. Consulta posterior confirma para cada una: `anon=false`, `authenticated=false`, `service_role=true`.

## Otras comprobaciones
- Una sola migración de harness antes de esta corrección: `isolated_mail_token_harness`.
- No hay Edge Functions desplegadas en staging; no hay servicio SMTP allí.
- Estado de staging previo: 0 clientes, 0 tokens, 0 sesiones; envíos/verificación/recuperación apagados.
- La prueba integral transaccional de emisión, consumo, caducidad, cooldown y revocación **no se ejecutó**: el entorno bloqueó los intentos anteriores. No se deben presentar como superados.

## Siguiente paso
Ejecutar un banco de pruebas autorizado con reversión y datos ficticios en staging, registrar aserciones verificadas y corregir defectos reales. Revisar también los permisos privados equivalentes en producción antes de una migración independiente, sin activar servicios ni pedidos.
