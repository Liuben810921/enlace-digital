# Evidencia de preflight offline y catálogo staging — 2026-11-09

## Alcance y límites
Partiendo de `0794691d8945e45bc2e7e4f4b7aa0a78e3fec3ef`. Solo lectura de GitHub Actions y consultas SELECT a catálogos/agregados en staging `xqahthghvozeigbojhyi`. Ningún DML/DDL, RPC invocado, secreto leído, despliegue o cambio en producción. No se ejecutaron localmente nuevas pruebas: se **verificó ejecución GitHub Actions**.

## GitHub Actions
- SHA `0794691d8945e45bc2e7e4f4b7aa0a78e3fec3ef`: ejecución `42726162291`, `completed/success`; job `static` `129532212077` `completed/success`.
- SHA previo `dae6a1457239f8a7c8e0acf6ca9d0707a4447473`: ejecución `42724480534`, `completed/success`.
- El workflow `.github/workflows/staging-auth-static-check.yml` define `deno check`, pruebas mock offline de Edge, pruebas Node de adaptador, aislamiento estático y parseo/contratos SQL. Éxito del job acredita ese pipeline, no pruebas de base de datos real ni de un Edge desplegado.
- La propuesta de privilegios permanece comentada y sin SQL ejecutable. No se modificaron fuentes funcionales.

## Lecturas de Supabase staging
- PostgreSQL 17.11.
- Ambas tablas `public.clientes_destinatarios` y `public.clientes_direcciones_entrega` tienen `relrowsecurity=true`, `relforcerowsecurity=false`.
- `service_role` conserva permisos efectivos SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN en ambas tablas. **No se ejecutó REVOKE**.
- Las seis RPC `ed_cliente_limite_privado`, `ed_cliente_registrar_privado`, `ed_cliente_registrar_residencia_privado`, `ed_cliente_login_privado`, `ed_cliente_sesion_privada`, `ed_cliente_direccion_privada` existen con `SECURITY DEFINER`. Las cinco RPC usadas por el controlador tienen EXECUTE para `service_role` y no para `anon`/`authenticated`. La RPC auxiliar `ed_cliente_registrar_privado` niega EXECUTE a los tres roles.
- `pg_policies` devolvió cero políticas para las seis tablas de clientes/autenticación inspeccionadas.
- `public.clientes_oficiales`: recuento agregado total=0, incumplimientos Cuba=0; no se consultaron datos personales.
- `ed_cliente_cuba_direccion_ck`: existe, `convalidated=false` (NOT VALID), como en el borrador v4.

## Matriz de cumplimiento
- **PASS (offline):** pipeline GitHub Actions para SHA autorizado, incluyendo mocks, contratos y aislamiento estático.
- **PASS (catálogo):** firmas/ejecución RPC, RLS habilitado, CHECK presente, permisos observados coinciden con auditoría previa.
- **PENDIENTE:** reducción de permisos; requiere inventario completo de consumidores externos y autorización específica.
- **PENDIENTE:** pruebas funcionales contra base de datos y Edge, incluyendo registro Cuba/extranjero, caducidad, revocación, destinatarios, dirección y pedidos históricos; prohibidas en esta etapa.
- **PENDIENTE:** validación formal de CHECK, evaluación de variables secretas efectivas y eventual despliegue; no autorizados.

## Criterio de decisión
**GO para seguir preparando documentación y comprobaciones read-only; NO-GO para aplicar REVOKE, validar CHECK, desplegar o activar autenticación.** No confundir CI offline con integración real. Reversión de cambios futuros debe conservar ACL previa y requerir autorización separada.

Fuentes oficiales: https://supabase.com/docs/guides/database/postgres/row-level-security ; https://www.postgresql.org/docs/current/sql-revoke.html .
