# Laboratorio OSRM con solo teléfono: alternativa segura sin servicios — 2026-11-18

**Base:** `6647064ac57f77e3ab400c329d4e5d918eba7bdb`. **Rama:** `plan/havana-osrm-benchmark-offline-20261114`. Restricciones: usuario solo dispone de teléfono; sin GitHub Actions, cuentas, pagos, servicios externos, infraestructura persistente, instalaciones ni procesamiento autorizado.

## Dictamen
No hay una vía **demostrada** para procesar `cuba-261114.osm.pbf` con OSRM en el teléfono sin instalar software ni ejecutar procesos. OSRM recomienda Docker/MLD o compilación nativa; Android/Termux no se considera compatible sin una validación separada de ABI, dependencias, memoria, almacenamiento, batería, restricciones del sistema y ejecución prolongada. No afirmar que un móvil Android ejecutará OSRM.

El contenedor de trabajo ya examinado tiene un límite cgroup de **4 GiB**, carece de OSRM/Docker y no dispone de DNS para descargar binarios; no sustituirlo por un servidor de terceros ni ejecutar instalaciones improvisadas.

## Alternativa gratuita y realmente disponible ahora
**Preparación documental y offline**, no rutas reales:
1. Conservar el PBF adjunto y su comprobante fuera del repositorio; MD5 `9290d1d1fe879af7171ccfba0c03362d` y SHA-256 `0381a456adde5d9fa9c8bedf3971d40612375ecfa1ca8679c99a205f785970e4` ya verificados. No duplicar descarga.
2. Mantener el runbook y corpus de 12 rutas públicas definidos en `docs/havana-osrm-local-lab-runbook-20261118.md`; sin inventar coordenadas ni kilómetros. Registrar como campos pendientes los puntos de acceso vial, comparación independiente y el caso `NoRoute`.
3. Preparar para futuro equipo local: inventario de CPU/arquitectura, RAM efectiva (cgroup), espacio libre, sistema, disponibilidad de OSRM/Docker, versión/digest del motor y `car.lua`; exigir 0 gastos comprobados antes de ejecución.
4. En cuanto exista equipo autorizado, validar hashes, procedencia, licencia y límites de recursos **antes** de OSRM MLD; no activar checkout ni cotizaciones reales.

## Vías evaluadas y rechazadas por ahora
- **Android/Termux/proot**: requeriría instalar herramientas y posiblemente compilar/adaptar OSRM; memoria, ABI, almacenamiento y estabilidad no verificados. No es una solución gratuita *demostrada* ni autorizada en este bloque.
- **API de demostración / terceros**: incumple prohibición de servicios externos; tampoco prueba costo cero comercial ni privacidad.
- **GitHub Actions / cloud**: expresamente prohibidos; no proponer como ejecución implícita.
- **Binarios Linux sin Docker**: existen distribuciones empaquetadas para Linux (p. ej. `osrm.backend` y proveedores de binarios), pero no se ha verificado compatibilidad con Android o contenedor actual; no instalar.

## Fuente técnica consultada
- OSRM oficial: https://github.com/Project-OSRM/osrm-backend
- Guía de compilación: https://github.com/Project-OSRM/osrm-backend/blob/master/README.md
- Distribución de binarios alternativa (no ejecutada): https://cran.r-project.org/web/packages/osrm.backend/readme/README.html

## Estado
**Preparación completada; ejecución bloqueada por ausencia de entorno compatible autorizado.** Cero rutas reales medidas; sin modificaciones de código, manifiesto, workflows, Supabase, staging, producción, clientes ni pedidos. Sin descargas, instalaciones, servicios o gastos.
