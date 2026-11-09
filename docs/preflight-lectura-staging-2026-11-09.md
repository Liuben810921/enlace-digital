# Preflight de solo lectura — staging — 2026-11-09

## Identidad y estado (conector Supabase)
- Proyecto `enlace-digital-staging`, ref `xqahthghvozeigbojhyi`; `ACTIVE_HEALTHY`; PostgreSQL 17; región us-east-1.
- Edge Functions desplegadas: 0.

## Datos y configuración (SELECT, sin escritura)
- `public.clientes_oficiales`: 0.
- `enlace_auth.cliente_credenciales`: 0.
- `enlace_auth.cliente_correo_tokens`: 0.
- `enlace_auth.cliente_sesiones`: 0.
- `enlace_auth.solicitudes_limite`: 0.
- `configuracion_correo` clave `principal`: `envios_habilitados=false`, `verificacion_habilitada=false`, `recuperacion_habilitada=false`.

## Privilegios y definiciones
- `has_function_privilege` de `anon` y `authenticated` para emisión y consumo privados: `false` para ambos roles y funciones.
- Funciones privadas `ed_emitir_token_correo_privado` y `ed_consumir_token_correo_privado`: `SECURITY DEFINER=true`, `search_path` vacío.
- Las cinco tablas examinadas tienen RLS activado.

## Posibles mecanismos de envío
- Triggers no internos en tablas de `public` y `enlace_auth`: ninguno en consulta.
- Extensiones instaladas `pg_cron`, `pg_net`, `http`, `wrappers`: ninguna en consulta.
- Funciones de `public` y `enlace_auth` cuyo código fuente contiene patrones `http_`, `net.http`, `smtp`, `pg_notify`, `dblink`: ninguna en consulta.
- **Límite:** estas comprobaciones no prueban ausencia de toda integración externa, de secretos, hooks fuera de los esquemas revisados o de servicios fuera de Supabase. No se inspeccionaron secretos.

## GitHub Actions
- Commit `ceec2902a61e078a207f283e964999dc04f2ca06`: run `42651733785`, `completed/success`.
- URL: https://github.com/Liuben810921/enlace-digital/actions/runs/42651733785

## Dictamen
**Preflight de lectura: favorable con reservas.** No es autorización para ejecutar las 18 aserciones SQL. Falta canal PostgreSQL permitido, confirmación operacional de aislamiento completo y autorización específica antes de cualquier prueba que escriba, incluso dentro de ROLLBACK. No se ha modificado Supabase ni producción.
