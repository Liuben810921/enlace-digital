# Ampliación de pruebas offline — perfil, direcciones y sesiones

Proyecto ENLACE DIGITAL, PR #2, staging `xqahthghvozeigbojhyi`.

## Evidencia CI

- Commit inicial `fc98238e3f2985fa973eb7472d23ccc5b6679ba6`: GitHub Actions `42706728571`, `success`.
- Commit de pruebas `0ef2a57132e45ada9f5b6e76e9ad76cf077dd86e`: GitHub Actions `42706902485`, `success`.

## Cobertura incorporada

Cinco tests Deno en `tests/edge_auth_mock_test.ts`: (1) fallos de lectura de destinatarios o direcciones en perfil, respuesta 500 sin exposición parcial y filtros de propietario; (2) fallo de lookup de dirección, sin inserción; (3) fallo de actualización de dirección deduplicada, con `id` y `cliente_numero` obligatorios; (4) revocación/replay simulado en logout, perfil, destinatarios y direcciones; (5) error de RPC de sesión en session/logout/profile, respuesta 500 sin cliente.

## Límites y trabajo seguro pendiente

Pruebas offline de handler con cliente Supabase simulado: **no** demuestran RLS real, concurrencia, permisos de producción, persistencia ni expiración efectiva de tokens. Mantener pendiente una autorización separada para integración. Verificar posteriormente manejo de rate limits distribuidos, validaciones de tipos complejos y paginación, sin introducir escrituras en Supabase.

La comprobación de permisos para eliminar una futura Edge Function es una puerta **exclusiva de despliegue**, no un bloqueo de desarrollo offline. Ninguna función fue desplegada ni activada; no se modificaron secretos, roles, correos, pedidos reales, producción, productos, departamentos ni administradores.
