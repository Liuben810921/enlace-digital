# ENLACE DIGITAL — auditoría focalizada de bootstrap, conexiones y cancelación
Fecha: 2026-11-19. Base: `1115e4fee81337410faa0a0e677e79a4463f5f64`. Comparación inicial con rama: `identical`.

## Defectos verificables por inspección y correcciones
1. **Variables de entorno de libpq**. El ejecutor heredaba variables `PG*` de su proceso, que pueden modificar la selección del destino o la autenticación. Ahora los procesos `psql` reciben un entorno depurado de variables `PG*` y conexiones explícitas por URI. El operador debe incluir credenciales en la URI o utilizar autenticación local configurada; no se muestran valores.
2. **Desvío de destino mediante URI**. Se aceptaba `localhost` (resolución dependiente del sistema) y parámetros de URI como `hostaddr` o `service`. Ahora se exige dirección IP literal de loopback (`127.0.0.1` o `::1`), usuario explícito y se rechazan parámetros de consulta y fragmentos.
3. **Sondeo de bloqueo con timeout excesivo**. Cada observación `pg_blocking_pids` heredaba 30 segundos de timeout, superior a la ventana global de 9 segundos. Se limita cada consulta de observación a 2 segundos.
4. **Fuga de stderr de psql en consultas**. El mensaje de error del helper `run()` incluía stderr potencialmente sensible. Se sustituye por estado y condición de error sin imprimir argumentos ni URI.

## Bootstrap y cancelación
- `atomic_disposable_roles.sql` exige logins preaprovisionados en un clúster totalmente desechable y no ejecuta `CREATE ROLE`. Su contenido se releyó en GitHub.
- El runner verifica `session_user` del pool y exige una confirmación administrativa explícita de clúster desechable; esto no demuestra por sí mismo aislamiento del servidor.
- Se conservan SIGTERM, escalada a SIGKILL y temporizadores de sesión; **no** se declara demostrada la terminación efectiva de procesos sin ejecución.
- El runner todavía depende de `pg_stat_activity` y `pg_blocking_pids` con permisos de observación suficientes.

## Evidencia y estado
- Runner blob `962b8d4174ee338cd110c36c1cf93c58d762478a`: sintaxis JavaScript analizada con V8, **PASS**.
- SQL de roles blob `0b963d3eb4d271afba62cc91f2b0fdea3856c79b`: inspección de texto, sin motor SQL.
- **Pruebas ejecutadas:** parseo estático de JavaScript e inspección de archivos GitHub.
- **Pruebas no ejecutadas:** PostgreSQL, psql, runner Node como proceso, concurrencia, permisos reales, cancelación real y bootstrap real.
- **Restricciones:** sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.

La autorización comercial permanece `PENDIENTE`.
