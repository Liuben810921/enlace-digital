# Auditoría estática del controlador de consumo de tokens de correo

Fecha: 2026-11-12. Solo lectura de GitHub y metadatos SQL de staging; no se han desplegado Edge Functions.

## Evidencia del código
- `supabase/functions/enlace-correo-flujos/index.ts`: `action=request` devuelve 503 sin emitir tokens; `action=status` informa que no está disponible. En `action=consume`, se comprueba token hexadecimal de 64 caracteres, longitud de contraseña de 8–128 caracteres, se invoca `ed_cliente_limite_privado` con máximo **10** solicitudes en **900 s** y después `ed_correo_consumir_token_servicio`.
- La clave de rate limiting se deriva de SHA-256 de IP obtenida de `cf-connecting-ip` o `x-forwarded-for`; requiere revisar confianza de cabeceras en el despliegue, pues un cliente podría falsificar cabeceras si el gateway no las elimina o reemplaza.
- `supabase/functions/enlace-correo-staging/index.ts` implementa un **mock local** que incrementa `stored.attempts` y aplica 5 intentos. Ese mock NO demuestra que la tabla real incremente `intentos`.
- `supabase/functions/enlace-correo-https-preparacion/index.ts` contiene `SEND_ENABLED_IN_CODE=false`; no habilita envíos.

## Conclusión
Hay una protección de solicitudes de 10/15 min en el borrador de controlador, pero **no se encontró actualización del contador de cinco intentos por token** en la función SQL real, triggers o funciones SQL que referencian la tabla. La eficacia del límite por IP depende de un gateway confiable y de que el controlador esté desplegado y sea el usado realmente. El consumo de correo permanece deshabilitado por configuración en staging.

## Próximo trabajo seguro
Diseñar y probar en PostgreSQL desechable un contador atómico por token y su política de bloqueo. No aplicar a staging sin autorización específica. Revisar la validación UTF-8 del controlador (actualmente solo cuenta caracteres JavaScript, mientras SQL ya impone 72 bytes). No modificar código operativo sin permiso.
