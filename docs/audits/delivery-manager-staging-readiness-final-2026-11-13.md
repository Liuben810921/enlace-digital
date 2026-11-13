# ENLACE DIGITAL — Dictamen final de preparación para staging del cotizador de gestores y mensajería

**Fecha:** 13 de noviembre de 2026  
**Alcance:** revisión de contratos y pruebas **sintéticas** en `audit/delivery-map-readonly-20261113`, sin acceder a Supabase ni staging.  
**Dictamen:** **NO-GO para integración en staging** hasta resolver bloqueantes y obtener autorización específica.  
**Último CI verificado:** [GitHub Actions #43502939445](https://github.com/Liuben810921/enlace-digital/actions/runs/43502939445), `completed/success`, commit `e7305fd9b5d1fdcbbf04fe846aec250044722a3f`. El informe, al ser un cambio solo documental, no constituye una nueva ejecución de CI.

## 1. Evidencia consolidada

| Dominio | Evidencia revisada | Alcance real | Estado |
|---|---|---|---|
| Cotización y promociones | `delivery-accounting-manager-isolated.cjs`, pruebas de contabilidad y paridad del núcleo compartido | Redondeo, entrega gratuita, importe comercial vs cobertura promocional | Sintético aprobado |
| Gestores y direcciones | `delivery-manager-server-contract-isolated.cjs`, `delivery-manager-integrated-boundary-isolated.cjs` y pruebas adversariales | Rechazo de campos de cliente no autorizados, asignaciones y destinos alternativos | Sintético aprobado |
| Permisos | `delivery-manager-policy-route-audit-isolated.cjs` | Matriz de roles y operaciones permitidas | Contrato de laboratorio, no permisos efectivos |
| Procedencia de rutas | `verifyRouteProvenance` y pruebas de integración | Asociación a destino, cesta, orígenes, versión y caducidad | Contrato de laboratorio, no prueba de proveedor real |
| Tarifas y auditoría | `changeSettings`, `verifyAuditEntry`, `quote_lab.change_threshold` | Autorización simulada, control de versión, evento de cambio | Sin almacenamiento append-only operativo |
| Idempotencia | `delivery-manager-concurrency-idempotency-isolated.cjs`, `postgres-delivery-quote-lab.sql` | Reintentos, conflicto de payload, fila única por actor/clave | PostgreSQL desechable aprobado |
| Concurrencia y recuperación | `postgres-delivery-quote-lab.sh`, `postgres-delivery-resilience-lab.py`, `postgres-delivery-recovery-lab.py` | Sesiones paralelas, deadlock 40P01, rollback, timeout, cancelación, corte de backend | PostgreSQL desechable aprobado |
| CI | `isolated-delivery-quote.yml` | Pruebas Node y PostgreSQL 16 efímero, sin desplegar | Último workflow: success |

**Advertencia de trazabilidad:** la última ejecución de CI corresponde al código del commit indicado. Los cambios documentales posteriores no implican revalidación de código ni despliegue. La ejecución no constituye aprobación de seguridad de un backend operativo.

## 2. Bloqueantes obligatorios antes de staging

**B01 — Identidad, permisos y separación de clientes (crítico).** El principal y las asignaciones se construyen hoy como fixtures. Implementar identidad de sesión verificada en servidor, autorización de cada acceso a cesta/cliente/dirección y separación por gestor. Confirmar el alcance de lectura de auditoría del supervisor. Probar roles maliciosos y aislamiento entre gestores sin utilizar clientes reales.

**B02 — Origen confiable de rutas (crítico).** `trustedByServer:true` y `source:'server_route_provider'` son campos de un objeto de laboratorio: un cliente podría falsificarlos si se expusieran. Exigir verificación del proveedor/caché exclusivamente en servidor, integridad del registro, revisión de origen, destino y versión de despacho, y rechazo de rutas de otro contexto. Definir el plazo máximo de validez con aprobación comercial.

**B03 — Importe calculado en servidor (crítico).** `quote_lab.quote` acepta `p_amount` como parámetro sintético y `quote_bound` solo valida versiones de ruta: **ninguna de esas funciones debe exponerse como cotizador real**. El importe debe derivarse de cesta autorizada, tarifa versionada y distancias verificadas dentro de una frontera transaccional. Mantener por separado valor bruto, pago del cliente, cobertura de promoción y coste efectivo del transportista.

**B04 — Idempotencia duradera y carreras (crítico).** Diseñar tabla de operaciones con UNIQUE por identidad y clave, huella canónica de la solicitud completa, estado de ejecución, control de expiración y respuesta inmutable. El fixture JS solo incorpora `request`, `principalId` y `routeId` a su huella; no debe tomarse como esquema definitivo de integridad. Proteger cambios concurrentes de cesta, dirección, despacho y tarifas, y resolver commits de resultado desconocido con consultas de estado y reintentos seguros.

**B05 — Auditoría administrativa (alto).** Registrar transaccionalmente autor, motivo, versiones y valores anteriores/nuevos; permisos mínimos de escritura y lectura; conservación, detección de manipulación y reversión de cambios. El SHA-256 aislado del fixture no aporta inmutabilidad ni autenticidad.

**B06 — Seguridad operativa y privacidad (alto).** Definir RLS/permisos de base de datos y RPC mínimas, validación de entradas, límites de tamaño y tasa, timeouts, errores sin filtración, registros sin direcciones sensibles, control de secretos, backups y recuperación. Mantener registro de clientes y pedidos reales desactivados durante pruebas.

**B07 — Prueba de integración autorizada (alto).** Validar con datos ficticios en staging solo tras autorización independiente: sesiones de Cuba/extranjero, destinatarios y direcciones persistentes, gestor autorizado, dirección alternativa, almacenes múltiples, cambios de tarifas y reintentos. Sin activar correos, pagos ni pedidos reales.

## 3. Decisiones funcionales pendientes

- Política definitiva de `supervisor` (solo lectura de auditoría, sin edición).
- Vigencia comercial de una ruta/cotización y retención de claves de idempotencia; los TTL de laboratorio no están aprobados.
- Procedencia de la ruta, proveedor, tratamiento de indisponibilidad y almacén de referencia.
- Reglas definitivas de redondeo, tarifas especiales, umbral de entrega gratuita y responsabilidad contable por promoción.
- Tratamiento de una cotización obsoleta: recalcular y exigir nueva confirmación, nunca cobrar silenciosamente otro importe.

## 4. Plan de integración propuesto — NO EJECUTAR

**Fase P0: preflight exclusivamente de lectura.** Con autorización separada, verificar inventario de funciones, roles, políticas, variables, copias de seguridad, entorno de pruebas, origen permitido y desactivación de pedidos/correos/pagos. No imprimir secretos.

**Fase P1: diseño y revisión.** Definir esquema SQL/RPC con autorización y RLS, versión de cesta/destino/origen/tarifa, ruta verificable, idempotencia y auditoría. Revisar migraciones y plan de recuperación antes de escribir.

**Fase P2: despliegue controlado en staging sintético.** Requiere autorización expresa distinta de la presente. Aplicar migraciones con registro de versiones y banderas de función inicialmente desactivadas; no utilizar datos reales ni invocar integraciones externas.

**Fase P3: pruebas de integración.** Ejecutar matriz positiva/adversarial, concurrencia y fallos inducidos, verificar permisos de gestores, administrador y supervisor, trazabilidad de rutas y conservación del valor contable.

**Fase P4: decisión de habilitación.** Presentar evidencias, riesgos residuales y criterios de aceptación. No activar el cotizador, correos, pagos o pedidos reales sin nueva aprobación.

### Criterios de entrada a staging

B01–B06 resueltos en diseño revisado; ambiente segregado y sin datos reales; plan de backup/rollback verificado; banderas desactivadas; Owner autoriza por separado el alcance exacto.

### Criterios de salida de staging

Pruebas integradas y adversariales aprobadas; ninguna filtración entre gestores; versiones y rutas verificadas; idempotencia sin duplicados; auditoría completa; recuperación probada; evidencias reproducibles y autorización final.

## 5. Plan de reversión — NO EJECUTAR

1. Desactivar inmediatamente la bandera de cotización y bloquear nuevas operaciones, manteniendo pedidos reales inactivos.
2. Preservar logs técnicos y registro de cambios sin exponer datos personales; identificar operaciones de prueba en curso.
3. Revertir código de staging al commit conocido, sin tocar producción; para esquema SQL usar migración inversa **solo si es segura y previamente probada**, nunca borrar tablas con registros sin evaluación.
4. Restaurar la configuración anterior mediante versión controlada; invalidar cotizaciones, rutas y claves asociadas a la versión fallida.
5. Revalidar permisos, autenticación, integridad y flujos existentes; documentar incidente y obtener nueva autorización antes de reintentar.
6. Si una reversión de esquema es insegura, mantener la funcionalidad desactivada y usar recuperación por avance correctivo; no improvisar restauraciones de datos.

## 6. Riesgos residuales que no cubre el CI

- No se ha probado un corte de red **exactamente durante** el protocolo COMMIT, caída completa del servidor ni despliegue multinodo.
- Los fixtures no prueban integración con autenticación real, rutas de terceros, RLS, datos persistentes de clientes o checkout.
- La última batería no demuestra que las políticas de permisos y las funciones SQL estén unidas en una misma frontera real.
- La retención y política de caducidad de operaciones y cotizaciones siguen sin especificación comercial definitiva.

## 7. Dictamen y límites de autorización

**NO-GO para staging en este momento.** La batería aislada ha cumplido su objetivo de detectar y ejercitar fallos transaccionales con datos sintéticos; no debe interpretarse como autorización para integrar servicios reales.

**Próximo entregable permitido sin nuevas autorizaciones:** especificación técnica revisable de backend (SQL/RPC, permisos, rutas y auditoría) y matriz de aceptación, únicamente en GitHub y sin despliegue.

**Restricciones observadas en esta auditoría:** no acceder ni modificar Supabase, staging, producción, clientes reales ni pedidos. No ejecutar migraciones ni activar servicios.
