# Guía de ejecución autorizada: pruebas SQL de correo en staging

**Preparado, NO ejecutado.** Archivo: `sql/staging_correo_integral_rollback.sql`. Commit inicial: `6d9d36a`.

## Entorno obligatorio
- Únicamente Supabase proyecto **`xqahthghvozeigbojhyi`** (staging). Nunca producción `ubrvuplslconfxwpfzxj`.
- La ejecución debe hacerse con un cliente PostgreSQL autorizado (por ejemplo, `psql` con la conexión de base de datos de staging obtenida desde su panel), sin compartir credenciales por chat, y preferentemente con la opción de detenerse ante el primer error.
- La prueba presupone que las cuatro tablas de clientes/credenciales/tokens/sesiones están vacías y que los tres interruptores de correo están apagados; aborta si no se cumple.
- No desplegar ni conectar SMTP, Edge Functions de correo o proveedores de email. Las direcciones `example.invalid` son ficticias.
- El script empieza con `BEGIN` y termina en **`ROLLBACK`**, sin `COMMIT`. No dividirlo en ejecuciones independientes; una transacción debe mantenerse en una sola sesión de PostgreSQL. Evitar clientes o editores que ejecuten cada sentencia en conexiones separadas o que automaticen commits.
- Antes de ejecutarlo, confirmar el proyecto de destino en el panel; el nombre de la base PostgreSQL por sí solo no identifica inequívocamente el proyecto.
- La transacción incluye una habilitación **temporal no confirmada** de flags para probar las funciones; `ROLLBACK` la deshace. No ejecutar si hay algún canal de envío real conectado, aun en staging.

## Casos cubiertos (18 aserciones)
1. Emisión de verificación con sesión ficticia válida.
2. Cooldown mientras el token sigue pendiente.
3. Consumo de verificación.
4. Marca de correo verificado.
5. Rechazo de repetición del token.
6. Emisión de recuperación.
7. Consumo de recuperación.
8. Revocación de sesión previa.
9. Actualización bcrypt de contraseña.
10. Rechazo de repetición de recuperación.
11. **Cooldown después de consumo**: debe rechazarse una nueva emisión durante 10 minutos. La auditoría estática anticipa **FAIL** en el código actual; no marcar como superado.
12. Emisión de token para prueba de expiración.
13. Rechazo de token caducado.
14–16. Límite de solicitudes: las dos primeras permitidas y tercera rechazada.
17–18. Permisos de ejecución privada denegados a `anon` y `authenticated`.

## Interpretación
La salida `PASS/FAIL` aparece antes del `ROLLBACK`. Una aserción `FAIL` es un defecto o discrepancia por investigar; **no** debe promoverse código a producción. Las aserciones no prueban entrega de correo, interfaz web ni concurrencia real del limitador. El límite por origen depende también de que el servicio construya claves confiables, pendiente de prueba integral.

## Verificación posterior
Tras ejecutar, usar en una **nueva consulta de solo lectura** el SELECT comentado al final del archivo y confirmar 0 clientes, 0 credenciales, 0 tokens, 0 sesiones y tres flags en `false`. Verificar también la tabla `solicitudes_limite` sin registros ficticios. Si alguna condición no se cumple, detener pruebas y revisar.

## Estado y costos
Archivo preparado en GitHub; ninguna prueba dinámica nueva se ha ejecutado por esta guía. No se requiere contratar un servicio adicional para usar un cliente PostgreSQL y el proyecto existente, sujeto a límites de su plan gratuito. Los controles de seguridad que bloquearon intentos anteriores **no deben eludirse**. Si el método de ejecución no está autorizado, no ejecutarlo y solicitar aprobación por el canal correspondiente.
