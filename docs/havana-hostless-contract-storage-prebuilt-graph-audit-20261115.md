# Auditoría Hostless y viabilidad OSRM preprocesado — 2026-11-15

**Rama:** plan/havana-osrm-benchmark-offline-20261114
**Commit base:** 6c92f9abb1cded7d931f65ab2c24dc7b6990fef0
**Alcance:** solo fuentes públicas, razonamiento técnico offline, sin consultas de rutas ni ejecución OSRM.

## Hostless: hallazgos oficiales verificables

1. **Siempre activo, registro y Docker.** La portada oficial anuncia aplicaciones siempre activas, sin tarjeta, desplegadas desde Git mediante Dockerfile. Se puede iniciar sesión con proveedor Git o Google. No se comprobó registro efectivo de una persona en Cuba. https://web.hostless.cloud/ ; https://docs.hostless.cloud/overview
2. **Cuota gratuita y contradicción de documentación.** La página de límites actual describe una bolsa compartida de 0,5 vCPU, 1 GiB RAM y 512 MiB de almacenamiento de base de datos, sin que cada app reciba esa cantidad adicional. La página antigua `/plans/free-tier` aún muestra 256 MiB y límites individuales distintos; no tomarla como configuración aplicable sin comprobar la cuenta. https://docs.hostless.cloud/plans/limits ; https://docs.hostless.cloud/plans/free-tier
3. **Facturación.** Por encima de la bolsa se cobra CPU $0.03/vCPU-h y RAM $0.003/GiB-h. La capacidad adicional exige tarjeta o crédito. El spending limit no garantiza un techo de factura para recursos facturables ya activos. https://docs.hostless.cloud/billing/costbreakdown ; https://docs.hostless.cloud/plans/limits
4. **Persistencia real.** El root filesystem de apps es read-only; /tmp (500 MiB), /root (2 GiB), /app/.cache (2 GiB) son efímeros y se borran en cada reinicio. Los volúmenes de 1–500 GiB son duraderos pero se cobran separadamente a $0.000137/GiB-h y requieren tarjeta o crédito; no participan en bolsa gratuita. https://docs.hostless.cloud/app/filesystem ; https://docs.hostless.cloud/app/configurations ; https://docs.hostless.cloud/billing/costbreakdown
5. **Continuidad.** El proveedor afirma no suspender apps gratuitas por inactividad; no se verificó SLA de producción ni política de terminación con contenido íntegro. Los despliegues por push de Git son automáticos al vincular repositorios; no se vinculó ninguno. https://docs.hostless.cloud/app/deployments
6. **Términos, privacidad y Cuba.** Existen https://hostless.cloud/terms y https://hostless.cloud/privacy, pero el contenido recuperado por la consulta pública consistió en título y navegación; **no se verificaron** jurisdicción, autorización comercial, restricciones Cuba, KYC, protección de datos ni condiciones de terminación. Ausencia de texto recuperado NO es permiso. NO-GO contractual.

## OSRM offline: preprocesamiento fuera del servidor y grafo embebido en imagen

**Hipótesis, NO prueba de funcionamiento:** preparar con `osrm-extract`, `osrm-partition` y `osrm-customize` en entorno autorizado con recursos suficientes; empaquetar todos los archivos `.osrm*` en una imagen Docker inmutable junto con `osrm-routed --algorithm mld`; el servidor solo carga el grafo y atiende consultas. Esto evita procesar el extracto PBF en el plan gratuito y evita un volumen persistente, pues los archivos de imagen se reconstruyen en cada despliegue. La ruta de la imagen es read-only, compatible con carga de grafo si no se requiere escribir en ese directorio.

**Bloqueantes técnicos:** no hay cartografía descargada ni grafo real medido, por lo que se desconocen bytes totales, RAM de arranque y régimen, page cache, tiempo de inicio, límites de imagen, latencia, consumo de CPU y cuotas de tráfico. 1 GiB RAM y 0,5 vCPU son techos de asignación gratuitos, no capacidad probada para La Habana. La imagen puede exceder límites de build, registro o arranque no comprobados. Se requiere un servicio HTTP compatible con el puerto PORT y bind 0.0.0.0 de Hostless; verificar health check y seguridad. Los archivos incluidos en imagen no son un volumen duradero editable: se pierden cambios de runtime al reiniciar. No enviar direcciones personales ni API keys a clientes.

**Dictamen técnico:** posibilidad condicional para prototipo, NO-GO de operación real. No sustituye prueba con cartografía autorizada ni verificación contractual.

## Alternativas comparables con evidencia primaria
- **blitz.cloud:** 512 MB RAM compartidos, 10 GB de almacenamiento anunciado, suspende después de 15 min sin visitas, sin tarjeta; no cumple siempre activo. https://blitz.cloud/guides/deploy-docker-container-free/
- **Scaleway Serverless Containers:** cuota gratuita basada en segundos CPU/RAM, ejemplo 0,5 vCPU y 1 GiB solo ~111 h/mes, no 24/7; no cumple servicio permanente siempre activo. https://www.scaleway.com/en/docs/serverless-containers/faq/
- **SnapDeploy:** 100 horas/mes y sleep a los 15 minutos según comparativa del propio proveedor; always-on desde $12/mes. https://somdip.dev/free-container-hosting
- **Verta Cloud:** 4 GB/50 GB anunciados, pero falta contrato, Cuba, Docker y verificación de aprovisionamiento (auditoría anterior).

## Decisión y puertas
**NO-GO Hostless para OSRM comercial real** hasta: (a) términos íntegros que permitan uso comercial y registro desde Cuba, (b) grafo OSRM de Habana medido offline con autorizaciones separadas y tamaño apto para imagen, (c) verificación de RAM y CPU y de límites de imagen/arranque, (d) protección contra cargos y plan de recuperación, (e) fiabilidad de proveedor demostrada. No se declara ninguna alternativa aprobada.

`commercialQuoteEnabled=false`.

**Restricciones observadas:** sin crear cuentas, contactar proveedores, descargar cartografía, ejecutar OSRM, activar manualmente GitHub Actions, generar costos ni acceder a Supabase, staging o producción. No se inspeccionó el estado de workflows automáticos tras el commit.
