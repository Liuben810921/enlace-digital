# Auditoría de solo lectura: recuperación de contraseña y correo — staging

Fecha: 2026-11-12. Proyecto: `xqahthghvozeigbojhyi`. Consultas exclusivamente de metadatos y configuración; sin leer datos de clientes, contraseñas, tokens o sesiones reales.

## Funciones revisadas
- `enlace_auth.ed_emitir_token_correo_privado`: valida propósito, hash de 64 hex, coincidencia teléfono/correo y sesión para verificación; requiere correo verificado para recuperación; cooldown de 10 minutos considera tokens consumidos; invalida pendientes anteriores; emite recuperación 20 minutos y verificación 24 horas.
- `enlace_auth.ed_consumir_token_correo_privado`: rechaza hash inválido, token consumido, expirado o con `intentos >= 5`; usa `FOR UPDATE`; recuperación exige correo verificado, actualiza bcrypt, revoca sesiones y consume tokens; incluye guard `octet_length(p_password_nueva)>72`.
- Wrappers `public.ed_correo_emitir_token_servicio` y `public.ed_correo_consumir_token_servicio` delegan en las funciones privadas.

## Permisos y RLS
Las cuatro funciones son ejecutables por `service_role` pero no por `anon` ni `authenticated`. Las dos funciones privadas son `SECURITY DEFINER` con `search_path=''`. Las tablas `cliente_correo_tokens`, `cliente_credenciales`, `cliente_sesiones`, `configuracion_correo` y `solicitudes_limite` tienen RLS habilitado, cero políticas y sin privilegio SELECT para roles públicos. El modelo exige revisar siempre las funciones privilegiadas y la capa de servicio, no solo RLS.

## Estado de correo (lectura sin revelar remitente)
Fila `principal`: `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`. Los campos proveedor y remitente están poblados, pero eso NO implica integración SMTP operativa. No se activó ningún correo.

## Límites y observaciones
- El límite `intentos<5` se comprueba al consumir; **esta función no incrementa `intentos` al fallar**. Debe localizarse y verificarse la ruta responsable de incrementar intentos o documentar el control como no demostrado.
- No se ha probado recuperación exitosa con token real ni revocación efectiva de sesiones; requieren fixture sintética o autorización específica para datos de prueba en staging.
- Con correo desactivado, los flujos de emisión/consumo devuelven falso por diseño. No interpretar esto como fallo de autenticación.
- La auditoría de definiciones no prueba que el controlador/Edge Function invoque correctamente los wrappers, ni que rate limiting externo esté activo.

## Próximas pruebas autorizadas
Ampliar el prototipo aislado en GitHub para verificar cooldown, expiración, replay, cinco intentos y concurrencia; consultar únicamente metadatos y código de controladores sin ejecutar mutaciones en staging.
