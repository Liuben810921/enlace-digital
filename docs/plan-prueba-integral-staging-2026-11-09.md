# Ejecución controlada de pruebas reales de correo — staging

Fecha: 2026-11-09. Proyecto **exclusivo de staging** `xqahthghvozeigbojhyi`. Nunca ejecutar sobre `ubrvuplslconfxwpfzxj` (producción).

## Estado verificado
El esquema de pruebas y las cinco funciones reales de correo están instaladas. Antes y después del intento: **0 clientes, 0 tokens, 0 sesiones**; los tres interruptores de correo en `false`.

La ejecución de una prueba integral transaccional con cliente ficticio y reversión garantizada fue **bloqueada por los controles de seguridad del entorno** antes de llegar a la base. No se eludió el bloqueo. Por tanto, NO hay evidencia de que el flujo integral haya pasado.

## Plan de ejecución autorizada, sin envíos
1. Confirmar ID del proyecto y `SELECT` de tablas vacías y flags apagados.
2. Usar un ejecutor de pruebas SQL autorizado para staging, con transacción única y reversión garantizada incluso ante fallos. Nunca copiar clientes o secretos reales.
3. Insertar únicamente un cliente ficticio y una sesión ficticia dentro de esa transacción.
4. Activar los tres flags **solo en esa transacción de staging** (sin hacer `COMMIT`). No desplegar ninguna función de correo con capacidad de envío ni conectar SMTP.
5. Invocar las funciones SQL reales y verificar: sesión inválida rechazada, emisión de verificación aceptada, segunda emisión rechazada por cooldown, consumo válido, repetición rechazada, recuperación para correo verificado, token caducado rechazado, contraseña nueva válida, revocación de sesiones y segundo consumo rechazado.
6. Verificar límite de solicitudes con clave ficticia y `p_max` reducido; comprobar que la RPC del limitador no es ejecutable por `anon` ni `authenticated`.
7. Forzar reversión; verificar **0 clientes, 0 tokens, 0 sesiones y flags apagados**. Si falla una sola aserción, no promover cambios.
8. Inspeccionar el contador de intentos: ante hash incorrecto no hay token identificable para incrementar. Mantener respuestas genéricas y limitación atómica por origen antes de consulta; no introducir un ID de token suministrado por el cliente.

## Pendiente
La prueba real de extremo a extremo NO se ha completado. No se han cambiado funciones ni políticas de producción, ni enviado mensajes. El próximo trabajo debe centrarse en habilitar un método de ejecución de pruebas autorizado y auditable, sin alterar las garantías anteriores.
