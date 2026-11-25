# Auditoría de metadatos de funciones de autenticación — staging, solo lectura

Fecha: 2026-11-10. Base autorizada: `59d31d0c313c0fab00db90e18b18d1b156e680ca`. Único proyecto consultado: `enlace-digital-staging` (`xqahthghvozeigbojhyi`). Proyecto producción `ubrvuplslconfxwpfzxj` fuera de alcance. Consultas SELECT exclusivamente a `pg_proc`, `pg_namespace`, `pg_depend` y funciones de metadatos `pg_get_userbyid`, `pg_get_function_identity_arguments`, `has_function_privilege`. **No se ejecutó ninguna función de autenticación**, no se consultaron sus cuerpos, datos personales ni secretos; no se modificó Supabase.

## Inventario de metadatos observado
Todas las diez funciones tienen propietario `postgres`, `search_path` configurado al valor vacío (representado por `search_path=""`), y permisos efectivos EXECUTE denegados a `anon` y `authenticated`. Las ACL explícitas solo contienen `postgres` y, donde se indica, `service_role`; no se observó concesión EXECUTE a PUBLIC.

| Función (esquema) | Modo | EXECUTE service_role | Resultado |
|---|---|---|---|
| `enlace_auth.ed_consumir_token_correo_privado` | DEFINER | Sí | Restringida a roles privilegiados |
| `enlace_auth.ed_emitir_token_correo_privado` | DEFINER | Sí | Restringida a roles privilegiados |
| `public.ed_cliente_direccion_privada` | DEFINER | Sí | Restringida a roles privilegiados |
| `public.ed_cliente_limite_privado` | DEFINER | Sí | Restringida a roles privilegiados |
| `public.ed_cliente_login_privado` | DEFINER | Sí | Restringida a roles privilegiados |
| `public.ed_cliente_registrar_privado` | DEFINER | **No** | Función legacy o ruta obsoleta por confirmar |
| `public.ed_cliente_registrar_residencia_privado` | DEFINER | Sí | Ruta de registro con residencia habilitada |
| `public.ed_cliente_sesion_privada` | DEFINER | Sí | Restringida a roles privilegiados |
| `public.ed_correo_consumir_token_servicio` | INVOKER | Sí | Requiere permisos de invocador |
| `public.ed_correo_emitir_token_servicio` | INVOKER | Sí | Requiere permisos de invocador |

## Dependencias de catálogo y límites
La consulta de `pg_depend` para estas diez funciones devolvió únicamente referencias de tipo normal a `pg_namespace` y `pg_language`; **no encontró dependencias explícitas de tablas ni de otras funciones en ese catálogo**. Esto **no prueba ausencia de dependencias en los cuerpos PL/pgSQL ni en SQL dinámico**. Para identificar esas dependencias haría falta una auditoría adicional de cuerpos o de contratos del repositorio, con autorización apropiada. La consulta inicial de permisos intentó resolver el pseudo-rol `PUBLIC` como rol real y falló sin efectuar cambios; se corrigió para utilizar ACL explícitas y comprobaciones efectivas de los tres roles reales.

## Riesgos, decisiones y NO-GO
- **R01 — privilegios de propietario:** `postgres` como propietario de ocho funciones DEFINER exige revisión de sus comprobaciones de identidad, acceso a tablas y rutas de llamada. EXECUTE restringido es una defensa, no certificación de seguridad.
- **R02 — función de registro antigua:** `ed_cliente_registrar_privado` no es ejecutable por `service_role`; no otorgar EXECUTE sin comprobar si está retirada. Contrastar con la ruta `ed_cliente_registrar_residencia_privado` y el controlador en GitHub.
- **R03 — search_path:** valor vacío explícito reduce riesgos de resolución ambigua, pero no prueba que todas las referencias internas estén calificadas; no inspeccionamos cuerpos.
- **R04 — funciones de correo:** wrappers INVOKER públicos no son accesibles a `anon`/`authenticated` por EXECUTE; no se han ejecutado ni activado correos.
- **R05 — dependencias incompletas:** `pg_depend` no enumera todas las referencias del cuerpo PL/pgSQL. No autoriza borrar, renombrar ni migrar objetos.
- **R06 — permisos sobre clientes:** la lectura P01–P08 anterior identificó ausencia de grants directos de `service_role` sobre `clientes_oficiales`. Las funciones DEFINER pueden operar bajo el propietario, pero no se ha probado funcionalmente.
- **R07 — GitHub Actions:** la consulta de ejecuciones asociadas al commit base `59d31d0c313c0fab00db90e18b18d1b156e680ca` devolvió una lista vacía y la consulta de estados combinados también; esto **no equivale a éxito**. El workflow incluye disparadores `push` para la rama y `pull_request` a main, además de `workflow_dispatch`. No hay fallo concreto de test demostrado que corregir en ese commit. Comprobar nuevamente el nuevo commit.

## Criterios para continuar
1. Verificar ejecución real y jobs de GitHub Actions; si no hay ejecución, mantener estado CI **NO VERIFICADO**, sin simular PASS.
2. No cambiar grants, funciones, políticas, tablas ni ejecutar pruebas funcionales sin autorización nueva.
3. Para ampliar auditoría, comparar únicamente el controlador GitHub con la lista de RPC observadas; la lectura de cuerpos o cambios operativos requieren autorización específica.
4. El criterio NO-GO sigue vigente para migraciones, activación de servicios, correos y pedidos reales.

## Reversión
Los únicos cambios de esta etapa son este informe y comprobaciones estáticas en GitHub. Revertir esos commits restaura el repositorio; no hay cambios de Supabase ni de producción que revertir.
