# Continuidad de pruebas aisladas — 2026-11-12

## Resultados verificables
- La rama `test/password-recovery-72bytes-20261112` contiene el prototipo de contador atómico por token y la ampliación de regresión `73fb551`. La consulta de estados y runs por commit devolvió listas vacías; **no se declara CI aprobado** para esa revisión.
- Se añadió una batería independiente `tests/email_controller_validation_isolated.test.mjs` (commit `4a11ef8`) y su workflow `synthetic-email-controller-validation.yml` (commit `a61a350`). Usa `node --test`, sin servicios externos.
- El borrador de controlador `supabase/functions/enlace-correo-flujos/index.ts` comprueba `password.length` de 8 a 128 caracteres JavaScript, pero no `TextEncoder().encode(password).byteLength <=72`. La función SQL de staging ya tiene ese límite; la diferencia puede causar rechazo tardío y respuestas genéricas.
- El controlador utiliza `cf-connecting-ip` o `x-forwarded-for` para el rate limit; la confianza de estas cabeceras requiere revisión del gateway. No se han modificado las cabeceras ni el código operativo.

## Próximos pasos
1. Confirmar GitHub Actions para ambas baterías; investigar errores si los hay.
2. Proponer una validación de bytes en el controlador como cambio separado, manteniendo la validación de SQL.
3. Probar por vía aislada el límite por token y el rate limit sin modificar staging ni enviar correos.
4. Retomar la interfaz comercial en una rama separada, previa selección de una tarea concreta y límites de modificación.
