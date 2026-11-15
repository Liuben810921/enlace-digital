# Dimensionamiento documental de OSRM — tres escenarios, sin contratación

Fecha: 2026-11-15. Base: `5ca05ebc5408c916c107eca849b927d9728b33d9`. Rama: `plan/havana-osrm-benchmark-offline-20261114`.

## Alcance y datos confirmados
Se revisaron en el commit base `docs/havana-osm-source-comparison-preliminary-budget-20261115.md` y `docs/havana-next-block-osm-osrm-dependencies-no-cost-20261115.md`. La comparación previa registró ~59 MB para PBF de Cuba **según una página consultada**, sin archivo descargado ni tamaño actual garantizado. No hay mediciones de RAM/CPU/disco de OSRM sobre Cuba ni inventario de equipo local. Los escenarios siguientes son **modelos de planificación**, no cotizaciones ni benchmarks.

## Variables y fórmulas reproducibles
- `P`: bytes PBF descargado (desconocido hasta obtención autorizada).
- `K_i`: factor de espacio de artefactos/intermedios respecto a `P` (desconocido).
- `K_r`: factor de dataset de ejecución respecto a `P` (desconocido).
- `T`: bytes de teselas y estilos offline (desconocido).
- `B`: bytes de copias de seguridad y versiones conservadas.
- `F`: espacio libre operativo reservado para logs, temporales y reversión.
- **Disco necesario** `D >= P*(1+K_i+K_r)+T+B+F`. Para actualizaciones atómicas, considerar simultáneamente dataset viejo y nuevo y recalcular `D`.
- **RAM pico requerida** `R_req = max(R_extract, R_partition, R_customize, R_contract, R_serve_concurrent) + R_OS + R_margin`; cada componente requiere medición con el mismo dataset, perfil, versión y concurrencia. No sustituir RAM por tamaño PBF.
- **CPU preparación** `H_cpu = sum(n_cores_i * elapsed_hours_i * utilization_i)`; **tiempo calendario** depende de recursos efectivos y contención, no solo de H_cpu.
- **Transferencia mensual** `X = N_updates*P + N_clients*avg_response_bytes + N_tiles*avg_tile_bytes + X_backup + X_logs`. Evitar contar teselas descargadas de terceros sin licencia o autorización.
- **Mantenimiento mensual** `M = H_ops*rate_hour + C_electricity + C_connectivity + C_storage + C_backup + C_hosting + C_transfer + C_monitoring`. Coste inicial `C0 = C_hardware_incremental + C_setup_hours + C_initial_transfer + C_initial_processing`. `C_12m = C0 + 12*M` únicamente si el consumo es estable; de lo contrario sumar meses individuales.
- **Capacidad**: `QPS_sustained >= QPS_peak*headroom_factor`, con factor y demanda aún sin estimar; medir latencia p95/p99, fallos, RAM pico, CPU, E/S y saturación.

## Escenarios
| Escenario | Componentes | Supuestos explícitos | Costo que debe verificarse | Puerta de aceptación |
|---|---|---|---|---|
| **A — Equipo local existente** | Computadora/servidor ya disponible, almacenamiento, OSRM aislado y red local | Existe hardware reutilizable; **no se han inventariado sus especificaciones** | Energía, desgaste, conectividad, respaldo, horas de operador, posible hardware adicional | Inventario verificable de RAM libre, CPU, disco, SO, conectividad y estabilidad; pruebas aisladas dentro de límites autorizados |
| **B — Alojamiento gratuito condicionado** | VM/contenedor gratuito si se permite OSRM persistente | No se ha verificado ningún proveedor ni cuota vigente; suspensión y almacenamiento efímero son posibles | Transferencia, egress, exceso de cuota, persistencia, backups, límites de CPU/RAM y cambio de condiciones | Condiciones escritas vigentes, sin tarjeta ni cobros automáticos no autorizados; memoria y CPU suficientes según benchmark; disponibilidad, privacidad y límites compatibles |
| **C — Servidor de pago de referencia** | VM con recursos ajustables, almacenamiento, transferencia, respaldo y supervisión | **No hay proveedor ni precio seleccionado**; no equivale a autorización de compra | Precio base, almacenamiento, salida, IP, copias, impuestos, soporte, operación y actualizaciones | Cotización escrita y presupuesto máximo aprobado; comparación 12 meses; contratación solo con autorización separada |

## Ejemplo aritmético puramente ilustrativo (NO capacidad recomendada)
Si `P=59 MB`, `K_i=4`, `K_r=3`, `T=500 MB`, `B=1 GB`, `F=2 GB`, entonces `D >= 59*(1+4+3)+500+1000+2000 = 3972 MB` (unidades decimales). **Todos los factores y reservas son inventados para demostrar la fórmula**, no proceden de mediciones OSRM, ni representan mínimo suficiente. RAM y CPU siguen sin cuantificarse. No debe usarse este ejemplo para contratar ni preparar equipos.

## Matriz NO-GO
- **NO-GO datos** si faltan proveedor, licencia y atribución aplicables, checksum real, cobertura y versión.
- **NO-GO costo** si cualquier recurso puede producir cobros no autorizados o no existe techo presupuestario aprobado.
- **NO-GO técnico** si el procesamiento excede RAM/disco/CPU disponibles, hay OOM, errores, rutas inconsistentes o datos no reproducibles.
- **NO-GO disponibilidad** si el proveedor gratuito suspende procesos, no garantiza persistencia o limita red incompatible con la operación.
- **NO-GO seguridad** si no hay aislamiento, límites, rollback, validación backend de procedencia, privacidad y métricas.
- **NO-GO comercial** si la ruta no procede de backend confiable, hay `NoRoute`/timeout/versiones incompatibles o no existe autorización específica para tarifas.
- **NO-GO legal** si no se resuelven obligaciones ODbL y atribución de mapa, bases derivadas y condiciones de teselas.

## Secuencia de decisiones, sin costos
1. Inventariar **solo documentalmente** el hardware existente y tarifas de conexión/energía; sin acceder remotamente a equipos.
2. Revisar condiciones vigentes de un eventual alojamiento gratuito; no crear cuentas ni servicios.
3. Solicitar precios públicos o cotizaciones **solo para comparación**, sin compra ni alta.
4. Tras autorización separada de descarga y procesamiento, medir `P,K_i,K_r,T,R_req,H_cpu,X` en entorno aislado, con límites y rollback.
5. Elegir escenario solo después de benchmarks reales y aprobación financiera; mantener `commercialQuoteEnabled=false`.

## Estado y restricciones
No se descargó cartografía ni se ejecutó OSRM. No se activaron GitHub Actions ni se accedió a Supabase, staging o producción. No se contrató ni desplegó ningún servicio, no se generaron costos. Documento de planificación, **NO-GO operativo**.
