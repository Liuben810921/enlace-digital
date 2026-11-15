# Alternativas de alojamiento OSRM para ENLACE DIGITAL — revisión documental

Fecha: 2026-11-15. Base: `1c507974d6bd4e88bdef39a0bba83c05462ef496`. Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`.

## Alcance
El propietario consulta con un amigo que tiene un servidor en Estados Unidos; entretanto se investigan opciones de contingencia. Solo páginas públicas oficiales. Ninguna cuenta, pago, descarga, despliegue ni acceso a Supabase/staging/producción.

## Distinción jurídica importante
La regulación OFAC 31 CFR §515.578 y FAQ 785/1175 describen autorizaciones generales para determinadas comunicaciones por internet, web hosting, mapas web, APIs y cloud/VM/IaaS de apoyo. **No significa que todo servicio comercial a Cuba esté permitido**, ni prevalece automáticamente sobre políticas contractuales más restrictivas. Deben comprobarse beneficiario, uso concreto, restricciones de exportación aplicables, condiciones del proveedor y posibles exclusiones. El informe Oracle previo mantiene **NO-GO contractual** por la política expresa de Oracle; no debe generalizarse ese veto a todos los proveedores.

Fuentes oficiales:
- https://ofac.treasury.gov/faqs/785
- https://ofac.treasury.gov/faqs/1175
- https://www.govinfo.gov/content/pkg/CFR-2025-title31-vol3/pdf/CFR-2025-title31-vol3-part515.pdf
- https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/

## Matriz de opciones y clasificación
| Opción | Datos verificados en fuente pública | Incertidumbres | Estado |
|---|---|---|---|
| Servidor existente de amigo en EE.UU. | El propietario informó que existe, sin especificaciones | Titularidad, proveedor upstream, permisos de subalojamiento, beneficiario cubano, RAM/CPU/SSD libres, tráfico, IP/TLS, privacidad, respaldos y costo | **PREFERENCIA CONDICIONADA; NO EVALUABLE** hasta ficha y permiso contractual |
| Equipo propio local | Arquitectura OSRM autogestionada conceptualmente posible; ficha previa disponible | Inventario real, energía, internet público, costo y continuidad | **ALTERNATIVA CONDICIONADA; NO EVALUABLE** |
| Hosting Cuba — VPS Standard One | Página pública: 4 vCPU, 8 GiB RAM, 100 GiB SSD, 9.99 USD/mes, transferencia anunciada ilimitada | Stock, ubicación, SLA, fair use, Docker/root, licitud del caso concreto, datos, respaldo, egress, impuestos | **CANDIDATO COMERCIAL PARA VERIFICAR** |
| Hosting Cuba — VPS Standard Me | 6 vCPU, 12 GiB RAM, 200 GiB SSD, 13.99 USD/mes | Mismas verificaciones | **CANDIDATO COMERCIAL PARA VERIFICAR** |
| Hosting Cuba — VPS Standard Fi | 8 vCPU, 24 GiB RAM, 300 GiB SSD, 24.99 USD/mes | Mismas verificaciones; recursos no implican necesidad medida | **CANDIDATO COMERCIAL PARA VERIFICAR** |
| Hosting Cuba — VPS Linux en CUP | Página pública muestra 2/4/8/16 GB pero **«No disponible»** | Sin stock, precio vigente y servicio no contratables | **DESCARTADA POR DISPONIBILIDAD PUBLICADA** |
| Oracle Cloud Always Free | Política oficial Oracle excluye empresas/nacionales de Cuba | Solo reconsiderable con autorización jurídica y contractual expresa | **DESCARTADA** |
| DigitalOcean | Términos oficiales §5.7 contienen restricciones por regiones sancionadas y exportación indirecta | Aplicación específica a Cuba y excepciones no confirmadas por proveedor | **NO EVALUABLE / NO-GO SIN CONFIRMACIÓN ESCRITA** |
| InMotion Hosting | Política pública excluye expresamente direcciones/IP de Cuba | No se investiga evasión | **DESCARTADA** |

Fuente primaria de precios: https://hostingcuba.com/pages/servidores . Página de planes CUP «No disponible»: https://hostingcuba.com/pages/vps . Presentación de atención al mercado cubano y ubicación anunciada de datacenters en EE.UU./Europa: https://hostingcuba.com/ . DigitalOcean: https://www.digitalocean.com/legal/terms-of-service-agreement . InMotion: https://www.inmotionhosting.com/support/billing/countries/ .

**Precios indicativos**: 9.99/13.99/24.99 USD por mes; a 12 meses sin descuentos ni impuestos serían 119.88/167.88/299.88 USD respectivamente, **no presupuestos completos ni ofertas aceptadas**. Costos de administración, respaldos, transferencia bajo fair use, impuestos y soporte desconocidos. No asumir que «ilimitado» elimina políticas de uso razonable.

## Preguntas para el amigo / proveedor antes de cualquier autorización
1. ¿Quién es titular del servidor y qué proveedor/país lo aloja? ¿Permiten por escrito atender a una empresa cubana sin eludir políticas?
2. ¿RAM disponible, vCPU disponibles, SSD libre, arquitectura x86_64/ARM64, Linux y permisos Docker/binarios persistentes?
3. ¿Hay IP o dominio accesible, HTTPS, firewall y posibilidad de API protegida? No enviar claves ni IP privadas.
4. ¿Límites de tráfico, cuotas, persistencia, uptime, respaldos, mantenimiento y costo incremental?
5. ¿Región y privacidad: dónde se procesarían solicitudes de rutas y cómo se evitan direcciones personales en logs?
6. ¿Hay capacidad para una prueba aislada futura sin perjudicar servicios existentes y sin activar pedidos reales?

## Criterios NO-GO
- Falta permiso contractual/legibilidad de uso para ENLACE DIGITAL, o existe veto por beneficiario/ubicación.
- Existen cobros no autorizados, cargos automáticos o tarifas de transferencia desconocidas.
- No hay RAM/CPU/disco medidos suficientes, aislamiento, respaldo, seguridad o conexión estable.
- No se han descargado y verificado legalmente datos OSM, no hay benchmark OSRM real ni rutas verificadas.
- Cotización comercial permanece `commercialQuoteEnabled=false` hasta aprobación específica.

## Recomendación
Priorizar (1) servidor del amigo **solo si el uso es permitido** y capacidad disponible; (2) equipo local; (3) solicitar información comercial escrita de Hosting Cuba sin comprar; evitar Oracle e InMotion por vetos explícitos. No se propone cambiar proveedor de Supabase ni migrar datos de clientes. Este análisis no constituye dictamen legal.

## Actividad y restricciones
Consulta documental de páginas públicas y escritura en rama GitHub. No se crearon cuentas, no se contactó a proveedores, no se descargó cartografía, no se ejecutó OSRM, no se desplegó, no se activaron manualmente GitHub Actions, no se accedió a Supabase/staging/producción y no se generaron costos. No se verificó ejecución automática de workflows.
