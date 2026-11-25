# Auditoría offline de sesiones en operaciones protegidas — ENLACE DIGITAL

Fecha 2026-11-09; PR #2. Sin escrituras en Supabase.

- Commit inicial `a29e05263a2062b69161822879ff06c6a79601aa`: GitHub Actions `42709610461` success.
- Controlador `9992dad351bece91301f101d796d9e6d60899a58`: separa error de RPC de sesión (HTTP 500), sesión caducada (401) y payload de propietario inválido (500) en `address-save`, `recipient-save` y `delivery-location-save`. Evita consultas y escrituras protegidas con propietario inválido.
- Tests `4bf2ea29998acd3fd8b1ab00fcf910055779223e`: casos de error backend, identificador inválido y sesión revocada; GitHub Actions `42709968365`, success.

Los resultados son offline con mocks; no demuestran RLS, revocación persistida, integración ni permisos reales. El permiso de eliminación de Edge Functions permanece como condición exclusiva del despliegue/reversión, sin bloquear el trabajo seguro. No hubo despliegues, cambios de secretos/roles, pedidos reales, correos ni modificaciones de producción o datos.
