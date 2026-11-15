# Protocolo reproducible de benchmark OSRM — La Habana (sin cartografía ni ejecución)

Fecha 2026-11-15. Base `06a0b41881261aac073615e236e19b08424d83d5`. Independiente de proveedor y teléfono. **PROTOCOLO, NO RESULTADOS DE BENCHMARK**.

## Auditoría del estimador sintético
Código `experiments/havana-osrm-portable/resource-budget.py`. Usa `nodes*128 + edges*192` y multiplica por 4: coeficientes arbitrarios, no medidos. No representa los archivos MLD ni perfiles OSRM, caches, mapeo de archivos, concurrencia, tamaño de PBF o picos del preprocesamiento. No sirve para justificar compra, alojamiento ni el límite 2 GB. La suite publicada `test_resource_budget.py` se corrigió porque importaba `resource-budget.py`; registrar la corrección y verificarla offline. **No usar los hashes locales del informe previo como prueba de identidad de blobs GitHub.**

## Requisitos previos, sin ejecutarlos ahora
1. Autorizar fuente OSM y descarga concreta. Registrar URL, licencia, atribución, fecha de corte, SHA-256 PBF original.
2. Definir recorte de **La Habana**, geometría administrativa y un buffer vial razonado para rutas que cruzan el límite; publicar bbox/polígono y SHA-256 del recorte. Evitar afirmar que una bbox equivale a municipio/provincia.
3. Registrar versiones exactas de `osmium`, `osrm-backend`, perfil `car.lua`, imagen por digest, arquitectura x86_64/aarch64, kernel, CPU, RAM, almacenamiento, límites de cgroup, OS y comandos.
4. Preparar entorno de prueba aislado, sin secretos ni clientes; limitar disco y RAM. Medir el preprocesamiento por separado del servicio de consulta.
5. Criterios de éxito antes de ejecutar: grafo consistente, rutas de referencia documentadas, no-route, carga simultánea, uso estable y recuperación; cuotas y costo cero comprobados.

## Fases de medición futura
| Fase | Entrada | Medidas mínimas | Criterio |
|---|---|---|---|
| M01 | PBF de fuente autorizada | bytes, hash, timestamp, licencia | procedencia reproducible |
| M02 | recorte La Habana + buffer | bytes, nodos, vías, inodos, hash | cobertura y conectividad auditables |
| M03 | `osrm-extract` | wall time, max RSS, CPU user/sys, I/O, disco máximo | termina sin OOM y sin llenar cuota |
| M04 | `osrm-partition` | mismas medidas y archivos temporales | termina sin OOM |
| M05 | `osrm-customize` | mismas medidas y archivos finales | grafo MLD íntegro |
| M06 | `osrm-routed` | RSS/cgroup peak, mmap, startup, latencias p50/p95/p99 | responde en límite de RAM |
| M07 | 1/5/20 consultas simultáneas sintéticas | p50/p95/p99, errores, CPU, RAM, I/O | sin tarifas inventadas ni degradación |
| M08 | fallos controlados | sin ruta, timeout, reinicio, grafo ausente, puerto no público | fail-closed |
| M09 | cotizador | 3 km mínimo, 200 CUP/km de ejemplo, 600 CUP mínimo, almacén más lejano, tarifa especial | reglas aprobadas y versionado |
| M10 | interfaz móvil | mensajes, accesibilidad, zoom, carga, errores | UX validada |

**Instrumentación sugerida para ejecución autorizada:** `/usr/bin/time -v` para RSS máximo y tiempo; `du -sb`, `df -B1`, `find ... | wc -l` para disco e inodos; `docker stats` y `memory.peak` en cgroups para servicio; `pidstat`/iostat si instalados; reloj monotónico y carga reproducible. `time -v` no incluye necesariamente todo el consumo de procesos hijos o page cache; preferir cgroup peak y filesystem dedicado. Guardar salidas sanitizadas sin IP, coordenadas personales ni secretos.

## Matriz de límites
| RAM límite | Extract | Partition | Customize | Routed inactivo | Routed carga | Resultado |
|---|---|---|---|---|---|---|
| 1 GiB | no ejecutado | no ejecutado | no ejecutado | no ejecutado | no ejecutado | desconocido |
| 2 GiB | no ejecutado | no ejecutado | no ejecutado | no ejecutado | no ejecutado | desconocido |
| 4 GiB | no ejecutado | no ejecutado | no ejecutado | no ejecutado | no ejecutado | desconocido |
| 8 GiB | no ejecutado | no ejecutado | no ejecutado | no ejecutado | no ejecutado | desconocido |

Medir al menos tres repeticiones por escenario y publicar distribución, versiones, hashes, fallos y sesgos de caché; no declarar capacidad por un único arranque. Separar el presupuesto de **procesamiento** del de **servicio**, pues pueden ser muy diferentes.

## Alojamiento gratuito: puerta de elegibilidad
La revisión pública previa no encontró VPS externo permanente con uso comercial cubano expresamente permitido, Docker/root, disco persistente y recursos medidos. GratisVPS no cumple garantías de continuidad; Oracle tiene prohibición contractual; Google e2-micro no satisface el filtro conservador y tiene facturación; Verta/Vyce/VPSFree.io no superaron criterios. **No se incorpora candidato nuevo aprobado sin fuente oficial y prueba de entrega**. Para cualquier nuevo candidato: verificar titular jurídico, términos de Cuba, no expiración, cuota sin tarjeta/cobro, CPU/RAM/disco y egress, backups, Docker, soporte, aislamiento, API HTTPS y continuidad. La ausencia de prohibición expresa no confirma elegibilidad.

## Estado
Este protocolo es entregable offline; M01–M10 pendientes. `commercialQuoteEnabled=false`. No cuentas, servidores, descargas, OSRM real, costos, activación manual de Actions, Supabase, staging ni producción. Un commit puede disparar workflows automáticos existentes; no se verificó.
