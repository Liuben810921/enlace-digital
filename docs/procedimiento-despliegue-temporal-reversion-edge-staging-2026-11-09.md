# Procedimiento propuesto — despliegue temporal y reversión de Edge en staging

**NO EJECUTAR SIN AUTORIZACIÓN ESPECÍFICA.** Solo proyecto `xqahthghvozeigbojhyi` (`enlace-digital-staging`). Nunca usar producción `ubrvuplslconfxwpfzxj`. Función `enlace-cliente-auth-staging` y rama PR #2.

## Puerta 0 — aprobación previa

1. Confirmar commit exacto y CI verde (typecheck, tests locales con mocks, SQL estático). Confirmar que la función sigue desactivada y no desplegada; verificar estado de proyecto y ausencia de clientes ficticios mediante consultas de solo lectura.
2. Validar por separado autorización de **despliegue** y autorización de **activación**; la primera no implica la segunda. Toda prueba de registro/login/direcciones con escritura exige otra autorización explícita con plan de limpieza y aceptación de avance no transaccional de secuencias.
3. Revisar origen HTTPS real de preview y aprobar `ED_STAGING_ALLOWED_ORIGIN`. No usar `staging-preview.invalid`. Confirmar políticas de proxy: el código actual **no utiliza cabeceras de IP externas**, y aplica un bucket IP compartido; evaluar impacto sobre tráfico antes de habilitar.
4. Confirmar secreto `SUPABASE_SERVICE_ROLE_KEY` restringido al proyecto staging, no registrarlo en logs ni GitHub. Confirmar que las cuatro RPC externas requieren service_role, auxiliar no, y anon/authenticated no tienen EXECUTE. Comprobar separación de funciones y ausencia de endpoints de producción.
5. Confirmar que `ED_STAGING_CUSTOMER_AUTH_ENABLED` no está en `true`, que pedidos reales/correos permanecen desactivados y que existe autorización de reversión.

## Fase A — despliegue inerte (solo tras autorización específica)

1. Identificar y documentar versión/identificador de despliegue previo, configuración, secretos y origen. Guardar copia de código/configuración de staging para reversión. Si existe función con el mismo nombre, detenerse y pedir revisión de diferencias.
2. Desplegar únicamente `supabase/functions/enlace-cliente-auth-staging/index.ts` al proyecto staging, manteniendo `ED_STAGING_CUSTOMER_AUTH_ENABLED` desactivado. No publicar rutas en el frontend ni enviar tráfico de usuarios.
3. Confirmar mediante petición controlada que devuelve 503 por desactivación, sin consultas de datos ni envíos de correo. Registrar evidencia y detenerse. **No habilitar** sin segunda autorización.

## Fase B — habilitación temporal (autorización independiente)

1. Aprobar origen CORS, proxy/IP, límites, período de ventana y pruebas de aislamiento; fijar un tiempo máximo de exposición y responsables de parada.
2. Activar exclusivamente staging con `ED_STAGING_CUSTOMER_AUTH_ENABLED=true`; comprobar URL y CORS preflight autorizado/rechazado, método no permitido, cuerpos inválidos y excesivos.
3. Ejecutar la matriz de `docs/plan-integracion-edge-aislamiento-staging-2026-11-09.md` con cuentas ficticias: registro Cuba/extranjero, login, bloqueo/rate limiting, sesiones, revocación, destinatarios y direcciones. Verificar que el cliente B no ve ni modifica datos de A. Prohibido usar cuentas o correos reales.
4. Registrar estado de tablas, secuencia, códigos HTTP y logs sanitizados. No activar checkout ni pedidos reales.

## Fase C — reversión y postflight

1. Desactivar inmediatamente `ED_STAGING_CUSTOMER_AUTH_ENABLED` y verificar 503. Ante fallo de aislamiento, permisos, CORS o límite, detener las pruebas y desactivar sin esperar.
2. Restaurar versión anterior de la función si existía; si era nueva, retirar o dejar inerte según autorización y capacidades del proveedor. Confirmar ausencia de rutas frontend activas.
3. Limpiar exclusivamente datos ficticios mediante procedimiento previamente autorizado; nunca eliminar clientes reales ni reiniciar secuencias. Consultar tablas y permisos de solo lectura y documentar efectos no reversibles.
4. Comparar estado final con preflight; registrar CI, despliegue, pruebas, anomalías y cierre. No considerar producción lista por aprobar staging.

## Criterios de aceptación / parada

**Aceptar:** CI verde, proyecto y secretos correctos, endpoint inerte inicialmente, CORS exacto, permisos de servicio restringidos, ningún cruce entre clientes, rate limits funcionales, reversión confirmada y cero datos ficticios tras limpieza autorizada.

**Detenerse:** proyecto equivocado, secretos inesperados, origen no aprobado, cabeceras IP sin confianza verificada, función preexistente no inventariada, acceso cruzado, correo real, pedidos reales, escrituras no autorizadas, datos preexistentes inesperados o imposibilidad de reversión.

**Estado al redactar:** procedimiento únicamente documentado; ningún despliegue, activación, prueba con escrituras ni modificación de Supabase ejecutados.
