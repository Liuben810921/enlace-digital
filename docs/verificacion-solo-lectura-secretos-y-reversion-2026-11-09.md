# Verificación de secretos y reversión — staging, sin ejecutar cambios

Proyecto: `xqahthghvozeigbojhyi`. Función futura: `enlace-cliente-auth-staging`. **No desplegar ni activar.**

## Evidencia

- GitHub Actions del commit `5eec94eea9fdc40250cbf4dc1152eebf75862c3a`: run `42704325053`, `completed/success`.
- Las acciones Supabase conectadas permiten listar funciones y consultar datos, pero **no** listar secretos Edge ni eliminar funciones. No se intentó leer valores secretos por SQL.
- La documentación oficial de Supabase confirma que `supabase secrets list --project-ref xqahthghvozeigbojhyi` lista la configuración remota y que `supabase functions delete enlace-cliente-auth-staging --project-ref xqahthghvozeigbojhyi` elimina la función del proyecto (operación destructiva **solo documentada**, no ejecutada).
- Fuentes: https://supabase.com/docs/guides/functions/secrets y https://supabase.com/docs/reference/cli/supabase-functions-delete

## Paso de solo lectura pendiente del operador autorizado

1. Abrir **solo** el proyecto `enlace-digital-staging` en Supabase Dashboard, sección Edge Functions > Secrets. No editar ni guardar nada.
2. Verificar `ED_STAGING_CUSTOMER_AUTH_ENABLED`: si está **ausente**, indicar «ausente»; si está presente, no revelar su valor en chat. La mera presencia **no prueba** que sea diferente de `true`. La confirmación inequívoca de que no es `true` debe hacerla un operador autorizado en el panel de secretos, sin compartir el valor.
3. Comprobar presencia de `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (variables reservadas/integradas, no introducir valores). Comprobar si `ED_STAGING_ALLOWED_ORIGIN` está presente; no copiar su valor si no se ha aprobado el origen.
4. Confirmar que el operador cuenta con permisos para eliminar la función desde el Dashboard o la CLI y que acepta la reversión. **No ejecutar** `functions delete` ahora. Si se requiere probar permisos mediante una operación destructiva, detenerse y solicitar autorización separada.
5. Comunicar únicamente estados: proyecto correcto, activación «confirmada desactivada» / «no verificable» / «activa», claves «presentes» / «ausentes» / «no verificables», eliminación «disponible y autorizable» / «no verificada». No compartir capturas con secretos visibles.

## Advertencia de seguridad

`supabase secrets list` demuestra presencia/nombres, pero **no** demuestra que una variable presente tenga valor distinto de `true`. No inferir desactivación a partir del listado. El despliegue crea un endpoint inmediatamente. El borrador Edge está protegido por `verify_jwt=true` como decisión conservadora, pero eso no equivale a verificar la variable de habilitación.

## Decisión

**Bloqueos pendientes:** comprobación inequívoca del estado de `ED_STAGING_CUSTOMER_AUTH_ENABLED` y verificación operativa de permisos de eliminación/reversión en staging. Sin estas pruebas no autorizar despliegue inerte. No se modificaron secretos, funciones, base de datos ni producción.
