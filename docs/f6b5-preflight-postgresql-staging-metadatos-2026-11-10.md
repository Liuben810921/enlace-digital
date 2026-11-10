# F6-B5 — Preflight administrativo PostgreSQL staging, solo metadatos

Fecha: 2026-11-10. Proyecto `enlace-digital-staging` (`xqahthghvozeigbojhyi`). Base GitHub `ba80269a871810e269a4f7251d141a019bd95f22`. GitHub Actions #495, ID `42879811313`, SUCCESS. Protocolo F6-B4 revisado.

## Alcance y consultas realizadas
Acceso exclusivamente de solo lectura a configuración PostgreSQL y catálogos `pg_catalog.pg_database`, `pg_catalog.pg_proc` y `pg_catalog.pg_namespace`; sin consultas a tablas de negocio, sin filas de clientes, direcciones, nombres, teléfonos, tokens ni IDs de clientes. **No se ejecutaron los 30 vectores sintéticos en staging**, no se instaló función ni se efectuó DDL/DML.

Una primera consulta de configuración intentó leer `current_setting('lc_collate')`, que PostgreSQL 17 rechazó como parámetro no reconocido; se corrigió consultando `pg_database.datcollate/datctype`. No hubo modificación de datos.

## Resultados observados
- Proyecto `ACTIVE_HEALTHY`, PostgreSQL de proyecto `17.11.0.018`; consulta SQL de metadatos `server_version=17.11`, `server_version_num=170011`.
- `server_encoding=UTF8`; rol administrativo ejecutor `postgres`, con `CONNECT` confirmado. Esto **no** autoriza usar el rol en frontend ni supone permisos de otros roles.
- `datcollate=en_US.UTF-8`, `datctype=en_US.UTF-8`, `datlocprovider=i` (**ICU**), `datcollversion=153.121`.
- `pg_catalog.normalize(text, text)` existe y tiene permiso EXECUTE para el rol consultante. La búsqueda inicial `to_regprocedure('pg_catalog.normalize(text)')` dio falso porque la firma real usa **dos argumentos**; no implica ausencia de NFC.
- `pg_catalog.convert_to(text,name)`, `convert_from(bytea,name)`, `encode(bytea,text)`, `decode(text,text)` existen y son ejecutables por el rol consultante.
- Contraste con prueba Docker aislada #488: PostgreSQL `17.11`, UTF8, pero collation **libc** `en_US.utf8`, versión `2.41`. En staging, ICU `153.121`. Ninguna de esas versiones identifica por sí sola las tablas Unicode NFC utilizadas por PostgreSQL.
- Pruebas JavaScript/Python previas: Unicode `17.0` y `16.0.0`, respectivamente. La equivalencia universal sigue sin probarse.

## Riesgos y puertas de autorización
1. Proveedor de collation diferente (ICU vs libc): no usar igualdad lingüística para la identidad; comparar hexadecimal UTF-8 de valores canónicos. Validar en el entorno objetivo con fixtures.
2. `normalize(text,text)` disponible no demuestra reglas exactas de Unicode White_Space, rechazo C0/C1 ni manejo de entradas UTF-8 inválidas. Requiere una implementación temporal y prueba sintética **separadamente autorizadas**.
3. El rol `postgres` tiene privilegios elevados; la prueba posterior debe limitarse a expresiones/objetos temporales y un único entorno staging, sin funciones persistentes, extensiones ni tablas de clientes.
4. Riesgo de diferencias Unicode y de logs de errores. Registrar solo identificadores de fixtures sintéticos, PASS/FAIL, versiones y comparación hexadecimal; nunca datos reales.
5. **NO-GO** vigente para F6-B agregados históricos. Incluso un agregado puede filtrar información; requiere revisión de privacidad y autorización adicional, separada de los 30 fixtures.

## Siguiente secuencia
**A:** autorización específica para ejecutar exclusivamente los 30 fixtures ficticios en staging, sin leer datos de clientes y sin persistir cambios. **B:** una autorización posterior y distinta para una consulta agregada de duplicados, únicamente tras equivalencia probada y evaluación de privacidad. No se han ejecutado A ni B.

## Reversión
Solo se agregó documentación GitHub: `git revert`. Supabase y producción permanecen sin cambios.
