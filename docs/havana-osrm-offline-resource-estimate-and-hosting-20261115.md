# Fase OSRM La Habana: filtro de alojamiento y estimación sintética — 2026-11-15

**Rama:** `plan/havana-osrm-benchmark-offline-20261114`. **Base:** `628f8d225a2b42ed74907a69281a16ba9c7acef4`. Arquitectura independiente del servidor de colaboradores y del teléfono personal.

## Investigación externa
No se ha verificado VPS Linux gratuito permanente, entregable, con almacenamiento persistente, recursos medidos suficientes para OSRM, Docker/root y elegibilidad comercial expresa para ENLACE DIGITAL como empresa cubana. **NO-GO para selección de hosting.**

- GratisVPS: auditoría previa `docs/havana-osrm-gratisvps-due-diligence-20261115.md`; beta, cancelación unilateral, backups ausentes y entrega no demostrada. **Descartado**.
- VPSFree.io: https://vpsfree.io/ y https://vpsfree.io/linux-vps . Inventario visible de 192 MB/3 GB y renovación cada 10 días, contradictorio con promoción 2 GB/40 GB; **descartado**.
- Oracle: política contractual de comercio https://www.oracle.com/corporate/security-practices/corporate/governance/global-trade-compliance/ ; **descartado para empresa cubana sin autorización expresa**.
- Google Cloud Free Tier: https://docs.cloud.google.com/free/docs/free-cloud-features ; VM e2-micro con ~1 GB RAM, 30 GB disco estándar y 1 GB egress gratuito mensual; cuenta de facturación y riesgo de sobreuso. No satisface filtro sin cobros ni capacidad medida; elegibilidad cubana sin verificar. **No aprobado**.
- Render/Koyeb/Cloud Run: cuotas y procesos efímeros, escalado a cero y/o disco efímero; no se verificó que sostengan OSRM persistente bajo condiciones requeridas. **No aprobado**.
- Regulación estadounidense 31 CFR §515.578: https://www.govinfo.gov/content/pkg/CFR-2025-title31-vol3/pdf/CFR-2025-title31-vol3-part515.pdf . Contempla determinadas autorizaciones de servicios de internet, web maps y cloud; **no sustituye términos del proveedor** ni confirma elegibilidad particular.

La ausencia de candidato verificado no prueba inexistencia absoluta. No se crearon cuentas ni se pidió disponibilidad mediante registro.

## Artefactos nuevos
- `experiments/havana-osrm-portable/resource-budget.py`
- `experiments/havana-osrm-portable/test_resource_budget.py`

**Importante:** no hay mapa ni grafo real, por lo que no se puede medir el consumo mínimo real de OSRM. El estimador usa coeficientes **hipotéticos**: 128 bytes/nodo, 192 bytes/arista y multiplicador 4 para un pico teórico. No son parámetros medidos de OSRM ni sustituyen benchmark.

Para escenario sintético de 10 000 nodos y 25 000 aristas devuelve 6 080 000 bytes de grafo hipotético y 24 320 000 bytes de pico hipotético. **No utilizar esos valores para dimensionar servidores reales.**

## Pruebas ejecutadas en entorno local aislado
- `python -m unittest -v test_resource_budget`: **6/6 OK**.
- `python -O -m unittest -v test_resource_budget`: **6/6 OK**.
- `python resource-budget.py` (misma lógica de cálculo): JSON sintético producido.
- SHA-256 de bytes locales usados en verificación:
  - `resource-budget.py`: `7d146250b1fba10407f185400220e49242bad2151271e7f4dca4672bca2f010f`
  - `test_resource_budget.py`: `04a155097860110c861751051377d7544c21207959bb617af38684d5d50f5565`

La primera ejecución usó nombres locales `benchmark.py` y `test_benchmark.py` y también aprobó 6/6 en ambos modos. Después se adaptó la importación al nombre publicado en GitHub y **se repitieron 6/6 en ambos modos**. **No se verificó mediante lectura binaria independiente que los blobs GitHub coincidan con los hashes locales**; los hashes documentan los archivos locales ejecutados.

## Próxima medición REAL cuando se autorice cartografía
1. Seleccionar fuente OSM autorizada y recorte reproducible de La Habana con bbox explícito, fecha y licencia.
2. Guardar hashes de PBF y del recorte; medir bytes e inodos reales.
3. En máquina de pruebas autorizada, medir pico RSS, tiempo, CPU, I/O y disco durante `osrm-extract`, `osrm-partition`, `osrm-customize`, `osrm-routed`; documentar imagen OSRM por digest.
4. Comparar ejecución con límites 1/2/4 GB sin exponer el servicio; no declarar éxito solo por arranque.
5. Validar rutas, errores, privacidad, tarifas y concurrencia; ejecutar matriz A01–A15. Solo después decidir hosting y cierre de fase.

## Estado y límites
**Mensajerías NO cerrada**: faltan cartografía real, benchmark OSRM, servidor elegible, conectividad, seguridad y pruebas integradas. `commercialQuoteEnabled=false`. No servidores, servicios, cuentas, pagos, descargas de mapas, activación manual de Actions, Supabase, staging o producción. No se ha comprobado si los commits disparan workflows preexistentes.
