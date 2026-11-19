# ENLACE DIGITAL — auditoría de batería PostgreSQL offline
Fecha: 2026-11-18. Base bf40c9bbc0e4a82a8183a0f3238e49a16eab7859, comparación inicial idéntica.

## Hallazgos por inspección
- `atomic_postconditions.sql` solo imprimía filas y no afirmaba conteos: nuevo `atomic_postconditions_assert.sql` verifica una intención consumida y exactamente un efecto.
- Los archivos de sesiones previos dependían de iniciar B durante una pausa de A, sin verificar bloqueo; se documenta expresamente que una pausa no demuestra concurrencia y se exige capturar salidas y estados.
- `atomic_replay_assert.sql` verifica que un replay retorne `PENDIENTE`. Se corrigieron durante la publicación errores concretos de escape de metacomandos psql y delimitador dollar-quote.
- Los bloques DO no interpolan variables psql: se usa `set_config` para pasar valores de prueba. Es un ajuste exclusivo de scripts de pruebas, no identidad ni autorización operativa.

## Archivos nuevos
- `atomic_postconditions_assert.sql`
- `atomic_replay_assert.sql`
- `atomic_two_session_runbook.md`

## Límites
La batería es una guía de ejecución manual con scripts, **no un runner sincronizado**. No se ha ejecutado Node, PostgreSQL ni pruebas de dos sesiones. La preparación y publicación en GitHub no demuestra sintaxis SQL, permisos reales, bloqueo ni aislamiento. La autenticación de gateway y contexto autoritativo siguen fuera de alcance. Las pruebas de carreras de revocación frente al uso final comercial permanecen pendientes.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
