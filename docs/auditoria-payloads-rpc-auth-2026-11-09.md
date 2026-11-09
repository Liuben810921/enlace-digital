# Auditoría de payloads RPC de autenticación — PR #2

Fecha: 2026-11-09. Solo cambios de GitHub, sin acceso de escritura a Supabase.

## Evidencia

- CI del commit inicial `d5ec4007d65872ea8d8a76e67f6a434f18021e8c`: run `42707946503`, success.
- Corrección del controlador `33797e880b7e57845722ed7f1434585bf0099453`: registro e inicio de sesión rechazan respuesta RPC que parezca exitosa pero carezca de `numero` entero seguro y positivo.
- Ampliación de pruebas `cb8ae848e1c5c84778262856ddbc09122b0790a6`: casos de registro con null/objeto vacío/id cero/id string y login con objeto vacío/id cero/id string; respuestas 500 y ningún token en error.
- CI de la ampliación: run `42708231089`, success.

## Contrato y límites

Las funciones SQL propuestas `ed_cliente_registrar_residencia_privado` y `ed_cliente_login_privado` deben devolver objetos con `numero` entero positivo al completar la operación. El controlador ahora verifica este requisito antes de declarar éxito. Estas son pruebas offline con mocks: no certifican persistencia, privilegios, concurrencia ni implementación real de RPC. No se activaron pedidos, correos, Edge Functions ni se modificaron secretos, roles, producción o datos existentes.

El permiso de eliminación de una futura función Edge sigue siendo un requisito exclusivo del despliegue/reversión, sin bloquear el desarrollo y pruebas offline.
