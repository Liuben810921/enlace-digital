# Regresión aislada de recuperación de contraseña (72 bytes)

Fecha: 2026-11-12. Rama exclusiva: `test/password-recovery-72bytes-20261112`.

## Alcance
- PostgreSQL 17 desechable en GitHub Actions; datos sintéticos y esquema local creado en el job.
- No ejecuta conexiones a Supabase, ni lee datos reales, ni modifica código operativo.
- El prototipo NO es una copia literal de la función de staging: reproduce los invariantes críticos de validación, consumo único y revocación.

## Casos automatizados
ASCII de 7, 8, 72, 73 y 129 caracteres; Unicode de 72 y 75 bytes; rechazo sin consumo de token, modificación del hash ni revocación; aceptación con cambio de hash y revocación; replay y token desconocido rechazados.

## Corrección de revisión estática
En la función aislada con `SET search_path=''`, se calificaron explícitamente `public.crypt` y `public.gen_salt`, evitando un error de resolución de funciones de pgcrypto. Commit: `3d6d5948c5ba773e27198f41ccd648e501e07e4d`.

## CI
Workflow: `.github/workflows/synthetic-password-recovery-72bytes.yml` (push a esta rama o workflow_dispatch). La API de estados de commit devuelve lista vacía y la consulta de runs conectada solo incluye eventos de pull request; **no se han obtenido logs ni confirmación de éxito**. No declarar PASS hasta consultar el job y sus logs.

## Pendiente
1. Confirmar ejecución en GitHub Actions y revisar salida de `psql` (9 aserciones).
2. Si falla, corregir únicamente el SQL sintético y repetir CI.
3. Una futura corrección de la función real de staging requiere autorización independiente; no se ha realizado.

## Evidencia visual de GitHub Actions aportada por el propietario
Captura de 2026-11-12 15:18 (hora mostrada en dispositivo): workflow `synthetic-password-recovery-72bytes` ejecución **#3**, commit `3d6d594`, icono verde de éxito, duración **24 s**. La ejecución #2, commit `6fc959b`, aparece fallida. Se verifica la conclusión global de la ejecución #3 mediante captura; los logs detallados de ese job no se han recuperado por conector. No confundir esta prueba sintética con validación de la función real en staging.
