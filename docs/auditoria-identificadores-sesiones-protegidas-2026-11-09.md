# Auditoría de identificadores y sesiones en operaciones protegidas

PR #2, 2026-11-09. Solo GitHub.

## CI
- Commit inicial `a29e05263a2062b69161822879ff06c6a79601aa`: run `42709610461`, success.
- Corrección de controlador `dcd31d7c0a41c697e3c555dff214dd723417a30c` y pruebas `2d94d44adfef96c5aa4421350d044729b0c7af9b`: run `42710082132`, success.

## Correcciones
1. `recipient-save`: se rechazan identificadores de tipo string, boolean, array y object, en vez de convertirlos mediante `Number(...)`. Solo enteros seguros positivos en JSON son aceptados.
2. `recipient-save`, `delivery-location-save`, `address-save`: error de RPC de sesión retorna 500, ausencia de sesión retorna 401 y propietario malformado retorna 500, antes de consultar o modificar tablas.

## Evidencia y límites
Dos tests Deno con mocks comprueban entradas y ausencia de consultas/escrituras protegidas. No se validaron permisos RLS reales ni concurrencia. El permiso de eliminación de Edge Functions continúa pendiente exclusivamente para despliegue/reversión. Sin despliegues ni escrituras en Supabase, sin cambios de secretos, roles, producción, datos, correos o pedidos reales.
