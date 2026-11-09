# Informe de seguridad previo al despliegue — ENLACE DIGITAL staging

**Estado: preparación técnica; NO autorizado para despliegue.** Proyecto staging exclusivamente `xqahthghvozeigbojhyi`. PR #2, rama `audit/registro-staging-aislado-20261109`.

## Evidencia verificada

- CI `staging-auth-static-check` del commit `98d1459ba392553b600f317f46bdddab043ab174`: ejecución `42701417373`, resultado `completed/success`. Incluye Deno typecheck, pruebas offline del controlador Edge con cliente Supabase simulado, comprobaciones estáticas y parseo SQL.
- Pruebas offline `tests/edge_auth_mock_test.ts`: registro Cuba/extranjero, validaciones, duplicados, rechazo de contraseña larga, login fallido/correcto y hash de token, errores RPC, fallo cerrado del rate limiter, sesiones sin datos (simulan expiración/revocación), aislamiento de destinatarios por cliente, perfil limitado al propietario, deduplicación de direcciones por propietario, logout, JSON inválido, método GET y tamaño de cuerpo >4096 bytes sin Content-Length.
- El código Edge conserva el interruptor de habilitación explícita `ED_STAGING_CUSTOMER_AUTH_ENABLED===true` y verifica el host exacto del proyecto staging. No se ha desplegado ni activado la función.
- Última comprobación de solo lectura de staging durante esta fase: clientes 0, credenciales 0, sesiones 0, destinatarios 0, direcciones de entrega 0; secuencia de clientes `last_value=2`. No se realizaron escrituras.

## Riesgos y limitaciones pendientes

1. Los mocks validan la lógica del controlador y las llamadas esperadas; **no acreditan** aislamiento real de PostgREST/RLS, resistencia a concurrencia, ni permisos efectivos del despliegue. Se requieren pruebas de integración separadas y autorización expresa.
2. El rate limiting por IP depende de cabeceras del proxy (`cf-connecting-ip`, `x-forwarded-for`), susceptibles de suplantación si no las normaliza un proxy confiable. El límite global añadido es respaldo, no sustituto de esa verificación.
3. El valor CORS está fijado a `https://staging-preview.invalid`, un marcador no operativo. Antes de exponer el endpoint debe aprobarse el origen exacto y comprobarse preflight de navegador.
4. El límite global de 300 peticiones/minuto puede causar bloqueo compartido entre usuarios; comprobar carga esperada y concurrencia, sin modificar límites sin evaluación.
5. La ruta de actualización de dirección habitual devuelve 500 cuando la RPC rechaza la operación; revisar semántica de errores 4xx para solicitudes inválidas. No bloquea las pruebas locales, pero requiere revisión de experiencia de cliente.
6. Las pruebas de expiración/revocación usan respuestas simuladas de la RPC y no verifican caducidad criptográfica o comportamiento real de base de datos. El ensayo SQL transaccional anterior sí comprobó revocación y expiración a nivel SQL, sin traza individual de NOTICE.
7. Antes de pruebas funcionales de integración: plan de datos ficticios y limpieza, permisos del rol de servicio, origen IP, CORS, separación de proyectos, comprobación de que pedidos y correos siguen desactivados. No incluir claves reales en GitHub.

## Recomendación de puerta de aprobación

Mantener el borrador desactivado. Como siguiente etapa, revisar configuración de proxy/CORS y elaborar un procedimiento de despliegue temporal de staging con reversión, sin ejecutarlo. Solicitar nueva autorización específica para cualquier despliegue, activación o prueba que cree/modifique datos. Producción, productos, departamentos, administradores, correos y pedidos reales quedan fuera de alcance.
