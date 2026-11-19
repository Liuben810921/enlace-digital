# ENLACE DIGITAL — auditoría focalizada de carreras, temporizadores y cancelación
Fecha 2026-11-19. Base `7c513b9bb4743e3dd341a709ad0dc5b00fbb2d25`. Comparación inicial de rama: identical.

## Defectos demostrables corregidos
- El handshake de la sesión A instalaba escuchas `data` y `close` sin retirarlas al resolverse o agotarse el plazo. Además, la señal `close` podía intentar rechazar una promesa ya resuelta. Se incorporó una función de finalización única, con `settled`, limpieza de temporizador y eliminación de escuchas `data/close/error`.
- La escalada de SIGTERM a SIGKILL exigía `signalCode===null`. En Node, `signalCode` puede reflejar una señal enviada incluso si el proceso todavía no ha terminado, por lo que el hijo podía quedar activo sin escalada. Ahora la escalada verifica pertenencia al conjunto activo y `exitCode===null` e intenta SIGKILL con protección de errores.
- Se elimina el almacenamiento de stderr en la rutina de seguimiento de sesión: se drena el flujo sin retener datos potencialmente sensibles.

## Verificación estática
- Archivo runner reabierto desde GitHub: blob `5ef0d6630faa7e18148ff60706626b8ec7044b75`.
- Análisis de sintaxis JavaScript mediante parser V8: **PASS**.
- Revisión textual de condiciones de carrera, limpieza de escuchas, temporizadores y escalada de señales.
- **No se ejecutó el runner, Node como proceso, psql ni PostgreSQL.** No hay resultados funcionales de cancelación o concurrencia.

## Limitaciones
- SIGKILL no prueba terminación efectiva hasta recibir `close`; el runner no espera explícitamente todos los cierres al fallar.
- `spawnSync` puede bloquear el bucle de eventos mientras dura una consulta administrativa, por lo que la cadencia y los temporizadores no son garantías de tiempo real.
- No se verificaron permisos PostgreSQL, bloqueos observados, commit, rollback ni replay en un motor.
- Se mantuvieron intactos GitHub Actions, Supabase, staging, producción y pedidos reales; sin descargas, despliegues ni costos.
