# Plan reproducible de minimización OSRM para mensajería en La Habana

**Fecha:** 2026-11-15  
**Repositorio:** Liuben810921/enlace-digital  
**Rama:** plan/havana-osrm-benchmark-offline-20261114  
**Base:** fb7efb52dc2064afe0983d5a7868036dcf5df61b  
**Estado:** diseño documental y offline; no hay datos OSM descargados, grafos construidos ni medidas reales.

## 1. Objetivo y regla de seguridad

Reducir almacenamiento de grafo e imagen, RAM de servicio, CPU y tiempo de arranque sin alterar de forma material la distancia vial para las entregas de La Habana. La distancia debe calcularse entre almacén autorizado y punto de referencia de entrega, no mediante línea recta. Ante falta de cobertura, desconexión o discrepancia no validada: **fail-closed**; `commercialQuoteEnabled=false`.

## 2. Base documental

- Flujo MLD oficial: `osrm-extract -p profiles/car.lua`, `osrm-partition`, `osrm-customize`, `osrm-routed --algorithm mld`. MLD recomendado por defecto frente a CH, salvo casos como matrices muy grandes. https://github.com/Project-OSRM/osrm-backend
- Parámetros de partición MLD y `customize`: https://project-osrm.org/docs/v26.4.0/tools
- `osmium extract`: regiones bbox/polygon/multipolygon; `complete_ways` (predeterminado) conserva nodos referenciados por vías parcialmente dentro; `smart` completa ciertas relaciones con mayor costo; `simple` deja vías incompletas. https://docs.osmcode.org/osmium/latest/osmium-extract.html
- Memoria y disco OSRM dependen del tamaño de datos y perfil; las cifras globales publicadas son antiguas y **no permiten extrapolar un valor exacto para La Habana**. https://github-wiki-see.page/m/Project-OSRM/osrm-backend/wiki/Disk-and-Memory-Requirements

## 3. Recorte: escenarios a comparar (sin inventar límites ni tamaños)

**R0 — referencia:** extracto regional más amplio autorizado, que incluya todas las vías relevantes de entrada/salida de La Habana. Debe validarse que no corta rutas habituales.

**R1 — cobertura + margen:** polígono que incluya toda la zona de servicio, almacenes, conexiones principales y margen adicional medido. No fijar distancia del margen hasta analizar rutas de referencia.

**R2 — recorte conservador optimizado:** polígono simplificado que conserva corredores, desvíos y vías de conexión que demuestren ser necesarios en R0. Solo se acepta si supera la batería de equivalencia.

No confundir el límite administrativo con la red vial funcional. No recortar únicamente por municipios. Usar `osmium extract --strategy complete_ways` como base, evaluar `smart` si las relaciones relevantes lo requieren. No emplear `simple` para una fuente destinada a OSRM.

### Riesgos de borde

- Una ruta válida puede salir de la zona y volver a entrar; el recorte estrecho puede eliminar el camino óptimo.
- Los tramos que cruzan la frontera y sus nodos pueden mantenerse sin preservar conexiones lejanas entre esos tramos.
- Restricciones de giro, vías unidireccionales, puentes y conexiones entre componentes deben comprobarse.
- Una coordenada fuera del grafo puede producir `NoSegment`; un grafo desconectado puede producir `NoRoute`. El snapping a una vía distante debe rechazarse según umbral aprobado.
- Probar puntos próximos a bordes, almacenes extremos, accesos principales y rutas que rodean obstáculos; no asumir que las rutas de prueba son exhaustivas.

## 4. Perfil y MLD

Mantener el perfil oficial `car.lua` como línea base con hash SHA-256 y versión OSRM fijados. **No** eliminar arbitrariamente calles residenciales, restricciones de giro, sentidos únicos ni vías de acceso. Una variante optimizada solo se acepta si documenta reglas y pasa las mismas pruebas. MLD separa extracción, partición y personalización; preprocesar en equipo autorizado fuera del servidor final evita gastar recursos del plan gratuito en esa etapa, pero **no reduce necesariamente la RAM que necesita `osrm-routed`**. Parámetros MLD distintos pueden afectar tamaño/latencia: comparar sin suponer mejora.

## 5. Imagen Docker con grafo preprocesado

En fase futura autorizada, empaquetar binario OSRM de versión fija y archivos `.osrm*` generados en imagen inmutable; no incluir PBF original, logs, herramientas de construcción ni artefactos intermedios que no necesite el servidor. Determinar el conjunto de archivos requeridos a partir del grafo realmente construido y la versión OSRM, **no mediante lista inventada**. Arrancar `osrm-routed --algorithm mld` con filesystem de solo lectura y directorios temporales explícitos. Usar hashes de contenido, digest de imagen y manifiesto de procedencia. No publicar coordenadas privadas ni credenciales. Imagen autocontenida no necesita volumen persistente editable, pero el proveedor puede imponer límites de tamaño, descarga, memoria y reinicio.

## 6. Plan de medición reproducible — SOLO PARA EJECUCIÓN FUTURA AUTORIZADA

### Prerrequisitos
1. Permiso separado para obtener extracto OSM, revisar licencia/atribución y almacenar cartografía.
2. Entorno offline/deshechable con CPU, RAM y disco suficientes para preprocesar; sin servicios de pago.
3. Versiones fijadas de `osmium-tool`, OSRM, perfil y geometrías de recorte con hashes.
4. Puntos **sintéticos o públicos** de almacenes y destinos; nunca datos reales de clientes.
5. Confirmación de que no se está activando un servicio de pedidos o cotización.

### Matriz
Comparar R0/R1/R2 × perfil base y (si se justifica) variante × MLD por misma versión. Para cada ejecución registrar `run_id`, versión, hashes de entrada/perfil/imagen, fases, códigos de salida, tiempo real/CPU, pico RSS, disco de artefactos finales, bytes comprimidos de imagen, memoria RSS del servicio, tiempo de arranque, latencia p50/p95/p99 y tasas `NoRoute`/`NoSegment`/timeout. Distinguir **RAM de preprocesamiento** de **RAM de ejecución**. No deducir consumo RAM del tamaño PBF.

### Equivalencia de rutas
Construir corpus reproducible y versionado: pares almacén→referencia pública; trayectos cortos/largos; puntos en perímetro y fuera de cobertura; casos de sentido único y cruces; corredores que salen y reingresan. Ejecutar cada caso en R0 y R1/R2 con mismos parámetros de snapping y perfil. Registrar distancia (metros), duración, geometría, código de resultado, coordenadas ajustadas y distancia de snapping.

**Criterios de aceptación propuestos (no verificados ni aprobados):**
- 0 casos de ruta R0 válida que pasen a `NoRoute` o `NoSegment` dentro de cobertura.
- 0 rutas con snapping fuera de tolerancia geográfica definida por negocio.
- Diferencia absoluta de distancia <= 100 m **y** diferencia relativa <= 2% para pares elegibles, salvo excepciones explicadas y aprobadas; ambos umbrales deben cumplirse.
- Sin sesgo sistemático que incremente tarifas ni pérdida de corredores críticos.
- La aceptación final exige revisión de cobertura y recursos por el responsable del proyecto.

### Decisión de capacidad
Solo tras medir imagen real y RAM/CPU de arranque decidir si un plan 1 GiB RAM/0,5 vCPU/almacenamiento efímero puede sostener consultas. Sin cifras reales no existe evidencia de viabilidad de Hostless u otra plataforma.

## 7. Bloqueantes
Sin cartografía ni benchmark autorizados no se pueden determinar bytes del grafo, RAM mínima, capacidad de la imagen, tiempo de arranque ni precisión de recortes. Sin términos contractuales que permitan uso comercial desde Cuba, un buen benchmark tampoco autoriza despliegue. El diseño del cotizador permanece aislado y `commercialQuoteEnabled=false`.

## 8. Límites respetados
No se descargó cartografía, ejecutó OSRM, creó cuenta, contactó proveedor, activó manualmente GitHub Actions, generó costos ni accedió a Supabase, staging o producción. No se verificó el estado de workflows automáticos del repositorio.
