# G4 Mailpit — batería sintética offline
Fecha 2026-11-11. Solo GitHub Actions, sin Supabase, GoTrue, credenciales, usuarios reales ni producción.

## Cobertura
El script `tests/g4_mailpit_synthetic.py` envía cinco **mensajes completamente sintéticos** a Mailpit mediante SMTP en 127.0.0.1:1025 y verifica que su API local 127.0.0.1:8025 capturó exactamente uno de cada clase: confirmación, recuperación, OTP, invitación y cambio de correo. Todos los destinatarios son `example.invalid` y no son enrutables. El workflow `.github/workflows/g4-mailpit-synthetic-offline.yml` inicia un contenedor desechable sin relay SMTP, expuesto solo a loopback del runner, y no usa secretos ni APIs de Supabase.

Además, el script comprueba por cadenas que el borrador del controlador no incluya llamadas directas conocidas a `auth.signUp`, `resetPasswordForEmail`, `signInWithOtp`, invitaciones, `generateLink`, `updateUser` ni `sendEmail`. Esta comprobación no es análisis de flujo completo y no excluye llamadas indirectas o futuras.

## Limitaciones / criterio
- **No son pruebas reales de GoTrue/Supabase Auth.** Simulan las cinco clases de mensajes; no certifican plantillas, generación de tokens, expiración, permisos, ni efectos externos de Auth.
- El workflow depende de que la imagen pública Mailpit esté disponible para descargar por el runner; no se configura relay ni salida SMTP a Internet. Para garantía de bloqueo de red externo a nivel kernel se requeriría una red de contenedores aislada con política de egress explícita. No atribuir garantía de egress total solo por usar Mailpit.
- Un resultado SUCCESS prueba la captura SMTP local y las guardas estáticas, **no** el aislamiento total de la infraestructura de staging.
- Estado inicial: pendiente de verificación de GitHub Actions después de commit.
- **NO-GO** para registros, correos, cambios o despliegues en staging. GO para esta suite desechable autorizada.
- Reversión: revertir los commits de workflow y script; contenedor CI efímero se descarta automáticamente. No hay cambios que revertir en Supabase.

## Paso siguiente
Inspeccionar ejecución CI y logs; si falla, corregir solo workflow/script y revalidar. Para probar GoTrue real, se necesitaría un entorno Auth local desechable explícitamente aislado, distinto de este simulador SMTP.
