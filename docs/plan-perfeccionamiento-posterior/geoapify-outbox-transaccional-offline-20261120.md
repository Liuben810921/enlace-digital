# ENLACE DIGITAL — outbox transaccional conservador (2026-11-20)

Base `f9e6942678b6dfb477da5216d14c3205c2b9754d`; rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`, cero commits posteriores.

## Código guardado
- `013_geoapify_dispatch_outbox.sql`: tabla `dispatch_outbox` con unicidad por reserva y operación. La autorización de despacho inserta el outbox en la misma transacción que el cambio de estado. `claim_dispatch` solo permite reclamar `READY` una vez, bajo bloqueo advisory transaccional; `CLAIMED` y `UNKNOWN` no se reenvían automáticamente.
- `finish_dispatch` requiere el mismo token de reclamación; `UNKNOWN` puede reconciliarse conservadoramente como `SUCCEEDED` o `FAILED_CHARGED`. El cierre confirmado actualiza también el ledger mediante `transition`. Los replays no vuelven a aplicar cambios.
- `014_geoapify_dispatch_outbox_tests.sql`: pruebas rollback de autorización única, doble reclamación, token incorrecto, resultado desconocido, prohibición de reintento y reconciliación.
- `run_concurrency.py`: orden de ejecución ampliado para 013 y 014.
- Se corrigió la longitud máxima de token de reclamación a 73 caracteres, coherente con el prefijo `outbox-` y el máximo de 80 del evento del ledger.

## Verificación real
- Se consultaron directamente en GitHub el SQL 011, SQL 005 y el ejecutor, y se verificó la coincidencia del commit inicial.
- Se guardaron en GitHub la migración, las aserciones y el ejecutor actualizado.
- **No se ejecutó PostgreSQL** ni carreras reales; no se instaló software.
- **No se ejecutaron nuevas pruebas Node.js**: este cambio afecta SQL/Python, y no se materializaron copias locales exactas verificadas de los módulos Node. Las pruebas SQL están preparadas, no aprobadas.

## Límites y riesgos
1. El outbox impide una segunda reclamación desde los procedimientos cooperantes, pero no garantiza entrega exactamente una vez en el proveedor. Una caída tras marcar CLAIMED puede dejar un envío no realizado; se prioriza no duplicar sobre disponibilidad.
2. El estado UNKNOWN conserva créditos y no autoriza reenvío. La reconciliación necesita evidencia externa confiable, que no se consultó.
3. `finish_dispatch` no admite cambiar un resultado terminal. Los permisos mínimos reales y la imposibilidad de escrituras directas a tablas no están probados.
4. El outbox no tiene worker ni transporte: no se enviaron solicitudes. El gateway permanece en PENDIENTE.
5. El modelo aún requiere prueba PostgreSQL real de sintaxis, integridad referencial, serialización, deadlocks y fallos de commit desconocido.
6. Los cambios en el contexto posterior a la autorización y anteriores al envío requieren una política explícita de cancelación o conciliación; no se ha conectado ningún proveedor.

Sin Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
