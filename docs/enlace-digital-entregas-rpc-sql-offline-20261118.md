# ENLACE DIGITAL — RPC SQL de aprobación de entregas, laboratorio offline
Fecha: 2026-11-18. Base `b70aac7e27515ff4eed10eb477f51a34aab84d12`, rama `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: identical.

## Archivos y hashes Git confirmados por fetch_file
- `manual_approval_rpc.sql`: `baa38e889cea44859b754a5199c54c2faac614e4`
- `seed_disposable.sql`: `5ec20dbd75fb0094275ea5e8bfd93ce47233b8ba`
- `two_sessions_A.sql`: `421b0e0f91a70002fac501095f9c7d6fbb5d81b2`
- `two_sessions_B.sql`: `fa02bf7bd067f7a3841abfa048fadd9e2eb64726`
- `check_rpc_static.js`: `0d5f60be663f6e50b143b266721720f779a02c20`

## Alcance
Se escribieron funciones de laboratorio `approve`, `revoke` y `resolve` para idempotencia por actor/operación, comprobación de rol, bloqueo de contexto, revocación y caducidad. El acceso directo a tablas está revocado a `PUBLIC` y al rol técnico `ed_delivery_lab_api`; se concede solamente `EXECUTE` a las RPC. Se corrigió por inspección el orden inverso de bloqueos en `resolve`, ahora contexto antes de aprobación.

## Reproducción futura, SOLO PostgreSQL local desechable
```sh
psql -X -v ON_ERROR_STOP=1 -d disposable -f manual_approval.sql
psql -X -v ON_ERROR_STOP=1 -d disposable -f manual_approval_rpc.sql
psql -X -v ON_ERROR_STOP=1 -d disposable -f seed_disposable.sql
# Abrir dos terminales y ejecutar A, luego B mientras A mantiene la transacción.
psql -X -v ON_ERROR_STOP=1 -d disposable -f two_sessions_A.sql
psql -X -v ON_ERROR_STOP=1 -d disposable -f two_sessions_B.sql
node check_rpc_static.js
```

**No se ejecutaron estos comandos en esta sesión.** Los ejecutables `postgres`, `initdb`, `pg_ctl` y `psql` no están disponibles. No se han comprobado sintaxis SQL ante PostgreSQL, permisos reales, dos conexiones, carreras, persistencia, reinicio ni RLS. El validador estático está publicado pero tampoco debe contarse como prueba ejecutada.

## Bloqueantes y defectos pendientes de diseño
1. **Autenticación no segura para producción:** `current_setting('ed_delivery_lab.trusted_actor')` es un GUC controlable por un cliente con SQL; NO demuestra identidad. El script usa un actor ficticio. Se requiere identidad derivada de sesión de servidor y permisos efectivos verificados. `SECURITY DEFINER` exige un propietario técnico mínimo y revisión exhaustiva.
2. **Huella de contexto no certificada:** `context_state` y `seed_disposable.sql` reciben fingerprint sintético; falta derivarlo atómicamente de cesta, destino, asociaciones, tarifas y revisión en datos autenticados. Una huella suministrada por navegador no es autoridad.
3. **Carreras y bloqueo:** los guiones A/B están preparados pero no probados. La revocación y resolución necesitan validación final atómica en el punto de uso; una consulta previa nunca habilita un cobro.
4. **Durabilidad:** no hay verificación tras desconexión/reinicio ni manejo probado de commits desconocidos, deadlocks o errores serializables.
5. **Permisos:** no se han validado roles SQL, RLS ni acceso entre usuarios. El esquema se destina solo a base desechable.
6. **Vigencia:** el plazo de 15 minutos es provisional para el laboratorio, no una regla comercial autorizada.
7. **Resultado:** `LAB_VALID_ONLY` nunca es aprobación operativa. Si falta evidencia o hay inconsistencia, mantener `PENDIENTE` y mensajería fuera de caja.

No se usaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos. No se modificó checkout operativo.
