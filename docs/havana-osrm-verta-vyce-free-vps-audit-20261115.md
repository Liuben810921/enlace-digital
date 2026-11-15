# Auditoría documental: Verta Cloud y Vyce Cloud para OSRM (15 noviembre 2026)

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Base verificada:** `2115219ec681c16cccb28c7b0c051540c1fb692b`.  
**Alcance:** exclusivamente páginas públicas y documentación; no se abrió ninguna cuenta, no se creó servicio ni se accedió a infraestructura de ENLACE DIGITAL.

## Resumen ejecutivo
**Ninguno de los dos proveedores supera los criterios para alojamiento OSRM gratuito, continuo y apto para ENLACE DIGITAL.** No se verificó disponibilidad real, autorización expresa de uso por empresa cubana, prueba de OSRM, persistencia suficiente ni seguridad contractual completa. Clasificación: **Verta Cloud: NO EVALUABLE / NO-GO provisional**; **Vyce Cloud: DESCARTADA para servicio continuo, potencial laboratorio efímero con autorización**. «Gratis» anunciado no significa continuidad, ni elegibilidad.

## Matriz basada en fuentes oficiales
| Criterio | Verta Cloud (`vertacloud.biz`) | Vyce Cloud (`vyce.cloud`) |
|---|---|---|
| Plan público | Linux VPS Free | Vps-Mini |
| Precio | FREE, sin tarjeta anunciada | $0, sin tarjeta |
| CPU | 2 vCPU | 1 core |
| RAM | 4 GB | 2 GB |
| Disco | 50 GB **SAS HDD** (no SSD) | 6 GB (tipo no precisado en página principal) |
| SO | Ubuntu Server 22.04.5 LTS | Linux, versión no indicada |
| Red | Puerto 100 Mbit/s; **no** significa tráfico mensual ilimitado | IPv6 público, bloque de 20 puertos; IPv4 no confirmado |
| SSH/root | **No confirmado** en la página de producto | SSH y root expresos |
| Docker | **No confirmado** | No se declara explícitamente; root por sí solo no confirma soporte Docker ni kernel/cgroups |
| Persistencia | Tipo de disco indicado, pero retención, backups y eliminación no documentados para Free | Conserva archivos al apagarse; elimina servidor tras 3 días detenido |
| Renovación | No se publicó una política verificable para Free | Renovación manual periódica desde panel; intervalo exacto no publicado en fuente oficial consultada |
| Plazas | No verificadas sin pedido | Limitadas, por orden de llegada; no se verificó una plaza disponible |
| Elegibilidad empresa cubana | No hallada confirmación expresa en documentación accesible | No hallada confirmación expresa en documentación accesible |
| Términos, privacidad, AUP | No se encontraron textos completos verificables del dominio de Verta para esta oferta | No se encontraron textos completos verificables en fuentes oficiales accesibles para este producto |
| Cobros | Anuncia no tarjeta, pero no hay contrato completo verificable sobre sobreuso, renovación o cambios | Mini gratis sin tarjeta; Plus/Pro de pago por crédito. No se verificó garantía contractual de continuidad |
| Clasificación | **NO EVALUABLE / NO-GO provisional** | **DESCARTADA para servicio permanente** |

## Riesgos específicos

### Verta Cloud
1. Fuente oficial de producto muestra 2 vCPU, 4 GB RAM, 50 GB SAS HDD, Ubuntu 22.04.5 LTS y puerto 100 Mbit/s; no hay prueba de instancia aprovisionable, Docker, acceso root, persistencia ni tráfico mensual.
2. Página pública institucional contiene marcadores sin completar: teléfono `+X XXX XXX XXXX`, dirección `[Office Address, City, Country]`; página «About» contiene `[YEAR]`, `[LOCATION]`, `[X]+` y `[Short description placeholder]`. Son **señales de diligencia debida pendiente**, no prueba de fraude.
3. La apertura del enlace de la oferta desde el buscador agotó el tiempo de espera; el resultado indexado no acredita stock en tiempo real.
4. **Precaución de identidad:** `vertracloud.app` (con **r**) es otro nombre de dominio distinto de `vertacloud.biz`. Sus términos brasileños **NO** son evidencia de las condiciones de Verta Cloud. No confundirlos.

### Vyce Cloud
1. 2 GB RAM / 1 núcleo / 6 GB disco pueden resultar insuficientes para preprocesar OSM Cuba con OSRM, especialmente con archivos temporales; **no existe benchmark real**, por lo que no se declara imposibilidad absoluta.
2. Necesita renovación manual; un servidor detenido 3 días es borrado. Esto impide tratarlo como infraestructura estable para el cotizador.
3. IPv6 público y puertos asignados: verificar conectividad de clientes y proxy compatible; IPv4 no confirmado.
4. Registro mediante cuenta GitHub con antigüedad >=30 días. Plazas limitadas, sin prueba de aprovisionamiento.
5. La página oficial no confirma explícitamente elegibilidad comercial para Cuba, política de privacidad, retención de logs, backup, DPA ni límite mensual de tráfico.
6. Informe comunitario (NO oficial) señala promoción desactivada el 27 oct 2026 por colas sin avanzar; sirve como señal de riesgo, **no prueba de indisponibilidad actual**.

## Fuentes primarias consultadas
- Verta oferta: https://portal.vertacloud.biz/index.php?rp=%2Fstore%2Ffree-vps
- Verta página principal: https://www.vertacloud.biz/
- Verta sobre nosotros: https://www.vertacloud.biz/about
- Verta servicios: https://vertacloud.biz/services
- Vyce planes, renovación, registro, retención: https://vyce.cloud/
- Fuente comunitaria secundaria y señal de disponibilidad: https://bansos.dev/list/vyce-free-vps/

## Puertas de aceptación para cerrar la fase mensajerías
1. Confirmación expresa de **elegibilidad** de ENLACE DIGITAL y uso comercial del motor OSRM (incluidas condiciones de proveedor subyacente).
2. Plan gratuito estable, sin tarjeta, sin cargo automático, sin renovación que pueda destruir datos; confirmar por escrito límites de CPU/RAM/disco/tráfico y política de suspensión.
3. Acceso Linux aislado, Docker o binario OSRM autorizado, almacenamiento persistente, HTTPS, API protegida, backups externos y monitoreo.
4. Dimensionamiento medido mediante datos OSM legalmente obtenidos, extracción y construcción de grafo; benchmark de latencia y memoria.
5. Pruebas de cálculo de rutas, rutas inexistentes, direcciones, tarifas, fallos, concurrencia, recuperación y privacidad; cotización comercial desactivada hasta aprobación.
6. Validación de seguridad y funcionamiento de extremo a extremo, sin acceso a clientes reales ni despliegue de producción sin autorización separada.

## Dictamen
**No seleccionar ni abrir cuentas en Verta/Vyce ahora.** El mejor camino de costo de alojamiento cero que permanece abierto es un servidor existente con permiso contractual y capacidad medidos (amigo o equipo propio), manteniendo la investigación de proveedores gratuitos. No afirmar «fase cerrada»: no se ha ejecutado OSRM con datos reales ni pruebas integrales.

## Restricciones y trazabilidad
Se consultaron páginas públicas; se preparó este documento en rama GitHub aislada. No se contrataron ni crearon cuentas o servicios; no se descargó cartografía; no se ejecutó OSRM; no se activaron manualmente GitHub Actions; no se accedió a Supabase, staging ni producción; no se incurrió en costos. La creación del commit puede disparar workflows automáticos según configuración existente: **no se verificó que no ocurrieran**.
