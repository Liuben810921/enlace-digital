# Validación final offline previa al despliegue — 2026-11-09

## Resultados observados
- Commit `53cc53e37f39e8f661a616bed2cffa9429cbfb23`: GitHub Actions run `42716857779` **success**. El flujo ejecutó Deno typecheck, tests offline del Edge, tests Node del adapter, aislamiento estático y parsing/contratos SQL.
- El controlador requiere `ED_STAGING_CUSTOMER_AUTH_ENABLED=true` para activar tráfico. Por defecto, desactivado (503) y sin inicializar cliente privilegiado.
- Registro anónimo: `verify_jwt=false` propuesto **solo para función staging** en `supabase/config.toml`; el controlador exige clave pública `apikey` de staging antes de RPC, y el registro/login no requieren sesión previa. Esto preserva la compatibilidad funcional del flujo.
- CORS exacto `https://liuben810921.github.io`; rechaza origin diferente antes de RPC. Los clientes sin Origin también requieren apikey, por lo que CORS **no es control de identidad**.
- Tokens de sesión de cliente propios de 64 caracteres, guardados como hash; la clave pública no concede permisos sobre las tablas.
- Límites antiabuso existentes: global 300/min, registro 3/h por IP compartida y 3/d por teléfono, login 20/15min IP compartida y 10/15min por teléfono; fallan cerrados cuando RPC de límites no responde. Riesgo residual: la identidad `unverified-proxy` compartida puede bloquear a usuarios legítimos; antes de habilitar uso público, configurar atribución IP confiable o un límite adaptado, sin confiar en encabezados proporcionados por el cliente.
- Las pruebas son offline; no prueban aún la disponibilidad real del gateway HTTP ni la capacidad empírica de eliminación. El usuario acreditó Owner, que según documentación oficial tiene gestión completa, pero no se ejecutó Delete.

## Mejora de cobertura CI
- Se añadió `supabase/config.toml` a los paths de push/PR y comprobaciones estáticas de `verify_jwt=false`, origen exacto y apikey para evitar que cambios de seguridad pasen sin CI.

## Decisión de despliegue
- **Todavía no desplegar automáticamente.** Falta autorización específica para crear función staging, y autorización independiente para configurar clave pública/secretos. El rol Owner respalda la reversión, pero debe confirmarse la ruta efectiva de borrado en el panel cuando exista función.
- Procedimiento futuro: comprobar proyecto `xqahthghvozeigbojhyi`; desplegar únicamente `enlace-cliente-auth-staging` con gate desactivado; verificar 503 y ausencia de cambios SQL; si es necesario, operador Owner elimina función desde Edge Functions y verifica lista vacía. No aplicar cambios en producción.
- **No se alteró** producción, Supabase, roles, secretos, correos ni pedidos reales.
