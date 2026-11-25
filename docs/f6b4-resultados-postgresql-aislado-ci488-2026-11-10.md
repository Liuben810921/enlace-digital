# F6-B4 — Resultado comprobado PostgreSQL local desechable

Fecha 2026-11-10. Commit de ejecución `ad7eb25929e59d41908321d3bf5a06869643d1f9`. GitHub Actions **#488**, ID `42878154919`: **SUCCESS**, sin pasos fallidos.

## Aislamiento
Prueba en runner efímero GitHub Actions con imagen Docker `postgres:17`, `--network none`, sin credenciales Supabase ni conexión a staging/producción. Contenedor eliminado al salir mediante trap. Solo 30 entradas Unicode sintéticas del fixture. SQL ejecutado exclusivamente en PostgreSQL desechable; ninguna tabla real ni datos de clientes. La función de prueba `pg_temp.norm_v1` y tabla `TEMP` son temporales y no se despliegan.

## Resultados de los logs
- `server_encoding=UTF8`.
- `server_version=17.11 (Debian 17.11-1.pgdg13+2)`.
- Base de datos local: `datcollate=en_US.utf8`, `datctype=en_US.utf8`, `datlocprovider=c` (libc), `datcollversion=2.41`.
- **28/28 vectores transportables a PostgreSQL PASS**: NFC, 25 puntos White_Space, C0/C1, U+200B, U+FEFF, bytes UTF-8, case y acentos. Incluye rechazo explícito de entradas de control que sí son UTF-8 válidas.
- **2/2 surrogates inválidos** rechazados en el límite Python/UTF-8; no se enviaron al motor PostgreSQL porque no representan Unicode escalar válido. No declarar que PostgreSQL ejecutó esos dos vectores.
- Comparación offline previa: Python Unicode **16.0.0**, JavaScript Unicode **17.0**; PostgreSQL **no ha expuesto una versión de tablas Unicode NFC verificada** en esta prueba. Collation libc 2.41 no equivale a versión Unicode NFC.
- La comparación de salidas utilizó hexadecimal UTF-8 exacto, no igualdad lingüística. No se verificó el comportamiento de un índice UNIQUE real ni un algoritmo de normalización instalado en staging.

## Límites y próximos pasos
**F6-B sigue NO-GO para filas reales o agregados históricos.** Una implementación sintética temporal no demuestra equivalencia de una función persistente en Supabase staging ni cubre todo Unicode. Requiere autorización independiente para cualquier prueba PostgreSQL en staging sin datos reales; y otra para cualquier lectura agregada de registros. No hubo DDL/DML, consultas, despliegue ni cambios en Supabase o producción. No se activaron correos, servicios ni pedidos reales.

## Reversión
La prueba Docker se eliminó al finalizar el job. Los cambios de GitHub se revierten con `git revert`; mantener solo el harness reproducible para futuras pruebas autorizadas, sin reejecutarlo automáticamente en cada CI.
