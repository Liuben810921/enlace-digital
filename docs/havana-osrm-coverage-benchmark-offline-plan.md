# La Habana — evaluación vial y benchmark OSRM (procedimiento futuro, NO EJECUTAR)
Estado: **bloqueado**. Documento de planificación, sin extractos, descargas, servicios ni cotizaciones. No convierte el manifiesto bloqueado en uno habilitado.

## Puertas de autorización
1. Obtener aprobación separada para proveedor, URL exacta, tamaño estimado, licencia ODbL/condiciones adicionales, atribución y posible redistribución. Confirmar que no hay cargos por transferencia, almacenamiento, cómputo ni servicios externos. No asumir costo cero.
2. Fijar polígono objetivo de La Habana en GeoJSON WGS84 aprobado y puntos de control sintéticos (sin direcciones de clientes); verificar que el extracto lo cubra, incluyendo márgenes para rutas limítrofes. Un bounding box no demuestra conectividad.
3. Registrar SHA-256 del PBF, bytes, fecha UTC, URL/proveedor, licencia, versión OSRM/imagen fijada por digest, perfil car.lua fijado por SHA-256, arquitectura, núcleos, RAM, disco, sistema operativo y comandos. Verificar integridad antes de procesar.
4. Ejecutar exclusivamente en entorno aislado desechable y autorizado, sin credenciales, red deshabilitada una vez adquiridos legalmente los insumos, límites de memoria/CPU/disco, timeout y salida fail-closed. Nunca en staging/producción.

## Evaluación de cobertura vial
- Analizar con herramienta OSM local versionada: carreteras accesibles para automóvil, sentidos, restricciones de giro, puentes, ferris y componentes conexas; reportar kilómetros de vías por clase y porcentajes por municipio/celda de 1 km².
- Usar una muestra versionada y sintética de >= 200 pares origen/destino distribuidos espacialmente, más pruebas de bordes, cruces y vías aisladas; no utilizar datos de clientes.
- Medir: fracción de celdas con red accesible, puntos ajustables a red (snap dentro de 100 m, umbral provisional), proporción de pares con ruta válida, componentes desconectadas, desviación frente a referencias revisadas manualmente y casos NoRoute.
- Criterios preliminares sujetos a revisión: polígono objetivo 100% incluido en extracto, >=98% puntos de control conectados, >=99% pares esperados con ruta; cero rutas fuera de cobertura aceptadas como válidas. No inferir cobertura a partir de tamaño del archivo.
- Reportar resultados por municipio y por zona; si faltan datos, declarar cobertura desconocida y NO habilitar tarifas.

## Benchmark reproducible (solo cuando exista autorización)
Preparación prevista, NO ejecutar ahora:
```sh
# Requiere imagen/OSRM y perfil previamente aprobados, locales y fijados por digest
/usr/bin/time -v osrm-extract -p ./car.lua ./havana-authorized.osm.pbf
/usr/bin/time -v osrm-partition ./havana-authorized.osrm
/usr/bin/time -v osrm-customize ./havana-authorized.osrm
# Lanzar osrm-routed SOLO en red aislada y con límites; consultar corpus sintético fijo.
```
- Registrar por fase: wall time, CPU user/system, utilización CPU, max RSS, I/O, bytes temporales, espacio libre antes/durante/después, código de salida; muestreo cada segundo mediante monitor local.
- Para osrm-routed: calentamiento 100 solicitudes; >=1000 consultas sintéticas repetidas 3 veces con concurrencia 1, 4 y 16; p50/p95/p99, throughput, errores, RSS pico, CPU y tiempo de inicio. Guardar hashes del corpus, semillas y logs sin datos personales.
- Criterios provisionales: RAM pico <=70% del límite asignado, CPU sostenida <=80% de cuota, disco usado <=70% y libre >=30%, latencia p95 <=500 ms para consulta local; abortar en timeout, OOM, integridad errónea, errores HTTP/OSRM, falta de cobertura o exceso de recursos. Ajustar tras conocer hardware y carga real; tiempo de preprocesado solo registrar, sin límite inventado.
- Separar explícitamente validez cartográfica, viabilidad operativa y aprobación comercial. Ni un benchmark aprobado activa cotizaciones: exigir backend confiable, versiones coincidentes, TTL, validación de geometría, cobertura y autorización independiente.

## Controles de costo
Repositorio público: GitHub indica gratuidad de runners **estándar** para repos públicos; runners grandes son facturables, así como posible exceso de almacenamiento de artefactos/cache. No iniciar nuevos workflows ni añadir dependencias de red sin revisar runs-on, eventos y cuotas. Esta documentación no requiere ejecutar OSRM.

## Evidencia y reversión
Publicar manifiesto de resultados firmado/revisado con hashes, versiones, tablas CSV sintéticas, límites y motivos de rechazo. Ante cualquier puerta fallida: assetReady=false, routeReady=false, quoteReady=false; conservar manifiesto bloqueado y revertir solo cambios en rama aislada. Nunca promover automáticamente a main.
