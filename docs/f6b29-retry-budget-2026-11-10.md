# F6-B29 — política sintética de reintentos, presupuesto y jitter

Fecha: 2026-11-10. PR #3, solo PostgreSQL 17 desechable en GitHub Actions.

## Contrato de ensayo
- Clasificación cerrada: solo `40P01` (deadlock), `40001` (serialización) y `55P03` (espera de bloqueo) se clasifican como candidatos a reintento. `57014` (cancelación/timeout), `42501` (permisos), `23505` (unicidad), `23514` (check), `22023`, `P0001`, `08006`, estados desconocidos o malformados se detienen. En un sistema real, la elegibilidad depende de contexto y efectos externos: esta es una política conservadora experimental.
- Máximo tres intentos totales, con máximo 350 ms de espera acumulada simulada, backoff exponencial con tope 160 ms y jitter determinista basado en SHA-256 de identificador sintético de operación e índice de intento. Se comprueba estabilidad, diversidad y límites.
- Cancelación explícita antes del siguiente intento, sin ejecutar nuevas reservas. El simulador no duerme ni produce efectos externos: solo calcula intentos, esperas y motivo final.
- Errores no recuperables: detención inmediata, sin agotar intentos ni reintentar conflictos de payload.
- PostgreSQL: 16 reservas concurrentes de dos roles sintéticos usando la misma clave (un NEW, siete REPLAY por identidad); payload diferente CONFLICT; rollback por error SQL `22012` no consume clave.
- Seguridad: roles de laboratorio no pueden leer/editar tabla directamente ni asumir owner; stranger no puede invocar función.

## Limitaciones
La simulación de backoff no implementa esperas reales ni detecta automáticamente SQLSTATE desde un controlador operativo. No cubre pérdida de conexión con resultado de commit desconocido, circuit breaker, observabilidad, JWT ni efectos externos exactamente una vez. No se recomienda reintentar 55P03 sin presupuesto contextual ni 08006 automáticamente.

Sin Supabase, staging, producción, código operativo, clientes, históricos, correos, pedidos, servicios o despliegues. PR #3 sin fusionar. Requiere autorizaciones independientes antes de staging o lectura histórica.

**CI:** pendiente de verificación final.
