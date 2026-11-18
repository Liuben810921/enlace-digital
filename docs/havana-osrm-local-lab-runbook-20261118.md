# Procedimiento mínimo propuesto: laboratorio OSRM local de La Habana (2026-11-18)

**Base:** `9b9f6e2ac0808823ce21e526153cf36997812cf6`; **rama:** `plan/havana-osrm-benchmark-offline-20261114`. Documento preparatorio exclusivamente. **No instalar, descargar, ejecutar, levantar servicios ni procesar cartografía.**

## Material y autenticidad
- Archivo recibido: `cuba-261114.osm.pbf`; MD5 adjunto y coincidente `9290d1d1fe879af7171ccfba0c03362d`; SHA-256 local `0381a456adde5d9fa9c8bedf3971d40612375ecfa1ca8679c99a205f785970e4`.
- Fuente del mapa: Geofabrik/OpenStreetMap; atribución `© OpenStreetMap contributors` y ODbL 1.0; el MD5 emparejado no es prueba independiente de autenticidad del proveedor.
- Motor: proyecto oficial `https://github.com/Project-OSRM/osrm-backend`, licencia BSD-2-Clause; imagen `ghcr.io/project-osrm/osrm-backend` según README oficial (consultado 2026-11-18). Elegir tag concreto y **digest SHA-256 real** antes de cualquier ejecución; no usar `latest` sin fijación. Registrar digest, versión, arquitectura, procedencia y perfil `car.lua` de la misma imagen.

## Puerta de recursos y costo cero (equipo local autorizado)
- Equipo Linux x86-64 ya disponible, Docker ya disponible o aprovisionamiento local separado y expresamente autorizado. Recomendación inicial **no certificada**: >=8 GiB RAM, >=10 GiB libres, 4 CPU; comprobar límites reales de cgroup, memoria disponible, swap, espacio libre, cuota de disco y costo de oportunidad. Si hay solo 4 GiB efectivos, STOP hasta disponer de estimación y límites adecuados.
- Docker debe ejecutar únicamente en laboratorio aislado, sin privilegios, sin datos de clientes ni redes externas durante procesamiento. El servidor de rutas, si se autoriza posteriormente, enlazará exclusivamente a `127.0.0.1`; no publicar puerto ni usar demo externa.
- Establecer límites de memoria/CPU, almacenamiento y duración antes de empezar; el límite exacto depende de recursos reales y se aprobará antes de procesar. Si se alcanza el límite, detener sin reintentos automáticos. No inferir suficiencia por el tamaño del PBF.
- Verificar integridad del PBF y de la imagen oficial por hash/digest, licencia, dependencias y presupuesto cero antes de ejecutar.

## Secuencia técnica futura (NO ejecutar ahora)
1. Copiar PBF y checksum al directorio aislado del equipo; comprobar hashes y registrar inventario (tamaño, fecha, SHA-256, versión de OSRM y `car.lua`).
2. Ejecutar **posteriormente** la canalización MLD oficial `osrm-extract -p /opt/car.lua /data/cuba-261114.osm.pbf` → `osrm-partition /data/cuba-261114.osrm` → `osrm-customize /data/cuba-261114.osrm`. No hay un único archivo `.osrm`: OSRM produce varios ficheros derivados.
3. Solo tras revisar recursos, iniciar `osrm-routed --algorithm mld` vinculado a loopback, sin acceso público, y probar la API `/route/v1/driving/{lon},{lat};{lon},{lat}`. OSRM utiliza **longitud,latitud**. Registrar `distance` en metros, `duration`, `code`, ruta/procedencia, fecha, sentido, mapa, perfil y versión. No convertir `NoRoute` en una tarifa.
4. Detener el proceso y conservar únicamente evidencias públicas y datos de procedencia; no integrar con web ni checkout.

## Corpus de validación propuesto (12 recorridos; coordenadas pendientes)
Puntos de referencia públicos: Parque Central (PC), Plaza de la Revolución (PR), Ciudad Deportiva (CD), Universidad de La Habana (UH), Parque Almendares (PA), Castillo del Morro (CM), Parque Lenin (PL). **Las coordenadas deben obtenerse y validarse como entradas accesibles de calles, no centroides, antes de ejecutar; no se inventan.**

| Caso | Origen → destino | Objetivo |
|---|---|---|
| 01 | PC → PR | centro urbano |
| 02 | PR → PC | sentido inverso |
| 03 | PR → CD | arterias principales |
| 04 | CD → PR | sentido inverso |
| 05 | UH → PA | tejido urbano/cruces |
| 06 | PA → UH | sentido inverso |
| 07 | PC → CM | acceso por bahía y restricciones |
| 08 | CM → PC | sentido inverso |
| 09 | CD → PL | periferia |
| 10 | PL → CD | sentido inverso |
| 11 | PC → UH | tramo urbano relativamente corto |
| 12 | PA → CM | conectividad transversal |

Incluir **adicionalmente** un caso `NoRoute` controlado con un punto público o una pareja sin conexión **solo si puede establecerse válidamente**; no suponer que alguno de los 12 falla. Alternativamente sustituir un caso tras justificarlo. Contrastar al menos una muestra con referencia independiente, documentando versiones y diferencias; 12 rutas no certifican cobertura de toda La Habana.

## Registro mínimo de evidencia
CSV/JSON con `caseId,originPublicRef,destinationPublicRef,originLonLat,destinationLonLat,osmFileSha256,osrmImageDigest,carProfileSha256,algorithm,mapDate,routeCode,distanceMeters,durationSeconds,referenceSource,referenceDistanceMeters,notes`. No guardar clientes, almacenes reales, teléfonos ni direcciones privadas. Distancias y duraciones **sin valores hasta ejecución autorizada**.

## Estado
**NO-GO**: falta equipo local autorizado con recursos efectivos y OSRM por digest; ningún recorrido real medido. No se usaron GitHub Actions, cuentas, pagos, servicios externos, instalaciones, descargas, Supabase, staging, producción ni pedidos. No se modificó código operativo, manifiesto ni workflows.
