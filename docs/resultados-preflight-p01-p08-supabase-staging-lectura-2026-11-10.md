# Resultado de preflight P01–P08 — Supabase staging, solo metadatos

Fecha: 2026-11-10. Base: `cb8c51a73ef62e10ac9e36cc63f808ec0ac55179`. Proyecto consultado exclusivamente: `enlace-digital-staging`, ref `xqahthghvozeigbojhyi`; proyecto producción `enlace-digital-db` ref `ubrvuplslconfxwpfzxj` **no consultado**. Solo se ejecutaron consultas SELECT sobre catálogos de PostgreSQL y llamadas administrativas de lectura; sin registros de clientes, PII ni valores de secretos. Sin DDL/DML ni migraciones.

## Matriz de resultados
| Control | Evidencia de metadatos | Estado |
|---|---|---|
| P01 Identidad | Staging ACTIVE_HEALTHY, región us-east-1, PostgreSQL 17; proyecto de producción distinto | PASS identidad |
| P02 Tablas | `public` contiene únicamente `clientes_oficiales`, `clientes_destinatarios`, `clientes_direcciones_entrega`; faltan productos, pedidos, inventario | PASS inventario / NO-GO migración dependiente |
| P03 Columnas y tipos | `clientes_oficiales.numero integer/int4`; `clientes_destinatarios.id` y `clientes_direcciones_entrega.id bigint/int8`; ambas `cliente_numero integer/int4`; columnas y nulabilidad enumeradas | PASS esquema existente / PENDIENTE catálogo |
| P04 Claves y restricciones | PK `clientes_oficiales(numero)`, PK `id` en destinatarios/direcciones; ambas FK `cliente_numero` a cliente con ON DELETE CASCADE; `clientes_oficiales.auth_user_id` FK a `auth.users(id)`; UNIQUE codigo/auth_user_id; `ed_cliente_cuba_direccion_ck` está NOT VALID | PASS identificación / NO-GO validar CHECK antes de migrar |
| P05 RLS y políticas | Las tres tablas tienen RLS enabled; `pg_policies` en public devuelve **cero políticas** | PASS RLS activo / revisar acceso efectivo por RPC |
| P06 Grants | `anon` y `authenticated` sin SELECT/INSERT/UPDATE/DELETE sobre las tres tablas. `service_role` tiene los cuatro permisos sobre destinatarios/direcciones; **ninguno** sobre clientes_oficiales | PASS lectura / NO-GO asumir acceso directo a clientes |
| P07 Funciones | 10 funciones enumeradas en `public` y `enlace_auth`; 8 SECURITY DEFINER, 2 INVOKER; todas muestran `search_path` configurado. Ninguna EXECUTE para anon/authenticated; service_role puede ejecutar 9/10; excepción `ed_cliente_registrar_privado` | PASS metadatos / PENDIENTE auditoría del cuerpo/propiedad y rutas efectivas |
| P08 Clientes/destinatarios/direcciones | Tipos de relación compatibles integer, FK existentes; restricción de domicilio Cuba NOT VALID; pertenencia de filas **no comprobada** (no se leyó PII) | PASS estructura / NO-GO afirmar integridad de datos |

## Riesgos y decisiones
1. **P04/P08:** `ed_cliente_cuba_direccion_ck` marcada `NOT VALID`: puede aplicarse a escrituras nuevas, pero **no certifica filas anteriores**. Su validación futura requiere autorización separada; no ejecutar ahora.
2. **P04:** `ON DELETE CASCADE` de cliente a destinatarios/direcciones es el esquema actual, distinto del criterio futuro de snapshots inmutables de pedidos. No modificar FKs existentes; los pedidos deberán preservar sus snapshots.
3. **P05/P07:** RLS sin políticas no equivale a fallo de seguridad ni de autenticación: las RPC SECURITY DEFINER pueden usar permisos del propietario. Deben revisarse sus cuerpos, ownership, privilegios efectivos y ruta de llamada antes de cambios.
4. **P06:** `service_role` sin privilegios directos sobre `clientes_oficiales`; no conceder privilegios por inferencia. `ed_cliente_registrar_privado` carece de EXECUTE para service_role mientras `ed_cliente_registrar_residencia_privado` sí lo tiene; determinar cuál es la ruta vigente.
5. **P02:** las tablas futuras de catálogo/pedidos/stock/reservas aún no existen. No ejecutar migraciones fuera de orden; P09–P20 permanecen pendientes.
6. **P07:** esta inspección no lee cuerpos de funciones ni secretos y no valida semántica, escalación de privilegios ni autenticación funcional.

## Cierre y reversión
No se modificó Supabase, datos, funciones, permisos ni producción. Los únicos cambios de esta etapa son documentos, pruebas estáticas y workflow de GitHub: reversión mediante revert de esos commits. **NO-GO** para DDL, migraciones, pruebas de escritura, despliegue, activación de servicios/correos y pedidos reales. Para P09–P20 o auditoría profunda de funciones se necesita autorización específica.
