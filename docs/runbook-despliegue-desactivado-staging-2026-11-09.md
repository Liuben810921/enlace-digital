# Runbook ejecutable condicionado: despliegue inicial Edge staging (NO EJECUTADO)

## Preflight verificado — 2026-11-09
- Base `f6cc8e0a76a665d787b72477a440d384654590d4`: GitHub Actions run `42717086334`, **success**.
- Supabase proyecto `enlace-digital-staging`, referencia `xqahthghvozeigbojhyi`, `ACTIVE_HEALTHY`; Edge Functions `[]`.
- Capturas aportadas: usuario organización Enlace Digital rol Owner; GitHub Pages main/root, HTTPS enforced, sin custom domain; Origin exacto `https://liuben810921.github.io`.
- Archivo propuesto `supabase/config.toml`: `[functions.enlace-cliente-auth-staging] verify_jwt = false`. Registro anónimo requiere que gateway no exija JWT Supabase; el controlador comprueba `apikey` en servidor. No es autorización para aplicar configuración.
- Código `supabase/functions/enlace-cliente-auth-staging/index.ts`: exige `ED_STAGING_CUSTOMER_AUTH_ENABLED === 'true'`, proyecto correcto, service_role, origen exacto y `ED_STAGING_PUBLISHABLE_KEY`; falla con 503 si no está activo. La clave privilegiada permanece solo en servidor.
- Fuente oficial: https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys . Las publishable keys no son JWT; `verify_jwt=false` y validación propia. Para claves nuevas Supabase expone `SUPABASE_PUBLISHABLE_KEYS` como JSON, no necesariamente `ED_STAGING_PUBLISHABLE_KEY` individual: esta última requiere configuración explícita autorizada o una adaptación offline antes de desplegar.

## Operaciones antes de cualquier autorización de despliegue
1. Confirmar mecanismo autorizado para eliminar Edge Function. Rol Owner implica capacidad administrativa general, pero no se ha comprobado borrado efectivo. No existe herramienta conectada `delete_edge_function`. El operador Owner debe confirmar disponibilidad de borrado por panel/CLI oficial y responsabilizarse de reversión. Sin esa confirmación, **no desplegar**.
2. Confirmar que la clave publishable proviene de staging y que se puede suministrar a la función sin mostrarla en chat o GitHub. El backend exige `ED_STAGING_PUBLISHABLE_KEY`; no basta con que exista `SUPABASE_PUBLISHABLE_KEYS`. **No se leyó ni escribió ningún secreto**.
3. Confirmar despliegue con `verify_jwt=false` exclusivamente para esta función y gate `ED_STAGING_CUSTOMER_AUTH_ENABLED` ausente/false. Si existe un valor true, el despliegue podría activar tráfico inmediatamente: **bloquear hasta comprobar**.
4. Confirmar que el despliegue no toca `main/index.html`, funciones existentes, SQL, producción ni costos superiores al plan gratuito.

## Secuencia autorizable futura, NO ejecutar ahora
1. Confirmar por lectura nombre/id del proyecto y listado Edge vacío; verificar CI verde para commit exacto.
2. Revisar source exacto del PR y confirmar secrets/config sin exponer valores; registrar plan de rollback con responsable Owner.
3. Con **autorización específica de creación y configuración**, desplegar solo `enlace-cliente-auth-staging` con gateway `verify_jwt=false`, manteniendo gate false; sin tráfico de clientes ni emails.
4. Verificar por lista que existe solo la función esperada y que POST/OPTIONS devuelve 503 por gate, sin RPC ni clientes de prueba. Registrar metadatos y logs sin exponer secretos.
5. Si falla una condición: detener pruebas y solicitar al operador Owner borrar exclusivamente esa función desde panel/CLI; comprobar que `list_edge_functions` vuelve a vacío. Si no es posible borrarla, mantener gate false y escalar a soporte; **no afirmar rollback completado**.
6. Activación para pruebas HTTP ficticias requiere **otra autorización** tras validar reversión, apikey, CORS y rate limiting. Correo y pedidos reales siguen desactivados.

## Riesgos residuales
- No se ha demostrado permiso efectivo de borrado mediante operación real; Owner es evidencia de rol, no de ejecución.
- No se ha comprobado valor real ni presencia de `ED_STAGING_PUBLISHABLE_KEY` o gate en secretos del proyecto.
- El controlador comparte identificador `unverified-proxy` para rate limit por IP; puede bloquear clientes legítimos en piloto. El token propio en navegador requiere defensa contra XSS.
- Deploy crea un endpoint público inmediatamente; gate false es defensa crítica. `verify_jwt=false` permite llegar al código sin JWT de usuario; CORS no reemplaza controles de acceso.

## Estado
**No listo para ejecutar despliegue hasta confirmar reversión y estado de secrets/gate.** Preparación y runbook listos para revisión. No se desplegó ni se alteró Supabase, roles, configuración, producción, correo ni pedidos reales.
