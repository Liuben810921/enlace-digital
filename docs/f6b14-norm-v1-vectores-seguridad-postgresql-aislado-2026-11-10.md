# F6-B14 — NORM-v1 y pruebas negativas de seguridad en PostgreSQL aislado

Base `ecf8eae28bd36ae70fe6c16b1922d13d6024083d`. CI #554 (42902506021) y #555 (42902505885): **SUCCESS**.

## Alcance y método
- Solo GitHub y PostgreSQL 17 desechable de GitHub Actions. **Ninguna conexión a Supabase, producción ni datos reales**. No se crea nada en staging.
- `scripts/generate_f6b14_synthetic_sql.py` consume los **30** vectores ficticios versionados `tests/fixtures/norm_v1_utf8_vectors.json`; genera SQL en `/tmp` para la base sintética del runner, nunca un artefacto de despliegue.
- **28** casos son representables en PostgreSQL UTF-8 y se verifican allí, incluidos rechazos de U+200B, U+FEFF, U+007F y U+0000. El NUL se envía como hexadecimal a `convert_from`, que debe fallar. **V21 y V22** contienen sustitutos Unicode inválidos: se rechazan antes de transmisión, y no se contabilizan como consultas PostgreSQL exitosas.
- Normalización PostgreSQL: `normalize(text,NFC)`, exactamente 25 `White_Space`, compactación y recorte, rechazo C0/C1 no permitido, U+200B/U+FEFF; preservación de mayúsculas, acentos, puntuación y ceros; comparación mediante `convert_to(...,'UTF8')` en `bytea`. Las longitudes de provincia/municipio 2–100, barrio opcional 0–150 y dirección 8–500 se validan tras normalizar; NULL y valores inválidos producen rechazo.
- Tabla ficticia de cuatro filas con duplicado del mismo cliente y dirección compartida entre dos clientes distintos. La función encapsulada `SECURITY DEFINER` calcula la identidad internamente y **solo devuelve SUPPRESSED**.

## Seguridad negativa verificable
Se crean tres roles sintéticos `NOLOGIN`, un owner sin `BYPASSRLS` ni privilegios amplios, un caller con `EXECUTE` limitado y un rol no autorizado. El owner solo tiene `SELECT` sobre cinco columnas; RLS se habilita con política limitada al owner. `search_path=pg_catalog,pg_temp`; referencias cualificadas. El caller no puede consultar direcciones, actualizar filas ni invocar el normalizador interno; el rol no autorizado no puede ejecutar la función pública. Las pruebas capturan únicamente el SQLSTATE esperado y **no** su propia excepción centinela. Se comprueba el resultado `SUPPRESSED`.

## Límites y NO-GO
- Los vectores comprueban la muestra definida, **no todos los caracteres Unicode posibles** ni equivalencia universal de implementaciones. El fixture de cuatro filas no demuestra corrección o coste con datos históricos.
- Capturar errores con `SUPPRESSED` no garantiza ausencia de filtración por tiempos, locks, planificación, logs, invocaciones repetidas, cardinalidad o privilegios efectivos en Supabase.
- La función `SECURITY DEFINER` en staging, cualquier política RLS y cualquier lectura histórica continúan **NO-GO**.
- PostgreSQL y runner desechables sin servicios permanentes; consumo de minutos de GitHub Actions sujeto a cuotas. `ROLLBACK` revierte los objetos del fixture. Para revertir los archivos de GitHub: `git revert`.

## Gates
| Gate | Requisito |
|---|---|
| B14-01 | CI #554/#555 verificado |
| B14-02 | 30 vectores contabilizados: 28 SQL + 2 frontera UTF-8 |
| B14-03 | NFC, 25 espacios, bytea y rechazos |
| B14-04 | NULL, vacíos, longitud y campos opcionales |
| B14-05 | Owner restringido, RLS y permisos por columna |
| B14-06 | EXECUTE restringido, SELECT/UPDATE denegados |
| B14-07 | Errores de autorización verificados por SQLSTATE |
| B14-08 | Solo SUPPRESSED |
| B14-09 | PostgreSQL aislado, ROLLBACK y costos revisados |
| B14-10 | Sin cambios ni lecturas de staging/producción |

**Autorización A** específica e independiente para cualquier cambio de permisos, funciones o RLS en staging; **autorización B** distinta para cualquier lectura histórica. Ninguna de ellas se concede por estas pruebas.
