# Ficha de inventario local y matriz de alojamiento gratuito OSRM — La Habana

Fecha: 2026-11-15. Base verificada: `b6911555cc78dc357ceee9495c414f14fe5fbd1a`, archivo `docs/havana-osrm-three-infrastructure-scenarios-20261115.md` (blob `176a0a27285baca620bcd35f2b027b75a7f88d3a`). Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Alcance y clasificación de evidencia
- **VERIFICADO EN REPOSITORIO:** no hay inventario de hardware, mediciones OSRM Cuba ni proveedor gratuito seleccionado; `P` y factores de expansión no medidos. El documento previo utiliza ~59 MB como tamaño PBF publicado anteriormente, **no** como tamaño descargado o actualizado.
- **PENDIENTE DE MEDICIÓN:** CPU, RAM, disco, transferencia, rendimiento, estabilidad, presupuesto.
- **REQUISITO PROPUESTO:** los campos, puertas y pruebas siguientes son un instrumento de evaluación, no valores mínimos oficiales ni condiciones comerciales verificadas.
- No se ha consultado ninguna cuenta, máquina ni servicio. No se han verificado ofertas actuales de proveedores concretos.

## A. Ficha de inventario local (una ficha por equipo)
| Campo | Valor actual | Evidencia futura aceptable | Regla de aceptación |
|---|---|---|---|
| ID del equipo y responsable | PENDIENTE | Inventario interno sin identificadores sensibles públicos | Responsable y permiso de uso explícitos |
| Ubicación y conectividad | PENDIENTE | Tipo de conexión, estabilidad, tarifa y política de datos | Operación sin transferencia no presupuestada |
| Sistema operativo, arquitectura y versión | PENDIENTE | Reporte local autorizado de sistema/arquitectura | Compatible con versión OSRM fijada |
| CPU física/lógica y uso libre | PENDIENTE | Inventario de núcleos, carga y tiempo de CPU disponible | Pico y tiempo medidos dentro de límites |
| RAM instalada, disponible, swap | PENDIENTE | Reporte de memoria libre y pico de consumo | `R_available >= R_req` con margen documentado; swap no sustituye RAM |
| Disco total, libre, sistema de archivos, IOPS | PENDIENTE | Espacio, capacidad de escritura y pruebas autorizadas | `D_free >= D_req` con actualizaciones y rollback incluidos |
| Electricidad y protección | PENDIENTE | Disponibilidad, UPS, costo/kWh, cortes | Recuperación y continuidad aceptables |
| Acceso y aislamiento | PENDIENTE | Cuenta no privilegiada, permisos, firewall, secretos, logs | Sin exposición de endpoints ni datos de clientes |
| Respaldos y restauración | PENDIENTE | Política, capacidad, copia fuera del equipo, ensayo de restauración | Restauración comprobable antes de operar |
| Operador y mantenimiento | PENDIENTE | Responsable, horas/mes, ventanas, costo de oportunidad | Capacidad operativa y presupuesto aprobados |
| Estado | **NO EVALUABLE** | Inventario completo y benchmark posterior | NO-GO hasta completar evidencia |

**Comprobación futura local y autorizada:** registrar versiones, memoria disponible y disco libre mediante herramientas de solo lectura del sistema; no ejecutar ahora ni pedir credenciales. No publicar números de serie, IP privadas, claves o datos de clientes.

## B. Matriz para alojamiento gratuito (aplicar a cada candidato)
Puntuación documental por fila: `0 = no cumple`, `1 = evidencia insuficiente/condicional`, `2 = evidencia verificable que cumple`. **No se promedian bloqueantes**: una sola fila crítica en 0/1 implica NO-GO hasta subsanar.

| Criterio | Evidencia requerida | Riesgo / pregunta de control | Criticidad | Estado actual |
|---|---|---|---|---|
| RAM disponible real | Límite garantizado y uso pico medido OSRM | OOM, swap, throttling | CRÍTICA | ? |
| CPU y duración | vCPU, cuota, throttling, tiempo máximo por proceso | Preprocesamiento interrumpido | CRÍTICA | ? |
| Disco persistente | GB persistentes, IOPS, ciclo de vida, política de borrado | Pérdida de artefactos al reiniciar | CRÍTICA | ? |
| Tráfico de entrada/salida | GB/mes, egress, ancho de banda, política de excesos | Cobros o bloqueo de API | CRÍTICA | ? |
| Suspensión y disponibilidad | Sleep/idle timeout, cold start, uptime, health checks | Ruta no disponible en checkout | CRÍTICA | ? |
| Facturación | Tarjeta obligatoria, auto-upgrade, overages, alertas y hard caps | Cargo involuntario | **BLOQUEANTE** | ? |
| Privacidad y residencia | Ubicación de datos, retención de logs, DPA, acceso del proveedor | Exposición de direcciones/destinatarios | CRÍTICA | ? |
| Seguridad y aislamiento | TLS, controles de acceso, red privada, secretos, parches | Endpoint público vulnerable | CRÍTICA | ? |
| Licencia y uso comercial | Términos del plan y política de uso | Prohibición de uso comercial o servicio persistente | **BLOQUEANTE** | ? |
| Procesos largos y contenedores | Permisos para binarios/containers, build, límites de jobs | OSRM no ejecutable o preprocesamiento imposible | CRÍTICA | ? |
| Respaldos y exportación | Exportación y recuperación sin pago, cuotas de almacenamiento | Lock-in o pérdida de datos | CRÍTICA | ? |
| Actualizaciones y soporte | Cadencia, cambios unilaterales, SLA si existe | Servicio gratuito no sostenible | ALTA | ? |
| Métricas y diagnóstico | CPU/RAM/logs/errores/p95/p99 disponibles | Incidentes indetectables | ALTA | ? |

`?` significa **no verificado**, no un cero medido. No se asigna puntaje a proveedores sin fuente primaria actual y fecha. Umbral de preselección: todas las filas críticas y bloqueantes deben ser `2` con evidencia, y el costo máximo autorizado debe estar documentado; después sigue siendo obligatorio el benchmark real. Un plan que permite cargos automáticos sin tope rígido es NO-GO incluso si sus recursos parecen suficientes.

## C. Hoja de cálculo conceptual y condiciones
- `D_req >= P*(1+K_i+K_r)+T+B+F`, incluyendo datasets viejo/nuevo durante actualización atómica.
- `R_req = max(R_extract,R_partition,R_customize,R_contract,R_serve_concurrent)+R_OS+R_margin`.
- `H_cpu = sum(n_cores_i*elapsed_hours_i*utilization_i)`; confirmar CPU por etapa, sin confundir tiempo de CPU con duración real.
- `X_month = N_updates*P + N_clients*avg_response_bytes + N_tiles*avg_tile_bytes + X_backup + X_logs`.
- `C_12m = C0 + sum(C_month_i, i=1..12)`; incluir electricidad, conectividad, transferencia, alojamiento, respaldo, horas de operador, impuestos y costos de excedentes.
- No rellenar con `$0` ningún rubro desconocido. El límite económico aceptable debe fijarlo el propietario antes de cualquier prueba con posible cargo.

## D. Procedimiento documental sin activaciones
1. Completar la ficha con especificaciones proporcionadas voluntariamente por el responsable del equipo, sin acceso remoto.
2. Registrar por candidato URL de términos, fecha de revisión, versión del plan, límites, facturación, jurisdicción y licencia; no crear cuenta.
3. Comparar escenarios A/B/C con `D_req`, `R_req`, `H_cpu`, `X_month`, `C_12m`, usando intervalos cuando no existan mediciones.
4. Marcar `NO EVALUABLE` si falta evidencia; `NO-GO` si incumple un requisito crítico o hay riesgo de cobros.
5. Solicitar autorizaciones separadas para descarga PBF, procesamiento OSRM, activación de servicios y cualquier gasto. La evaluación documental **no** autoriza esas acciones.

## E. Riesgos residuales y decisión
Sin hardware inventariado, límites contractuales de proveedores gratuitos, datos viales verificados ni benchmark OSRM, **ninguna opción está aprobada**. Una solución gratuita puede resultar inviable por suspensión, falta de persistencia, CPU limitada, privacidad o facturación. La preferencia por equipo local es una **hipótesis de evaluación**, no una decisión de despliegue. Mantener rutas reales y cotización comercial bloqueadas (`commercialQuoteEnabled=false`).

## Restricciones
Solo lectura documental de GitHub y escritura de este archivo en la rama aislada. No se crearon cuentas ni servicios, no se descargó cartografía, no se ejecutó OSRM, no se activaron GitHub Actions, no se accedió a Supabase/staging/producción y no se generaron costos.
