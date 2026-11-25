# Procedimiento final controlado — 18 pruebas SQL de correo en staging

Fecha: 2026-11-09. **Preparación documental, no ejecución.**

## Evidencia GitHub
- Commit `20801ed11a1f04ecf68cee18f0904e228a5171fb`.
- Workflow `Audit email cooldown proposal (static only)`: run `42651516738`, estado `completed`, conclusión `success`.
- Job `129278817438`, paso `Verify isolated SQL proposal invariants`: `success`.
- PR #1 abierto, en borrador y no fusionado.

## 1. Acceso y autorización necesarios
Se necesita **un operador con acceso PostgreSQL explícitamente autorizado** al proyecto Supabase staging `xqahthghvozeigbojhyi`, con permisos mínimos suficientes para ejecutar las funciones y las escrituras transaccionales de prueba en las tablas del esquema. La autorización del propietario en este chat no concede ni sustituye los permisos técnicos del servicio ni levanta controles de seguridad del ejecutor. Si el acceso SQL está bloqueado por una política, detenerse y solicitar el canal permitido; nunca usar otro rol, API o conector para eludirla. No compartir contraseñas, URI de conexión ni claves en el chat.

## 2. Preflight exclusivamente de lectura
1. Verificar en el panel oficial de Supabase que la conexión corresponde al **project ref exacto** `xqahthghvozeigbojhyi`; no confiar solo en `current_database()`, pues ese nombre no identifica inequívocamente el proyecto. Confirmar la identidad de la conexión con el operador y el panel antes de abrir sesión.
2. Confirmar que `public.clientes_oficiales`, `enlace_auth.cliente_credenciales`, `enlace_auth.cliente_correo_tokens`, `enlace_auth.cliente_sesiones` y `enlace_auth.solicitudes_limite` están vacías o que se ha aprobado un aislamiento equivalente. El script actual aborta si las primeras cuatro no están vacías; no garantiza por sí solo la quinta.
3. Confirmar que `envios_habilitados`, `verificacion_habilitada`, `recuperacion_habilitada` están en `false`.
4. Inspeccionar dependencias de envío, triggers, hooks, cron, colas y Edge Functions antes de ejecutar: **el script habilita temporalmente los tres flags dentro de una transacción**. Un ROLLBACK no deshace efectos externos si alguna función dispara una operación de red. Si existe cualquier camino de entrega, NO ejecutar este script hasta aislarlo por una vía autorizada.
5. Verificar privilegios, definiciones de funciones y que no haya cambios concurrentes sobre staging durante la ventana. Evitar cambios de producción.

## 3. Ejecución condicionada (no realizada)
- Fuente: `sql/staging_correo_integral_rollback.sql` en main.
- Usar una única sesión PostgreSQL autorizada con comportamiento transaccional conocido. Ejecutar el archivo íntegro de `BEGIN` a `ROLLBACK`, nunca sentencia por sentencia en conexiones diferentes.
- Mantener `SET LOCAL statement_timeout='60s'` del script y un mecanismo para garantizar `ROLLBACK` ante errores. El operador debe capturar las dos consultas finales de resultados **antes del rollback**.
- El archivo contiene datos ficticios `example.invalid` y 18 aserciones. La aserción 11 probablemente falle con la función actual: esto es una predicción estática, no un resultado observado.
- Si la transacción falla o se interrumpe, verificar que quedó cerrada y revertida antes de cualquier nueva operación. No ejecutar la propuesta `sql/propuestas/staging_cooldown_consumido.sql` como parte de esta prueba de línea base.

## 4. Criterios de aceptación y evidencia
- Capturar 18 filas individuales `PASS/FAIL` y el resumen `passed/failed`, además del identificador del proyecto, fecha, versión/commit de script y estado de transacción.
- Ejecutar después, en sesión nueva y solo lectura, conteos de las cinco tablas, tres flags y una comprobación de que no hubo correo ni pedidos reales.
- Para considerar la **corrección** validada, repetir las pruebas únicamente después de una aplicación a staging separada y explícitamente autorizada, con respaldo y plan de reversión; la aserción 11 debe pasar y las otras 17 no deben retroceder.
- Revisar aparte concurrencia y límites temporales; las 18 aserciones no demuestran seguridad ante emisiones simultáneas.
- No fusionar PR ni tocar producción. Si cualquier control falla o no se puede demostrar aislamiento, resultado `BLOCKED`, no `PASS`.

## 5. Qué falta hoy
- Falta confirmar un **canal PostgreSQL autorizado con sesión única y permisos adecuados**; el ejecutor anteriormente bloqueó operaciones dinámicas.
- Falta verificación actual de aislamiento completo frente a efectos externos y del estado preflight inmediatamente anterior a la ejecución.
- Falta ejecución real y evidencia de las 18 aserciones.
- No se requiere acceso a producción ni habilitar correo real para preparar estas comprobaciones.
