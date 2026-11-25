# Auditoría de validación de campos y sesión — staging

PR #2, 2026-11-09. Exclusivamente GitHub; sin escrituras en Supabase.

## Evidencia de CI

- Commit documental previo `d5ec4007d65872ea8d8a76e67f6a434f18021e8c`: run `42707946503`, success.
- Commit de controlador `7345d4f04f9f0cdaec6f3010292aa808dc4f63ff`: run `42708099952`, success.
- Commit de tests `15e5552c0d1e176cecc08291a804fb10a77fbb2c`: sin run visible al momento de la consulta; **no afirmar CI verde para este commit hasta verificarlo**.

## Defecto comprobado por inspección de código

El controlador convertía valores de campos de direcciones y destinatarios con `String(value || '')`, permitiendo que objetos y arrays se transformasen en textos como `[object Object]`. Se añadió `textFields` para rechazar valores no string antes de la conversión en registro, dirección habitual, dirección ocasional y destinatarios. Se conservan campos ausentes o nulos como vacíos, sujetos a las validaciones obligatorias existentes.

Se incorporaron pruebas mock de payloads estructurados inválidos y de respuesta de sesión sin exposición del token. Pendiente de confirmar su ejecución CI en el commit de pruebas.

## Restricciones

Sin despliegue Edge, sin modificación de roles, secretos, producción ni pedidos reales. Los permisos de eliminación siguen pendientes exclusivamente para la fase de despliegue; las pruebas offline continúan independientes.
