# Cierre de auditoría offline del controlador Edge — PR #2

Fecha 2026-11-09. Alcance: GitHub exclusivamente. **Etapa de auditoría offline cerrada para el alcance acordado; no equivale a autorización de despliegue.**

## Evidencia

- CI inicial commit `4e8c88819e8a4d6b7d331dc1de23f62cd3c82146`: run `42710245923`, success.
- Corrección Edge `018bfd7f06de325338e755e24fcab302a436b229`: valida IDs enteros seguros positivos en respuestas de inserción de destinatarios y direcciones, confirma ID de destinatario actualizado, y confirma la actualización de dirección reutilizada mediante `select('id').maybeSingle()` con filtros de ID y cliente.
- Pruebas `dd73b9cf51e9754925e4b5ca39dc2639138b2ca2`: run `42711073882` falló con 42 pruebas correctas y una fixture heredada sin confirmación de update.
- Fixture ajustada `daf9c8c4034dc5a009d9c9a6c8eb05164d17f291`: run `42711182474`, success, 43 tests aprobados.

## Cerrado en pruebas offline

- Contratos de registro, login, sesión y logout cotejados con SQL propuesto; tratamiento de respuestas malformadas y errores de RPC.
- Identificadores y validaciones de destinatarios/direcciones; filtros por propietario en consultas y actualizaciones; pruebas de errores y de no exposición de tokens.
- Límites de solicitudes, CORS y cuerpos JSON inválidos, con mocks del controlador real.

## Pendiente para habilitación (no reabrir auditoría offline sin defecto nuevo)

1. **Integración real en staging**, solo tras autorización específica: migraciones SQL propuestas aún no ejecutadas, verificación de firmas, permisos efectivos, RLS, persistencia, aislamiento entre cuentas y concurrencia con datos ficticios.
2. **Despliegue/reversión Edge**, solo tras autorización específica y confirmación de permisos para eliminar Edge Functions. Este requisito bloquea exclusivamente despliegue, no desarrollo offline.
3. **Compatibilidad de acceso web y JWT**: revisar `verify_jwt` y flujo de registro/login anónimo antes de habilitar; configuración segura de CORS, límites y secretos, sin activarlos todavía.
4. **Aceptación funcional** desde interfaz con datos ficticios, incluyendo residencia cubana/extranjera, destinatarios y direcciones; mantener pedidos reales desactivados.

## Restricciones respetadas

No se desplegaron Edge Functions, no se ejecutó SQL ni hubo escrituras Supabase; sin cambios de secretos, roles, producción, clientes, productos, departamentos, administradores, correos o pedidos reales.
