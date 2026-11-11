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

## CI #5 — resultado verificado (2026-11-11)
- GitHub Actions run [43051277456](https://github.com/Liuben810921/enlace-digital/actions/runs/43051277456), job `gotrue-local` 130628798634: **FAIL**.
- PASS: checkout, pull de imágenes, arranque de contenedores, comprobación fail-closed de contenedores y ausencia de ruta IPv4 predeterminada; limpieza `down -v` PASS.
- FAIL: script `check_flows.py` no logró respuesta de salud porque GoTrue terminó con error fatal de migración: `migrations/20240729123726_add_mfa_phone_config.up.sql` intenta `alter type auth.factor_type add value 'phone'`, pero `auth.factor_type` no existe (SQLSTATE 42704). La creación de esquema `auth` sí corrigió el fallo previo, pero no proporciona un esquema base compatible con la versión GoTrue fijada.
- **Cero flujos funcionales de correo completados**. No se ha demostrado captura GoTrue real, y no debe atribuirse PASS.
- Próxima corrección requiere establecer una línea base de migraciones GoTrue/Postgres reproducible y compatible, preferentemente usando un conjunto oficial de migraciones o imagen inicializada y fijada. **No** inventar el tipo `auth.factor_type` ni saltar migraciones: eso ocultaría errores de compatibilidad y invalidaría el test.
- NO-GO staging y NO-GO para dar por aprobada esta suite. Solo pruebas locales autorizadas.

## CI #11 — GO local verificado (2026-11-11)
- Ejecución GitHub Actions: https://github.com/Liuben810921/enlace-digital/actions/runs/43053303396; job `gotrue-local` 130635981520, **SUCCESS** (todos los pasos de ejecución y limpieza aprobados).
- Logs: `PASS local GoTrue health: v2.177.0`; `PASS local GoTrue confirmation -> one Mailpit message`; `PASS local GoTrue recovery -> one Mailpit message`; `PASS local GoTrue OTP -> one Mailpit message`; `PASS local GoTrue invitation -> one Mailpit message`.
- Verificación de red: `PASS: auth and mailpit running without default IPv4 gateway`; cliente Python ejecutado dentro de la red Docker `internal: true`, con DNS `auth` y `mailpit`; imágenes descargadas antes de crear la red interna. Servicios y volúmenes desechables eliminados mediante `docker compose down -v`.
- Alcance del GO: cuatro solicitudes API de GoTrue local y cuatro mensajes capturados únicamente en Mailpit. No se han comprobado redención de enlaces, caducidad/replay, ni auditoría por paquetes de egress. No se probó Supabase alojado ni se enviaron correos externos.
- Decisión: **GO para G4 básico aislado**; **NO-GO para staging/producción y para declarar cubiertos los controles no ensayados**.

## CI de endurecimiento G4 — resultado verificado (2026-11-11)
- Ejecución https://github.com/Liuben810921/enlace-digital/actions/runs/43056576645; job `gotrue-local` 130647506247, **SUCCESS**.
- Logs: allowlist rechaza URLs externas, imitaciones y loopback; GoTrue v2.177.0 responde; confirmación, recuperación, OTP e invitación producen exactamente un mensaje nuevo en Mailpit **dirigido al destinatario sintético esperado**, distinguiendo mensajes repetidos al mismo correo mediante `ID`.
- Se comprobó que los contenedores auth y Mailpit no tenían gateway IPv4 predeterminado y se ejecutó limpieza `docker compose down -v` con éxito.
- No se ha probado aún redención/caducidad/replay de tokens ni auditoría de paquetes de salida. La aprobación se limita a los flujos de correo sintéticos y el aislamiento comprobado; no implica aprobación de staging ni producción.

## CI de controles JWT — evidencia final (2026-11-11)
- [Run 43059700931](https://github.com/Liuben810921/enlace-digital/actions/runs/43059700931), job 130658578615: **SUCCESS**, incluidos ejecución funcional y limpieza.
- GoTrue v2.177.0, flujos locales de confirmación, recuperación, OTP e invitación: PASS, con cuatro mensajes sintéticos dirigidos a los destinatarios esperados.
- Control de destinos: PASS para dominios externos, parecidos, loopback y puertos internos inválidos.
- Autorización de invitación: PASS al rechazar JWT mal formado, firma modificada y JWT de servicio correctamente firmado pero caducado; ninguno produjo correo.
- Red: contenedores GoTrue/Mailpit y cliente sin gateway IPv4 predeterminado; red Docker `internal: true`. **IPv6 no auditado de forma independiente**.
- **Importante:** el rechazo de un JWT de servicio caducado no prueba caducidad ni consumo único de tokens de confirmación, recuperación o invitación. Estas pruebas siguen pendientes; no declararlas cubiertas.
- No se han modificado Supabase alojado, código operativo ni producción.

## CI verificación negativa de enlaces — evidencia (2026-11-11)
- [Run 43063534632](https://github.com/Liuben810921/enlace-digital/actions/runs/43063534632), job 130672245889: **SUCCESS**, limpieza efímera incluida.
- PASS: tokens `token_hash` sintéticos falsificados para tipos `signup`, `recovery` e `invite` rechazados por GoTrue `POST /verify`; sin `access_token` y sin nuevos mensajes Mailpit.
- PASS: los cuatro flujos SMTP locales y controles previos de JWT inválidos/caducados.
- Límite: esta comprobación negativa **no** equivale a canjear un token auténtico ni demuestra consumo único, replay o caducidad de enlaces; IPv6 y auditoría de egress por paquetes siguen fuera del alcance verificado.
- Próximo bloque: extraer enlaces exclusivamente de Mailpit local y ensayar canje/replay con redirecciones bloqueadas y sin exponer tokens en logs.

## CI canje real y replay de confirmación — verificado (2026-11-11)
- [Run 43091023045](https://github.com/Liuben810921/enlace-digital/actions/runs/43091023045), job 130767792601: **SUCCESS**, incluida destrucción de servicios y volúmenes.
- PASS: extracción del enlace real `signup` desde Mailpit local, primera solicitud de canje aceptada por GoTrue y segundo canje del mismo enlace rechazado.
- Las respuestas HTTP de redirección se inspeccionaron sin seguirlas. No se imprimieron tokens, enlaces completos, ubicaciones de redirección ni sesiones.
- PASS: controles previos de cuatro flujos SMTP, JWT inválidos/caducados y tokens falsificados.
- Limitación: esta prueba no demuestra caducidad temporal de enlaces ni consumo/replay de recuperación e invitación; tampoco verifica por paquetes la ausencia de egress IPv6.
- Decisión: GO para canje y replay de confirmación **solo en GoTrue local desechable**. NO-GO staging y producción.
