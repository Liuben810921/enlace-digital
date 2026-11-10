# F6-B18 — Prototipo prospectivo NORM-v1 con concurrencia sintética aislada

Fecha: 2026-11-10. Base: `d490389afff22d75a991c7b43c21904ebc0a71e8`. GitHub Actions #582 (42905334462): **SUCCESS**. **SOLO PostgreSQL 17 desechable de GitHub Actions**; sin SQL en Supabase, datos reales, staging, producción o código operativo.

## Diseño transaccional

El fixture `sql/pruebas/f6b18_prospective_isolated_setup.sql` crea un esquema ficticio `f6b18_synthetic`, una tabla auxiliar de claves **exclusivamente nuevas** y una restricción UNIQUE sobre `(cliente_numero,p,m,b,d)`, donde las cuatro columnas textuales son `bytea` UTF-8 de NORM-v1. La función `reserve_new` es `SECURITY DEFINER`, `search_path=pg_catalog,pg_temp`, referencias cualificadas y `INSERT ... ON CONFLICT DO NOTHING RETURNING`; no utiliza el patrón inseguro SELECT-previo/INSERT. La clave se calcula dentro de la misma transacción. Se rechazan entradas inválidas y se preserva el aislamiento por cliente.

La función usa un owner `NOLOGIN` sin BYPASSRLS ni CREATEROLE, con privilegios de SELECT/INSERT únicamente en la tabla auxiliar ficticia. RLS está habilitado y su política permite solo ese owner. El caller tiene EXECUTE y no SELECT/INSERT directo; el extraño no tiene EXECUTE. No se otorgan permisos de CREATE al caller ni al owner tras crear la función. Esta es una **demostración**, no un contrato RPC ni un modelo de autorización listo para staging.

## Pruebas reproducibles

`scripts/run_f6b18_concurrency_isolated.py` abre **dos procesos psql y dos sesiones reales**. La primera reserva una dirección inventada y mantiene la transacción abierta unos segundos; la segunda intenta reservar la misma clave NORM-v1 (variación de espacios Unicode). La restricción UNIQUE debe serializar el conflicto y el resultado esperado es una reserva y un rechazo, con exactamente una fila final. Se comprueba además:
- Idempotencia de reserva repetida, sin duplicar la fila.
- Misma dirección para otro cliente permitida; otra dirección para el mismo cliente permitida.
- Transacción que inserta y ejecuta `ROLLBACK`: no debe persistir la reserva.
- Negativas de SELECT/INSERT directo, EXECUTE de rol extraño y longitud inválida.
- Inspección de owner, RLS, privilegios, membresías y search_path; el runner destruye el servicio y el esquema sintético al terminar.

**Limitación fundamental:** la tabla auxiliar comienza vacía. Aunque impida duplicados **entre nuevas reservas**, no puede detectar coincidencias entre nuevas direcciones y registros históricos que no han sido inspeccionados. No declarar deduplicación global ni instalar UNIQUE en una tabla histórica.

## Riesgos residuales y puertas

| Gate | Requisito | Estado |
|---|---|---|
| B18-01 | #582 verificado | PASS |
| B18-02 | Solo PostgreSQL 17 desechable y fixtures ficticios | CI |
| B18-03 | Dos sesiones reales y bloqueo de carrera | CI |
| B18-04 | Unicidad atómica prospectiva | CI |
| B18-05 | Idempotencia, otros clientes y rollback | CI |
| B18-06 | Permisos mínimos, RLS y denegaciones | CI |
| B18-07 | NORM-v1: NFC, 25 espacios, controles y bytea | Fixture |
| B18-08 | Colisión nuevo-vs-histórico sin lectura | **NO-GO** |
| B18-09 | Costo gratuito, índices, locks y contención reales | **NO-GO staging** |
| B18-10 | Autorizaciones independientes A y B | **NO AUTORIZADAS** |

La implementación real requeriría análisis de privacidad y posibles canales de inferencia: la respuesta sintética `RESERVED_SYNTHETIC` / `DUPLICATE_SYNTHETIC` **revela el resultado de una reserva**. No debe exponerse como oráculo público ni confundirse con el mecanismo histórico `SUPPRESSED`. La prueba no cubre reintentos con errores de red, caídas entre escritura y confirmación, reuso de tokens de idempotencia ni alta contención; la idempotencia demostrada es **de la clave**, no de una operación de negocio. La implementación futura necesitará contrato de operación y límites de invocación.

**Costos:** runner PostgreSQL y GitHub Actions sujetos a cuotas; el plan gratuito de Supabase no se ha verificado en esta fase. No se crean servicios persistentes. Reversión GitHub: `git revert`; objetos sintéticos: destruir el contenedor PostgreSQL. Para un futuro staging se necesita plan específico de backup/rollback y comprobación de índices, locks, grants y RLS antes de actuar.

**Autorización A**: obligatoria, explícita e independiente antes de modificar staging (funciones, roles, grants, políticas, índices o tablas). **Autorización B**: distinta antes de cualquier lectura histórica, incluso agregada. Ninguna se ha concedido. **NO-GO** para producción, staging y lectura histórica.
