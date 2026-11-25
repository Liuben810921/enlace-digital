# Revisión final previa a despliegue inerte — staging (NO desplegado)

Proyecto autorizado exclusivamente: `xqahthghvozeigbojhyi`. PR #2. Código revisado desde commit `f40744f83410372a487f51b8d5335521af1f9770`.

## Verificaciones positivas

- GitHub Actions `42703136069` del commit `f40744f`: **completed/success**.
- Proyecto `enlace-digital-staging` ACTIVE_HEALTHY, PostgreSQL 17.11. Listado de Edge Functions: **vacío**; `enlace-cliente-auth-staging` no existe aún.
- Cinco RPC presentes, `SECURITY DEFINER`, owner `postgres`; ninguna ejecutable por `anon` ni `authenticated`; cuatro externas ejecutables por `service_role`, auxiliar no ejecutable por ese rol.
- `pgcrypto` y RPC `ed_cliente_limite_privado` presentes.
- Consultas de solo lectura: clientes, credenciales, sesiones, destinatarios y direcciones de entrega: **0** cada tabla; secuencia `last_value=2`.
- El borrador Edge exige `ED_STAGING_CUSTOMER_AUTH_ENABLED===true` y host exacto de staging; CORS requiere `ED_STAGING_ALLOWED_ORIGIN` HTTPS explícito; IP forwarding sin confiar en cabeceras externas.

## Bloqueos de verificación antes de autorizar despliegue

1. **No se pudo comprobar por una API de solo lectura disponible el estado actual de los secretos** `ED_STAGING_CUSTOMER_AUTH_ENABLED`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `ED_STAGING_ALLOWED_ORIGIN`. No inferir que la variable de activación está ausente o en false. Debe verificarse por un mecanismo autorizado que revele solo presencia/estado, jamás valores secretos.
2. **El despliegue de una Edge Function crea un endpoint público de inmediato**, aunque el código esté programado para responder 503 cuando la variable de habilitación sea distinta de `true`. Sin comprobación previa del estado de dicha variable no se puede garantizar despliegue inerte.
3. **Reversión no verificada operativamente:** la función no existe, por lo que no hay versión anterior que restaurar; se debe validar una ruta autorizada de eliminación/desactivación de la función recién creada, o documentar un mecanismo seguro equivalente antes del despliegue.
4. **Arranque con configuración incompleta:** el borrador crea el cliente Supabase en inicialización con URL y service key del entorno. Debe comprobarse que las variables requeridas estén presentes y correctas para evitar un error de arranque, sin revelar claves.
5. **JWT y acceso público:** la operación de despliegue requiere seleccionar `verify_jwt`. Las rutas de registro/login requieren decisión explícita sobre la exposición pública y controles antiabuso; no decidirlo implícitamente.

## Decisión

**NO APTO AÚN PARA AUTORIZACIÓN DE DESPLIEGUE INERTE.** Continuar únicamente con revisión/documentación de configuración y reversión de solo lectura; solicitar autorización de despliegue separada solo después de resolver bloqueos. No se ha desplegado, activado ni escrito en Supabase. Producción, pedidos, correos, productos, departamentos y administradores no se modificaron.
