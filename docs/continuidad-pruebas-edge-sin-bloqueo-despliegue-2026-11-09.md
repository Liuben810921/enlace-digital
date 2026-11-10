# Continuidad de desarrollo Edge sin dependencia de permisos de despliegue

Proyecto ENLACE DIGITAL, PR #2. Staging `xqahthghvozeigbojhyi` permanece sin funciones desplegadas.

## Decisión de alcance

La comprobación de permisos para eliminar una futura Edge Function es una **puerta exclusiva de despliegue/reversión**, no un bloqueo para cambios de código, pruebas offline, análisis de contratos ni documentación en GitHub. Ningún permiso de despliegue se infiere del acceso de lectura a Supabase.

## Ejecución comprobada

- Commit `6f3ae8974275d950be1d05986b0b10083b9ce7ce`: CI `42706174990`, success.
- Commit `4d2f9cc140fedd00c5d1b1e634ad82d4a6891edc`: CI `42706608869`, success.
- `tests/edge_auth_mock_test.ts` amplía cobertura de errores de persistencia en `recipient-save`, `delivery-location-save`, `address-save`, límites de registro, registro extranjero exitoso sin dirección cubana e identificadores inválidos de destinatarios. No se usa red ni base de datos real.

## Riesgos pendientes y próximas pruebas seguras

- Reversión de Edge: permisos de eliminación aún no verificados; **no desplegar**.
- Mocks no prueban RLS real, concurrencia, ni rate limiting distribuido. Mantener estos criterios para una futura integración expresamente autorizada.
- Revisar más adelante manejo de errores en lectura de perfil, errores de lookup de direcciones, expiración/revocación real de sesión y semántica de errores 4xx/5xx.
- Mantener `verify_jwt=true` como opción conservadora del eventual despliegue inerte, sin asumir que registro/login públicos funcionarán hasta definir una arquitectura segura.

No se desplegaron funciones, cambiaron secretos/roles, enviaron correos ni activaron pedidos reales. Producción y datos existentes fuera de alcance.
