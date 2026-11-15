# Auditoría documental Verta Cloud y alternativas — 2026-11-15

**Repositorio:** Liuben810921/enlace-digital
**Rama aislada:** plan/havana-osrm-benchmark-offline-20261114
**Base:** 028ed87292c83a0f02803f1c01b4e044b05d5f26

## Alcance y método
Revisión pública de páginas de proveedor y contraste con artículos independientes. No se creó cuenta ni se intentó aprovisionar servidores, consultar soporte, realizar pagos o ejecutar código. Evidencia fechada 2026-11-15. Las cifras de un anuncio **no equivalen a recursos verificados**.

## Verta Cloud — vertacloud.biz
**Oferta anunciada, verificable como texto público:** Linux VPS Free, 2 vCPU, 4 GB RAM, 50 GB SAS HDD, Ubuntu Server 22.04.5 LTS y puerto 100 Mbit/s, sin tarjeta de crédito. Fuente: https://portal.vertacloud.biz/index.php?rp=%2Fstore%2Ffree-vps

**Riesgos de credibilidad documental verificables:** la página corporativa https://www.vertacloud.biz/ contiene datos de contacto de ejemplo (teléfono +X XXX XXX XXXX; oficina [Office Address, City, Country]). La página https://www.vertacloud.biz/about conserva marcadores [YEAR], [LOCATION], [X]+ customers, [X] data centres y [X]% uptime. No constituyen evidencia de infraestructura operativa ni de fraude; indican que los datos públicos corporativos están incompletos.

**No confirmado:** existencia de entidad jurídica verificable; Terms of Service y AUP aplicables al plan gratis; duración y renovaciones; persistencia de disco y backups; acceso root; Docker o virtualización permitida; disponibilidad real de capacidad; restricciones de países y Cuba; registro como persona física; uso comercial; garantías/SLA; restricciones de tráfico, suspensión y borrado. La búsqueda pública específica no recuperó documentos que resolvieran estos puntos. No inferir autorización comercial de que la portada mencione 'businesses'.

**Identidad de marca:** https://vertracloud.app/terms y https://vertracloud.app/acceptable-use pertenecen a **Vertra Cloud** (Brasil), no a **Verta Cloud** (vertacloud.biz). No trasladar sus condiciones, SLA o reglas al proveedor investigado.

**Dictamen:** NO-GO para producción y para pruebas con datos reales. La oferta permanece como candidato de verificación futura, no como servidor aprobado.

## Contraste externo
- https://findstack.com/resources/free-vps-no-credit-card (septiembre 2026): análisis independiente de ofertas 'sin tarjeta'; advierte que proveedores pequeños carecen frecuentemente de compromisos de continuidad y soporte. No constituye una auditoría específica de Verta.
- https://gizmodo.com/best-web-hosting/free/vps (octubre 2026): recomienda cautela ante VPS gratuitos que no se aprovisionan o requieren muchos datos. No acredita que Verta presente esos problemas.
- https://www.ucartz.com/blog/is-free-vps-hosting-real/ (noviembre 2026): artículo comercial de un proveedor, útil como contexto, no como evidencia de imposibilidad universal ni de Verta.

## Alternativas
- Oracle Always Free: recursos superiores sobre el papel, pero requisitos de verificación y restricciones de cumplimiento comercial para Cuba previamente documentados; no aprobado. Fuente https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/
- Google Cloud Free Tier: e2-micro, disco limitado, cuenta de facturación; elegibilidad Cuba no confirmada. Fuente https://docs.cloud.google.com/free/docs/free-cloud-features
- VPSFree.io y FreeVPS.org: recursos y renovación/comunidad insuficientes según auditorías anteriores. No se ha encontrado sustituto gratuito permanente verificado.
- Fondation Simafri: oferta gratuita para open-source pero excluye uso comercial en ese VPS. No aprobado.

## Condiciones mínimas de aprobación
1. Términos oficiales fechados que permitan uso comercial del servidor y acceso desde país del titular, sin documentación empresarial cuando no sea exigida.
2. Gratuidad permanente explícita, sin renovaciones que puedan provocar borrado imprevisto, sin cargos automáticos ni obligación de tarjeta.
3. Acceso root o Docker compatible con OSRM, persistencia y recursos reales demostrables, con límite de tráfico.
4. Identidad del operador, soporte, reglas de suspensión y recuperación; procedimiento de exportación y backups.
5. Posteriormente, solo con autorizaciones separadas: aprovisionamiento, pruebas de conectividad y recursos, cartografía OSM autorizada y benchmark OSRM.

**Estado:** commercialQuoteEnabled=false. No se crearon cuentas, contactó a proveedores, descargó cartografía, ejecutó OSRM, activó manualmente GitHub Actions, generaron costos ni accedió a Supabase, staging o producción. Los commits pueden activar workflows preexistentes; su estado no fue comprobado.
