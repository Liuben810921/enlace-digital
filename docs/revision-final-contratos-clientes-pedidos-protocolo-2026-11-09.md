# Revisión final de contratos e integración — staging — 2026-11-09

Base `489e0a4bd122f98bb0bf941e1394b5482417fe2e`. Auditoría solo lectura de rama GitHub y metadatos Supabase staging `xqahthghvozeigbojhyi`. Sin DML, DDL, despliegue, activación, correos, pedidos ni producción.

## Evidencia verificada

- GitHub Actions para base `489e0a4...`: ejecución `42727793586`, `completed/success`, job `static` `129537794810` `success`. El CI offline no valida integración HTTP desplegada.
- Controlador `supabase/functions/enlace-cliente-auth-staging/index.ts`: rutas `register`, `login`, `session`, `logout`, `profile`, `address-save`, `recipient-save`, `delivery-location-save`. Usa RPC privadas para registro, login, sesiones, dirección habitual; SELECT/INSERT/UPDATE para destinatarios y direcciones; mutaciones restringidas por `cliente_numero` derivado de sesión. No tiene operación de pedidos oficiales.
- `staging-preview/index.html`: el checkout llama `recipient-save` y `delivery-location-save` y la administración consulta `/rest/v1/pedidos_oficiales` para historial, además de datos de clientes y destinatarios. La interfaz no demuestra que los pedidos oficiales existan en staging.
- `sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql` declara expresamente: `Historical order snapshots are a separate future proposal, not enabled here.`
- Consulta SELECT `information_schema.tables` en staging: existen `clientes_oficiales`, `clientes_destinatarios`, `clientes_direcciones_entrega`; **no existe `public.pedidos_oficiales`**. Consulta `pg_class` confirma ausencia. Recuento de `clientes_oficiales`: cero.
- Documentos históricos `docs/plan-pruebas-controladas-staging-2026-11-09.md` y `docs/resultado-integracion-sql-rollback-staging-2026-11-09.md` indican que **ya hubo una prueba SQL transaccional autorizada previamente**, con rollback sin filas persistentes, pero avance no reversible de secuencias. No confundir esa ejecución pasada con esta auditoría: **en este turno no se ejecutó fixture alguno**. Esas pruebas no demuestran aislamiento HTTP real ni pedidos oficiales.
- Permisos `service_role` adicionales y CHECK `NOT VALID` siguen documentados en auditorías previas. No revocar ni validar en esta fase.

## Matriz de contratos

| Contrato | Evidencia | Estado |
|---|---|---|
| Registro Cuba/extranjero | RPC v4, Edge y mock CI | Offline PASS; HTTP real pendiente |
| Sesión, revocación, expiración | RPC y mock CI; fixture SQL anterior | Parcial; HTTP real pendiente |
| Destinatarios y direcciones por propietario | Edge filtra cliente, mock CI | Offline PASS; aislamiento HTTP real pendiente |
| Checkout con destinatario | Frontend invoca rutas Edge | Contrato de UI identificado; Edge no desplegada |
| Historial de pedidos oficiales | UI consulta `pedidos_oficiales` | **BLOQUEADO**: tabla no existe en staging |
| Snapshot histórico inmutable | Declarado como propuesta futura en v4 | **NO IMPLEMENTADO en staging** |
| Privilegios mínimos | Propuesta SQL inerte | Pendiente de inventario externo/autorización |

## Protocolo futuro exacto — NO EJECUTAR

**Fase 0 — aprobación separada:** identificar responsable de staging, autorización para datos ficticios, aceptación explícita de avance irreversible de secuencias, aprobación de despliegue Edge por separado si llegara a ser necesario, y confirmación de ausencia de correos y pedidos reales. No habilitar pedidos.

**Fase 1 — preflight sin escritura:** confirmar proyecto staging y no producción; verificar función no desplegada o estado autorizado; confirmar variables sin revelar valores; comprobar grants, RLS, RPC, secuencias, tablas y filas; guardar evidencia y punto de reversión. Rechazar si el entorno difiere.

**Fase 2 — prueba SQL aislada (solo si se autoriza explícitamente):** ejecutar fixture identificado por SHA y contenido exactos, con BEGIN/DO/ROLLBACK; registrar excepciones y conteos antes/después. El ROLLBACK no deshace `nextval`; no usar `setval` para restaurar. Suspender ante filas residuales.

**Fase 3 — prueba HTTP Edge (autorización independiente):** únicamente tras despliegue temporal autorizado y manteniendo `ED_STAGING_CUSTOMER_AUTH_ENABLED=false` hasta aprobación específica para ventana controlada. Probar con dos clientes ficticios (Cuba/extranjero), teléfonos reservados de prueba y dominios `example.invalid`, sin mensajes: registro, duplicados, login erróneo/correcto, sesión, expiración, logout/replay, rate limit, perfil, destinatario/dirección propios, edición cruzada denegada, y errores de red. No exponer contraseñas/tokens en logs. Registrar respuesta HTTP, correlación y conteos; detener ante acceso cruzado.

**Fase 4 — pedidos históricos:** **NO EJECUTABLE EN STAGING ACTUAL**. Requiere diseño y aprobación independientes de esquema de `pedidos_oficiales` y snapshot inmutable; posteriormente probar que editar un destinatario no modifica un pedido histórico. No crear pedidos reales ni simulados sin aprobación específica.

**Fase 5 — cierre y reversión:** deshabilitar función según runbook aprobado, revertir cualquier despliegue autorizado, conservar evidencias, comprobar cero filas ficticias; no eliminar datos ni alterar secuencias sin aprobación. Si se alteran ACL en una etapa futura, restaurar solo grants originales según snapshot y aprobación de reversión.

## Decisión

**GO** para planificación y pruebas offline; **NO-GO** para pruebas HTTP reales, cambios de permisos, pedidos/historial, despliegue y activación. Prioridad: resolver contrato de pedidos históricos mediante diseño separado, sin tocar producción.
