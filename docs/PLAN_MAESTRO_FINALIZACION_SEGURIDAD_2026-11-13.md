# ENLACE DIGITAL — Plan Maestro de Finalización y Seguridad

**Versión:** 1.0 · **Fecha:** 13-11-2026 · **Estado:** planificación y preparación, sin despliegue
**Rama:** `plan/maestro-finalizacion-seguridad-20261113`
**Origen comprobado:** `7219b4c6d19ea82300d20291860a862bab15fc87` (rama de laboratorio).
**Producción `main` consultada solo para referencia de HEAD:** `70d9cf2d6dd42c0b7d6bc8f0ed910556341558ec`. No se presume que el laboratorio esté integrado en `main`.

## 1. Objetivo, alcance y límites

Entregar una tienda móvil y web funcional, segura y operable, con catálogo, clientes, destinatarios, gestores, cotizaciones de entregas, administración y pedidos, sin habilitar cobros ni pedidos reales antes de autorización ejecutiva específica.

Este plan distingue **implementado en interfaz**, **probado en laboratorio sintético**, **integrado en backend real**, **probado en staging** y **habilitado para producción**. Ninguna de esas etapas equivale automáticamente a la siguiente. La aprobación de CI del laboratorio no certifica un servicio productivo.

**Restricciones de esta fase:** GitHub aislado únicamente; no acceder ni modificar Supabase, staging, producción, clientes reales, pedidos, servicios externos, correo o pagos; no hacer merge ni deploy. La planificación no concede permiso para ejecutar fases posteriores.

## 2. Inventario comprobado y brechas

| ID | Área | Evidencia del repositorio | Estado comprobado | Brecha para lanzamiento |
|---|---|---|---|---|
| F01 | Catálogo, departamentos y administración | `index.html` | Interfaz y lógica presentes | Prueba integral móvil, persistencia/roles y publicación de productos reales |
| F02 | Carrito, inventario y vista previa | `index.html`, `tests/customer-order-flow.cjs` | Simulación y pruebas de flujo; `ED_REAL_CHECKOUT_ENABLED=false` | Backend autoritativo de precio/stock, persistencia de pedido, idempotencia y activación separada |
| F03 | Registro, sesión, clientes y destinatarios | `index.html`, `tests/customer-order-flow.cjs`, documentación staging | Flujos de interfaz y pruebas simuladas | Certificación integral de Cuba/extranjero, recuperación y permisos en staging autorizado |
| F04 | Gestores, comisiones y cuentas | `index.html` muestra «Cuenta de gestor · Próximamente»; `tests/delivery-accounting-manager-isolated.*` | Contratos y cálculo sintéticos | Identidad real, asignaciones, panel, persistencia y conciliación de comisiones |
| F05 | Tarifas y administración de entregas | `index.html`, `docs/audits/delivery-map-current-state-2026-11-13.md` | Interfaz administrativa/laboratorio; tarifas locales de demostración | Parámetros persistentes, orígenes efectivos, cotizador autorizado e integración con compra |
| F06 | Rutas y mapas de La Habana | `docs/audits/osmand-delivery-integrated-readiness-2026-11-13.md` | Matrices ficticias y pruebas aisladas | Proveedor y distancias viales reales validados; fallback «tarifa pendiente de confirmar» |
| F07 | PostgreSQL, RLS, RPC, idempotencia y carreras | `tests/postgres-delivery-rpc-rls-lab.*`, `tests/postgres-delivery-context-races-lab.py` | PostgreSQL 16 desechable, CI satisfactoria | Adaptación a identidad y arquitectura reales, migraciones revisadas, pruebas integradas |
| F08 | Correo y recuperación | `docs/plan-prueba-integral-staging-2026-11-09.md`, `supabase/functions/` | Planes y prototipos; prueba integral de correo en staging documentada como pendiente | Prueba autorizada con rollback, configuración transaccional, sin envíos hasta aprobación |
| F09 | Operación y controles | `.github/workflows/isolated-delivery-quote.yml`, `.github/workflows/verify-storefront.yml` | CI sintética y validaciones estáticas | Backups/restore, observabilidad, límites de tasa, gestión de secretos, procedimientos de incidente |
| F10 | Promoción, despacho y contabilidad | `tests/delivery-manager-server-contract-isolated.*`, `docs/design/` | Reglas de laboratorio | Reglas comerciales aprobadas y paridad real entre cotización, promoción y liquidación |

**Nota de evidencia:** `verify-storefront.yml` contiene comprobaciones que hacen solicitudes a un endpoint desplegado en ejecuciones sobre `main`; no ejecutar ese workflow ni disparar cambios a `main` bajo esta autorización. El workflow aislado usa PostgreSQL efímero y pruebas Node.

## 3. Bloqueantes críticos agrupados — sin microauditorías

- **S1 Identidad y autorización:** autenticación verificable en servidor, sesiones, cliente/gestor/admin/supervisor, propiedad de cesta/destinatario, permisos mínimos y RLS adaptada al pool de conexiones real. No trasladar `session_user` del laboratorio sin adaptar la arquitectura.
- **S2 Integridad comercial:** precio, inventario, subtotal, tarifas, promociones y comisiones calculados en backend; versiones de cesta/dirección/origen/ruta/tarifa, idempotencia persistente, protección contra carreras y reintentos.
- **S3 Rutas y origen:** proveedor confiable, origen efectivamente usado, validación de La Habana, trazabilidad, caché y caducidad, sin cobrar distancias inventadas.
- **S4 Privacidad y operación:** aislamiento de clientes, protección de secretos y PII, rate limiting, errores seguros, auditoría administrativa, respaldo/restauración y reversión.
- **S5 Pruebas de integración:** registro Cuba/extranjero, destinatarios, sesión y recuperación, cotización, permisos y checkout ficticio completo en staging segregado; banderas de pedidos, correo y pagos desactivadas.

Los hallazgos de severidad crítica/alta deben resolverse antes de lanzamiento. Los de menor severidad se documentan con responsable, mitigación y aceptación explícita; no se reabren ciclos ilimitados sin evidencia nueva.

## 4. Ruta de ejecución y dependencias

| Orden | Entregable | Dependencias | Prueba de aceptación / salida |
|---|---|---|---|
| P0 | Línea base, matriz de funcionalidades y arquitectura de integración | Inventario GitHub y decisiones existentes | Cada flujo con propietario técnico, estado, dependencia, riesgo y prueba |
| P1 | Registro, sesiones, direcciones y destinatarios listos para integración | S1, diseño de almacenamiento y recuperación | Pruebas automáticas de Cuba/extranjero, titularidad, sesión inválida, duplicados y persistencia; sin pedidos reales |
| P2 | Roles de gestores y administración de comisiones | P1, S1 y modelo contable | Gestor ve solo clientes asignados; supervisor solo lectura; comisiones y cambios auditados |
| P3 | Administración de entregas y motor de cotización | P1/P2, S2/S3 | Distancia mínima 3 km, tarifas editables, multi-origen efectivo, tarifa especial, promociones, caducidad, fallos de ruta y concurrencia |
| P4 | Carrito y checkout integrados en simulación | P1/P3, backend autoritativo | Flujo completo con datos ficticios; cambios de stock/precio/dirección invalidan cotización; ninguna escritura de pedido real |
| P5 | Pruebas integrales en staging | P1–P4, S4, autorización separada | Evidencia reproducible, reversión y cero efectos reales; revisión móvil |
| P6 | Auditoría final integral y decisión GO/NO-GO | P5 y controles operativos | Matriz completa firmada; cero críticos/altos abiertos; aprobación ejecutiva separada |
| P7 | Lanzamiento controlado | GO y autorizaciones explícitas | Activación gradual, monitoreo, soporte y plan de reversión |

**P0–P4 pueden prepararse y desarrollarse en GitHub aislado** sin acceso a servicios; integración y pruebas sobre staging, `main` o producción requieren permisos independientes. La rama de laboratorio no debe fusionarse directamente: seleccionar, revisar y adaptar únicamente componentes aptos.

## 5. Criterios de aceptación transversales

Cada funcionalidad se considera **Terminada** solo si: (a) tiene requisitos y casos positivos/negativos escritos; (b) código revisado y sin datos ficticios confundibles con reales; (c) pruebas automáticas reproducibles aprobadas; (d) autenticación/autorización y privacidad verificadas; (e) concurrencia, errores y reversión tratados según riesgo; (f) prueba móvil si tiene UI; (g) evidencia de commit/CI y estado de integración documentados. **«Laboratorio aprobado» no es «Terminado en producción».**

### Criterios de lanzamiento — GO/NO-GO

1. Flujos esenciales completos: catálogo, cuenta, destinatarios, carrito, entregas, gestor, administración y pedidos.
2. Ningún hallazgo crítico o alto conocido sin resolver; pruebas adversariales de permisos y de integridad comercial satisfactorias.
3. Pruebas de extremo a extremo en staging autorizado con datos ficticios; sin efectos en clientes reales.
4. Rutas y tarifas basadas en fuente validada; fallo seguro ante distancia desconocida.
5. Backups y restauración probados, secretos protegidos, monitoreo y procedimiento de incidentes.
6. Aprobación documentada del Owner para cada activación de pedidos, pagos y correo, y plan de rollback listo.

## 6. Política de auditorías acotadas

- **Una batería de pruebas por funcionalidad**, no un informe nuevo por cada límite o carácter.
- Abrir auditoría adicional solo ante fallo reproducible, cambio relevante de superficie de ataque, incidente, dependencia crítica o revisión final.
- Priorización: seguridad de datos y dinero > autenticación y permisos > integridad/recuperación > experiencia de uso > detalles de formato.
- Cierre de fase: CI verde, criterios cumplidos, riesgos residuales documentados, sin bloqueantes críticos/altos. No buscar infinitos casos hipotéticos.
- Registrar defectos con severidad, reproducción, corrección y prueba de regresión en un único tablero.

## 7. Tablero inicial de pendientes

| ID | Prioridad | Trabajo concreto | Estado | Depende de |
|---|---|---|---|---|
| T01 | P0 | Acordar arquitectura de backend y autenticación de gestores | Pendiente de diseño | P0/S1 |
| T02 | P0 | Definir contrato servidor de cotización e integridad de precios | Preparado en laboratorio; pendiente de integración | T01/S2 |
| T03 | P0 | Definir proveedor de rutas y validar trayectos de La Habana | Pendiente | S3 |
| T04 | P0 | Integrar registro Cuba/extranjero y destinatarios en pruebas autorizadas | Pendiente de integración | T01 |
| T05 | P1 | Construir interfaz funcional de gestores y panel de comisiones | Pendiente | T01/T02 |
| T06 | P1 | Completar administración de entregas persistente y multi-origen | Pendiente | T02/T03 |
| T07 | P1 | Unir cotización segura con checkout ficticio y validación de stock | Pendiente | T04/T06 |
| T08 | P0 antes de staging | Definir backup, rollback, límites de tasa, trazas y permisos | Pendiente de verificación | S4 |
| T09 | P0 antes de lanzamiento | Pruebas integrales de autenticación, correo y recuperación | Pendiente de ejecución autorizada | T04/T08 |
| T10 | P0 antes de lanzamiento | Auditoría final de seguridad y decisión GO/NO-GO | No iniciada | P5 |

## 8. Siguiente paquete de trabajo autorizado en GitHub

**Paquete D1 (solo GitHub, sin integración externa):** elaborar contrato de identidad/roles y modelo de gestores, definir estados y pruebas del panel de comisiones, especificar API de cotización servidor y diseñar interfaz aislada móvil. No activar funciones, no usar secretos, no conectar servicios, no modificar `main`. Añadir pruebas automatizadas por funcionalidad y verificar CI únicamente del laboratorio aislado. Una vez preparado, solicitar autorización separada para integrar con staging.

## 9. Referencias verificadas

- `index.html` — tienda, checkout desactivado y cuenta de gestor pendiente.
- `tests/customer-order-flow.cjs` — flujo simulado de cliente/destinatarios.
- `.github/workflows/isolated-delivery-quote.yml` — pruebas Node y PostgreSQL 16 desechable.
- `.github/workflows/verify-storefront.yml` — incluye verificaciones sobre endpoint desplegado en `main`; no ejecutar bajo este alcance.
- `docs/audits/delivery-manager-staging-readiness-final-2026-11-13.md` — NO-GO para staging sin bloqueantes resueltos.
- `docs/audits/delivery-map-current-state-2026-11-13.md` — estado del sistema de entregas.
- `docs/audits/osmand-delivery-integrated-readiness-2026-11-13.md` — rutas viales y móvil pendientes.
- `docs/plan-prueba-integral-staging-2026-11-09.md` — pruebas de correo aún pendientes.
- [GitHub Actions #43538679607](https://github.com/Liuben810921/enlace-digital/actions/runs/43538679607) — laboratorio PostgreSQL/Node `completed/success`, commit `74207b4c0e2682bad4aa3e6c9e0ea5d30ba7a43e`.

**Límite de certificación:** este plan se fundamenta en lectura del repositorio y evidencias históricas de CI; no certifica el estado actual de Supabase, staging, producción ni la disponibilidad de proveedores de rutas.
