# Auditoría estática de funciones de correo en staging — 2026-11-09

Proyecto `xqahthghvozeigbojhyi`. Se inspeccionaron por `pg_get_functiondef` las cinco funciones instaladas; no se modificó producción.

## Comprobaciones estáticas
- Emisión: requiere propósito permitido, token hash hexadecimal de 64 caracteres, correo de hasta 254 caracteres, configuración habilitada, credencial coincidente. Verificación exige sesión vigente y correo aún sin verificar; recuperación exige correo verificado.
- Caducidad al emitir: verificación 24 horas; recuperación 20 minutos.
- Consumo: exige token no consumido, no expirado y `intentos < 5`; valida correo y, para recuperación, contraseña de longitud 8 a 128. Recuperación cambia hash bcrypt y revoca sesiones activas. El token consumido queda marcado y otros tokens pendientes del mismo propósito quedan invalidados.
- Limitador: usa `INSERT ... ON CONFLICT DO UPDATE` para contar solicitudes por clave y ventana; exige máximo entre 1 y 100 y ventana entre 60 y 86400 segundos.
- Las funciones de servicio delegan a las privadas; las funciones privadas son `SECURITY DEFINER` con `search_path` vacío.

## Hallazgo de diseño a validar
El cooldown de emisión de 10 minutos comprueba `creado_en > now()-interval '10 minutes' AND consumido_en IS NULL`. Una vez consumido el token anterior, deja de contar para el cooldown. Esto **no impone 10 minutos entre todas las emisiones**. Si la intención es impedir nuevas emisiones durante 10 minutos incluso tras consumo, la condición debe revisarse. No se cambia sin validar el comportamiento y las implicaciones de UX.

El filtro `intentos < 5` existe en consumo, pero no se observa incremento de intentos en esa función. Un hash inexistente no identifica un token cuya cuenta pueda incrementarse. El límite por origen debe probarse separadamente.

## Ejecución
Un intento de comprobación de emisión y consumo con funciones reales y configuración apagada fue bloqueado por los controles de ejecución antes de obtener respuesta. **No está marcado como superado**. No se intentó eludir el bloqueo.

## Próximo paso
Pruebas dinámicas con ejecutor autorizado y datos ficticios, sin SMTP, con reversión verificable: cooldown después de consumir, token caducado, replay, recuperación, revocación y límite por origen. Comparar las expectativas de producto antes de corregir el cooldown.

No se desplegaron Edge Functions, no se enviaron correos y no se activaron pedidos reales.
