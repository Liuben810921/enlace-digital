# Auditoría de expiración TOCTOU de rutas — 13 noviembre 2026

## Hallazgo
En `quote_preview`, la vigencia `routes.expires_at` se verificaba antes de consultar o bloquear la fila de idempotencia (`quotes ... FOR UPDATE`). Una sesión concurrente podía mantener bloqueada esa fila hasta después de la expiración, y la RPC podía devolver una cotización basada en una ruta ya caducada. Es una ventana TOCTOU temporal, independiente de las versiones.

## Corrección
Revalidar `r.expires_at > clock_timestamp()` inmediatamente antes de devolver `replayed` y `committed`. Rechazo `40001` para rutas expiradas. Los locks, el propietario NOLOGIN/NOBYPASSRLS, FORCE RLS y privilegios mínimos permanecen iguales.

## Prueba
Se agregó en `tests/postgres-delivery-rpc-rls-lab.py` una carrera reproducible: cotización previa; acortamiento de expiración de ruta por superusuario **exclusivamente del PostgreSQL desechable**; retención de `FOR UPDATE` sobre la fila de idempotencia; solicitud concurrente de replay; espera hasta expiración; liberación del bloqueo; aserción de rechazo `SerializationFailure`. Se restaura la expiración del fixture. Esta manipulación privilegiada sirve únicamente para preparar el caso adversarial y **no** forma parte de las RPC autorizadas.

## Evidencia
- SQL: `b8a2e013df6c084e6acf04017a53db6ff3e48c68`.
- Prueba: `ae4de298d43f2e5d8eec706bd09100d9172eeaea`.
- GitHub Actions #43510900333 (SQL): en ejecución en la primera consulta.
- GitHub Actions #43510924260 (regresión): en cola en la primera consulta.
- **Resultado final CI: pendiente de confirmación.** No afirmar aprobación antes de comprobar la ejecución de la prueba.

## Límites
La revalidación impide devolver una cotización ya caducada al instante de respuesta de la RPC; no garantiza vigencia durante operaciones posteriores, que deben verificar su propio contexto. Los escritores privilegiados externos siguen fuera del protocolo de advisory locks. Ninguna interacción con Supabase, staging, producción, clientes reales ni pedidos.

## Seguimiento de GitHub Actions — 13 noviembre 2026

Verificación directa de GitHub Actions:
- [Run 43510900333](https://github.com/Liuben810921/enlace-digital/actions/runs/43510900333), commit `b8a2e013df6c084e6acf04017a53db6ff3e48c68`: `completed/success`.
- [Run 43510924260](https://github.com/Liuben810921/enlace-digital/actions/runs/43510924260), commit `ae4de298d43f2e5d8eec706bd09100d9172eeaea`: `in_progress` en la última consulta; job `132180652992` en ejecución. Sin conclusión final disponible.

No se detectó un fallo comprobado que justifique corrección. La prueba concurrente nueva todavía no está validada por una ejecución concluida. Mantener la fase abierta hasta conocer el resultado final; no atribuir `success` a un run en curso. Esta actualización es solo documental y no afecta el código ni dispara el workflow filtrado por rutas.

No se accedió a Supabase, staging, producción, clientes reales ni pedidos.
