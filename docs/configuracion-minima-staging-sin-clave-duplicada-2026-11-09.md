# Configuración mínima de Edge staging — 2026-11-09

## Evidencia
- Captura inicial del Owner: proyecto `enlace-digital-staging`, sin custom secrets. Captura posterior: se ven exactamente los dos nombres autorizados guardados; los valores ocultos no se pueden comprobar visualmente.
- Consulta de solo lectura: staging tiene una clave `default` moderna `sb_publishable_` activa; no se documenta su valor.
- Documentación oficial https://supabase.com/docs/guides/functions/secrets y https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys : Supabase inyecta `SUPABASE_PUBLISHABLE_KEYS` como JSON de claves por nombre.
- Código actualizado: obtiene `JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}').default`, comprueba prefijo y exige `apikey` idéntica antes de RPC. En caso de ausencia, JSON inválido o clave no moderna, falla cerrado con 503. No se duplica la clave en `ED_STAGING_PUBLISHABLE_KEY`.

## Únicas variables personalizadas registradas por el Owner (nombres verificados)
1. `ED_STAGING_CUSTOMER_AUTH_ENABLED` = `false`. Interruptor de seguridad obligatorio; **no habilitar**.
2. `ED_STAGING_ALLOWED_ORIGIN` = `https://liuben810921.github.io`. HTTPS exacto, sin ruta, sin barra final.

## Requisitos adicionales para despliegue posterior
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_PUBLISHABLE_KEYS` son variables predeterminadas administradas por Supabase; comprobar su presencia sin revelar contenido. El servicio privilegiado nunca se envía al navegador.
- Gateway `verify_jwt=false` solo en función `enlace-cliente-auth-staging` para registro anónimo; autenticación propia por apikey + token de cliente en RPC. CORS no autentica.
- La Edge Function no está desplegada. El Owner puede gestionar recursos, pero el permiso de eliminación no ha sido probado mediante una eliminación real; el conector actual carece de Delete. Mantener plan de reversión manual mediante panel/CLI oficial y verificar lista vacía después.
- Riesgo: al guardar variables personalizadas se modificará el entorno del proyecto staging, potencialmente compartido por futuras funciones; usar nombres exclusivos y no alterar variables por defecto. Con el gate `false` el handler debe devolver 503 incluso si se desplegara, pero el deploy requiere autorización separada.
- Reversión de configuración: retirar únicamente las dos variables personalizadas si fuese necesario, tras comprobar que no existen consumidores; confirmar por lista que ya no aparecen. No borrar secretos por defecto ni claves del proyecto.

## Estado posterior a configuración
El Owner guardó las dos variables mediante Dashboard y aportó captura de sus nombres. No se han verificado sus valores ocultos por lectura administrativa. La consulta de solo lectura de Edge Functions devolvió lista vacía. El despliegue y la activación requieren autorización nueva; no se autoriza SQL, correos, pedidos reales, producción, roles ni cambio de claves.
