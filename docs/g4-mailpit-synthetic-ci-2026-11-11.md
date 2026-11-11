# G4 Mailpit — batería sintética offline
Fecha 2026-11-11. Solo GitHub Actions, sin Supabase, GoTrue, credenciales, usuarios reales ni producción.

## Cobertura
El script `tests/g4_mailpit_synthetic.py` envía cinco **mensajes completamente sintéticos** a Mailpit mediante SMTP en 127.0.0.1:1025 y verifica que su API local 127.0.0.1:8025 capturó exactamente uno de cada clase: confirmación, recuperación, OTP, invitación y cambio de correo. Todos los destinatarios son `example.invalid` y no son enrutables. El workflow `.github/workflows/g4-mailpit-synthetic-offline.yml` inicia un contenedor desechable sin relay SMTP, expuesto solo a loopback del runner, y no usa secretos ni APIs de Supabase.

Además, el script comprueba por cadenas que el borrador del controlador no incluya llamadas directas conocidas a `auth.signUp`, `resetPasswordForEmail`, `signInWithOtp`, invitaciones, `generateLink`, `updateUser` ni `sendEmail`. Esta comprobación no es análisis de flujo completo y no excluye llamadas indirectas o futuras.

## Limitaciones / criterio
- **No son pruebas reales de GoTrue/Supabase Auth.** Simulan las cinco clases de mensajes; no certifican plantillas, generación de tokens, expiración, permisos, ni efectos externos de Auth.
- El workflow depende de que la imagen pública Mailpit esté disponible para descargar por el runner; no se configura relay ni salida SMTP a Internet. Para garantía de bloqueo de red externo a nivel kernel se requeriría una red de contenedores aislada con política de egress explícita. No atribuir garantía de egress total solo por usar Mailpit.
- Un resultado SUCCESS prueba la captura SMTP local y las guardas estáticas, **no** el aislamiento total de la infraestructura de staging.
- Estado verificado el 2026-11-11: GitHub Actions `g4-mailpit-synthetic-offline` #1, commit `d85fed5`, SUCCESS (indicador verde y duración 15 s en captura del propietario). No se recuperó el log detallado de ese job por el conector; el resultado confirmado corresponde al workflow completo. `staging-edge-draft-security` #42 SUCCESS, verificado por conector en commit documental `89387d8`; `f6b13-isolated-postgres-security` #195 seguía in_progress en esa consulta.
- **NO-GO** para registros, correos, cambios o despliegues en staging. GO para esta suite desechable autorizada.
- Reversión: revertir los commits de workflow y script; contenedor CI efímero se descarta automáticamente. No hay cambios que revertir en Supabase.

## Paso siguiente
CI Mailpit #1 SUCCESS según captura. Siguiente: decidir si se autoriza una suite GoTrue/Auth local aislada y verificable, distinta del simulador SMTP. Para probar GoTrue real, se necesitaría un entorno Auth local desechable explícitamente aislado, distinto de este simulador SMTP.
