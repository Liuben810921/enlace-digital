# Búsqueda adicional de VPS gratuitos permanentes para OSRM — 2026-11-15

**Base:** `9f8bb13bf9aafdfb330cfa4fd1b927aabcf45104`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`.

## Resultado
**No se verificó ningún nuevo VPS que cumpla conjuntamente**: >=4 GB RAM, Linux con root/Docker, disco persistente, cuota mensual cero sin promociones o renovaciones destructivas, continuidad, ausencia de cobros automáticos y elegibilidad comercial expresa para ENLACE DIGITAL (empresa cubana). No existe aprobación para aprovisionamiento.

## Fuentes primarias y decisiones
| Proveedor | Evidencia de fuente oficial | Estado y motivo |
|---|---|---|
| VPSFree.io | Página `/linux-vps` promociona KVM de 2 vCPU, 2 GB y 40 GB NVMe; inventario visible en `/` y en la propia página `/linux-vps` indica **192 MB RAM + 3 GB** y renovación cada 10 días por paso de patrocinador. Términos `/terms` identifican operador como `[LEGAL ENTITY NAME]` y `[REGISTERED ADDRESS]`, prohíben reclamar/acceder mediante VPN/proxy y advierten disponibilidad geográfica limitada. | **DESCARTADO**: inventario real publicitado por debajo de requisitos, renovación manual destructiva, identidad contractual incompleta y elegibilidad cubana sin confirmar. Publicidad KVM contradictoria con términos LXC. |
| Google Cloud Compute Engine Free Tier | 1 e2-micro mensual, **1 GB RAM**, 30 GB-months disco estándar persistente, 1 GB salida mensual en regiones EE.UU.; facturación requerida, excedentes facturables; la oferta no tiene vencimiento anunciado, puede modificarse. | **DESCARTADO** como servidor OSRM 4 GB y sin riesgo de cobros; tampoco se verificó elegibilidad específica para empresa cubana. |
| alwaysdata Free | 256 MB RAM, 1 GB disco, 1/4 CPU; política oficial: plan gratuito no puede usarse con fines lucrativos ni para ejecutar servicios. | **DESCARTADO** por recursos y condiciones comerciales. |
| Vyce Cloud | Mini gratis: 1 core, 2 GB RAM, 6 GB disco; renovación manual y borrado si detenido 3 días; Plus 4 GB es de pago. | **DESCARTADO** como servicio continuo; ya auditado en documento anterior. |
| Verta Cloud | Anuncia 2 vCPU, 4 GB RAM, 50 GB SAS HDD; términos, disponibilidad, root/Docker y elegibilidad cubana no verificables. | **NO EVALUABLE / NO-GO provisional**; no convertir publicidad en aprobación. |
| Oracle Cloud Always Free | Cuotas suficientes en abstracto, pero política comercial oficial Oracle excluye empresas y nacionales cubanos. | **DESCARTADO** para este caso. |

## Fuentes oficiales
- https://vpsfree.io/
- https://vpsfree.io/linux-vps
- https://vpsfree.io/terms
- https://docs.cloud.google.com/free/docs/free-cloud-features
- https://docs.cloud.google.com/compute/docs/general-purpose-machines
- https://help.alwaysdata.com/en/docs/admin-billing/billing/public-cloud-prices/
- https://vyce.cloud/
- https://portal.vertacloud.biz/index.php?rp=%2Fstore%2Ffree-vps
- https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/

## Observaciones metodológicas
- Ninguna oferta se probó mediante registro o despliegue. No se ha medido rendimiento OSRM ni confirmado compatibilidad de Docker.
- La inexistencia de candidato verificado **no demuestra** que no exista ninguno en Internet.
- Para un servidor existente del colaborador o propio, la cuota de hosting podría ser cero, pero electricidad, red, mantenimiento y recursos compartidos tienen costos indirectos. Debe verificarse elegibilidad de proveedor upstream, límites de aislamiento y disponibilidad.
- El requisito de >=4 GB RAM es un filtro de búsqueda solicitado, **no una medición real de OSRM para La Habana**.
- La fase mensajerías NO está cerrada: faltan dataset autorizado, extracción OSRM, benchmark, conectividad y pruebas de extremo a extremo; `commercialQuoteEnabled=false` permanece como criterio.
- Se prioriza ahora la vía del servidor existente, condicionada a autorización del propietario y proveedor, y pruebas aisladas posteriores; sin acceder a él ni requerir credenciales en esta etapa.

## Operaciones y límites
Investigación documental de fuentes públicas y commit en rama aislada. No cuentas, compras, pagos, descargas de cartografía, ejecución de OSRM, activación manual de GitHub Actions ni acceso a Supabase/staging/producción. La escritura del commit podría activar workflows automáticos preexistentes; no se verificó ese aspecto.
