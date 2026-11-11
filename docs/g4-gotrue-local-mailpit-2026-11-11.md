# G4 GoTrue local + Mailpit — alcance y evidencia
Fecha: 2026-11-11. Autorizado: GitHub Actions desechable, sin staging ni producción.

## Implementación
- `tests/g4_gotrue_local/compose.yml`: PostgreSQL 17, Supabase GoTrue v2.177.0 y Mailpit v1.27; red Docker `internal: true`; puertos HTTP de Auth y Mailpit solo `127.0.0.1`; SMTP de GoTrue dirigido exclusivamente a `mailpit:1025`. Contraseña de BD y JWT secret son literales ficticios exclusivos del contenedor efímero, no secretos de Supabase.
- `tests/g4_gotrue_local/check_flows.py`: invoca GoTrue **local real** en /signup, /recover, /otp y /invite, verifica exactamente cuatro mensajes capturados por la API local Mailpit. Direcciones `example.invalid`, nunca enrutables. Para /invite se usa JWT de `service_role` firmado con clave ficticia local.
- `.github/workflows/g4-gotrue-mailpit-isolated.yml`: descarga imágenes antes de crear la red interna, comprueba ausencia de ruta IPv4 predeterminada en los contenedores, ejecuta aserciones y destruye volúmenes con `down -v`.
- Los contenedores no están conectados a la red de Supabase alojado. Ninguna variable de entorno real ni secret de GitHub es requerida.

## Límites
- Los cuatro casos comprueban **generación/captura de mensajes**, no canje de enlaces, expiración, rate limits, sesiones, plantillas alojadas ni correos reales.
- El control de ruta IPv4 no prueba ausencia de todos los mecanismos de egress (IPv6, rutas específicas, políticas del host); el aislamiento primario es la red Docker `internal: true`. No prometer aislamiento absoluto hasta verificación de red adicional.
- El flujo de invitación /invite requiere compatibilidad de API/rol con la versión fijada. Si CI falla, revisar logs sanitizados, corregir solo pruebas/workflow.
- La suite anterior `g4-mailpit-synthetic-offline` #1 PASS no prueba GoTrue; esta suite nueva necesita su propio CI.
- No se ha tocado Supabase staging/producción ni código operativo.

## Estado de verificación
Artefactos incorporados a rama `audit/f6b21-identity-idempotency-20261110`. **CI GoTrue pendiente de confirmar**. No atribuir PASS sin job final.

## GO / NO-GO
GO: ejecutar exclusivamente la suite GitHub Actions efímera autorizada.
NO-GO: desplegar GoTrue/Edge en staging, modificar Auth alojado, crear usuarios reales, enviar correo externo, cambiar producción.
Reversión: revertir commits de archivos de pruebas y workflow; los contenedores y volúmenes se eliminan en `always()`.
