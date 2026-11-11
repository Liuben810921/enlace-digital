# G4 — Diseño de aislamiento de correo para staging (sin ejecutar)
Fecha 2026-11-11. Exclusivamente GitHub. Proyecto staging: `xqahthghvozeigbojhyi`. Producción excluida.

## Evidencia verificada
- Capturas administrativas de staging: proveedor Email **ENABLED**; Allow new users to sign up **ON**; Confirm email **ON**; Secure email change **ON**; Secure password change **OFF**; Require current password **OFF**; Phone **DISABLED**.
- Capturas: SMTP personalizado **OFF**; Auth Hooks vacíos. Inventario previo: cero Edge Functions desplegadas.
- Tres banderas de correo propias ENLACE DIGITAL desactivadas. No equivale a desactivar GoTrue/Supabase Auth.
- Documentación oficial (consultada 2026-11-11): SMTP por defecto se usa si Email Provider está enabled y Send Email Hook no existe. Solo entrega a direcciones de miembros del equipo de la organización; los demás destinatarios son rechazados. No es un control universal de ausencia de efectos externos.
  https://supabase.com/docs/guides/auth/auth-smtp
  https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
  https://supabase.com/docs/guides/auth/testing-auth-flows

## Comparación de opciones
| Opción | Ventajas | Limitaciones / riesgos | Recomendación |
|---|---|---|---|
| A. Ensayos de flujos Auth localmente con Supabase CLI + Mailpit | Captura correos sin entrega externa; reproduce confirmación y recuperación; sin escrituras en staging | Local NO reproduce íntegramente configuración, privilegios y gateway alojados; requiere instalación/CI local aislado | **PREFERIDA** para probar correo, por separado de staging |
| B. Pruebas staging solo de aplicación propia sin invocar GoTrue Auth | El controlador borrador usa RPC privadas y sesiones propias; correos propios desactivados; cuentas ficticias sin email | Requiere auditar dependencias y demostrar que ninguna ruta llama Auth signUp/OTP/recovery/invite ni webhook; no prueba email Auth; escrituras y despliegue necesitan permisos distintos | **CONDICIONAL**, solo tras puertas G0–G7 |
| C. Desactivar temporalmente Email Provider o signups en staging | Reduce algunas rutas de alta por correo | No demuestra ausencia de todos los correos administrativos, ni simula comportamiento final; cambio de Auth con riesgo de interferencia | **NO RECOMENDADA** como prueba de aislamiento total |
| D. Send Email Hook de captura sin envío | Puede sustituir SMTP para eventos soportados | Requiere configurar hook, seguridad, endpoint y observabilidad; puede crear efectos y cambios adicionales | **NO-GO** por complejidad y alcance |
| E. Confiar en limitación SMTP predeterminada | Sin cambio de configuración | Aún puede enviar a miembros de organización; no garantiza cero mensajes | **PROHIBIDO como único control** |

## Diseño mínimo propuesto
1. Separar dos suites: **(i) Email Auth local + Mailpit** para confirmación, recuperación, OTP, invitaciones y cambios de email, con buzón de captura y sin red externa; **(ii) Integración de clientes ENLACE DIGITAL en staging**, sin usar flujos de email Auth y sin correos opcionales en fixtures.
2. Primera fase exclusivamente en GitHub: comprobar estáticamente que el borrador de Edge no llama `auth.signUp`, `auth.resetPasswordForEmail`, `auth.signInWithOtp`, `auth.admin.inviteUserByEmail`, `auth.updateUser` ni servicios de correo; inspeccionar dependencias indirectas y RPC, y verificar CI offline. Una búsqueda de cadenas no constituye prueba completa.
3. En cualquier futura ejecución alojada, prohibir correos a direcciones de miembros del equipo, no asignar emails a fixtures, comprobar que las rutas llamadas son exclusivamente las permitidas, y abortar si aparece una ruta de GoTrue/SMTP/HTTP externa.
4. La desactivación de correo propio es una precondición, **no** garantía. Los ajustes actuales Email Provider ON / Confirm email ON se mantienen sin cambios.
5. El controlador Edge permanece sin desplegar; `ED_STAGING_CUSTOMER_AUTH_ENABLED=false` debe permanecer como condición de seguridad. No configurar ni activar en esta etapa.

## Pruebas y criterios GO/NO-GO
- E1: prueba local Mailpit captura confirmación sin salida a SMTP público, con evidencia de red confinada. NOT RUN.
- E2: prueba local Mailpit captura recuperación, OTP, invitación y cambio de correo; no enviar a terceros. NOT RUN.
- E3: revisión estática de dependencias y rutas GoTrue del controlador y RPC. NOT RUN salvo revisión manual documentada.
- E4: validación de que fixtures no incluyen correo ni números telefónicos enrutables, y que todos los destinatarios son sintéticos. NOT RUN.
- E5: control de salida externa de staging y logs sanitizados; no invocar API Auth. NOT RUN.
- E6: limpieza por IDs exactos y reversión de configuración, con permisos independientes. NOT RUN.

**GO** para diseñar y probar exclusivamente en GitHub/CI aislado sin secretos ni red SMTP externa, si se autoriza ejecución CI.
**NO-GO** para desplegar Edge, escribir en staging, invocar GoTrue/Auth, crear cuentas, enviar correos o modificar proveedores sin autorizaciones separadas.

## Reversión y riesgos
- Fase actual: únicamente documento nuevo en rama de auditoría; reversión = revertir commit documental. Ningún estado de Supabase cambia.
- Fase futura de CI aislado: eliminar workflow/fixtures y descartar contenedores efímeros; no utilizar credenciales de staging.
- Fase futura de staging (NO AUTORIZADA): registrar snapshot redactado de valores no secretos y manifiesto privado; rollback específico por cambio aprobado, no restablecer ciegamente; si existe riesgo de correo, detener antes de ejecutar. Nunca asumir rollback transaccional de peticiones HTTP.
- No activar SMTP personalizado, Send Email Hook, Auth Provider ni signup como medida experimental.
- Revisar actualizaciones de Supabase CLI v3: operaciones locales por defecto, pero fijar versión/objetivo y no permitir comandos hosted.

## Próxima decisión
La ruta recomendada es preparar **en GitHub** una prueba de aislamiento de correo local Mailpit/GoTrue, sin tocar staging, y una puerta estática que prohíba rutas GoTrue en el controlador de clientes. Requiere autorización expresa antes de incorporar workflows/ejecutar CI, si el alcance de esta fase se limita al diseño.
