# Auditoría consolidada F6-B13 a F6-B30 — alcance sintético

Fecha: 2026-11-10. PR #3 en borrador. Revisión de los ensayos aislados en GitHub Actions con PostgreSQL desechable.

## Decisión
**PASS para el alcance sintético aislado; NO-GO para producción y staging sin validación integrada.** No equivale a certificación de seguridad ni autorización de despliegue.

## Evidencia de cierre
- F6-B13–B22: controles de aislamiento, esquemas prospectivos, permisos, sesiones y pruebas SQL de laboratorio incorporadas al workflow; su ejecución queda cubierta por la pasada completa de CI.
- F6-B23: contrato de idempotencia por operación ED-OP-v1, identidad por rol sintético y hash servidor.
- F6-B24–B25: JSON crudo, límites léxicos, claves duplicadas, escapes, canonicalización estable, divergencias de parser y concurrencia.
- F6-B26: rollback ante pérdida de conexión y reintentos por identidad.
- F6-B27: cancelación, timeouts, recuperación y ACL/RLS.
- F6-B28: 40P01, 40001, 57014, 55P03 y reintentos transaccionales.
- F6-B29: clasificación fail-closed, presupuesto de 3 intentos, jitter determinista y cancelación simulada.
- F6-B30: confirmación ambigua antes y después de COMMIT, reconciliación mediante la misma clave, payload e identidad.
- **CI final**: GitHub Actions #141, run 42915349887, commit 786662808f0cbaeb1e7847dd02a103fd3cf20b17: SUCCESS, sin pasos fallidos. La ejecución #139 falló en la aserción del observador por incluir la línea de salida del comando SET; corregido y vuelto a verificar.

## Pendientes necesarios antes de declarar seguridad integrada completa
1. **Staging**: verificar autenticación real, JWT, privilegios de las funciones, políticas RLS, secretos y configuración de orígenes. Requiere autorización independiente.
2. **Integración funcional**: registro Cuba/extranjero, sesiones, recuperación de contraseña, destinatarios, permisos de administración y gestores, checkout ficticio y trazabilidad histórica; siempre con pedidos reales desactivados.
3. **Efectos externos**: idempotencia real ante pagos, inventario, correo y red; el contrato sintético no garantiza exactly-once de sistemas externos.
4. **Operación**: plan de reversión, monitoreo, cuotas, recuperación ante desastre, límites de reintentos efectivos y comprobaciones de lanzamiento.
5. **Históricos**: cualquier lectura de datos reales/históricos requiere autorización independiente; no se hizo.

## Política de cierre y cambios
La serie de ensayos sintéticos queda cerrada como **PASS**, salvo defectos concretos detectados posteriormente. No iniciar fases F6-B31+ por inercia. Cualquier riesgo nuevo exige evidencia, severidad, alcance y criterio de aceptación. Mantener PR #3 sin fusionar y sin despliegue. No consultar ni modificar Supabase, staging, producción, código operativo, clientes, históricos, servicios, correos o pedidos sin nueva autorización específica.

## Limitaciones de evidencia
La ejecución de CI valida los fixtures y scripts presentes en la rama, no la configuración de entornos externos. No se ha realizado pentest ni evaluación independiente; la estimación previa de 90 % era orientativa de las pruebas sintéticas, no cobertura cuantitativa del sistema.
