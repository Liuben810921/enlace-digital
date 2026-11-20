# Administración de entregas: cobertura por municipio — 2026-11-19

Base 916f2163c16a62c29bbec3bad57a60966ee0714e, comparación inicial identical. Rama plan/havana-osrm-benchmark-offline-20261114.

## Funcionalidad implementada
En index.html, edDeliveryLocationPreview ahora calcula un resumen de ubicaciones por municipio a partir de los almacenes activos y destinos registrados: número de almacenes, destinos y ubicaciones sin par de coordenadas. Se presenta en un bloque desplegable junto al esquema de ubicaciones, sin alterar el mapa ni realizar escrituras.

Commit de código 152c873386d09392aaa525ef6015b4949752e98d; blob HTML 663470c1d2924649867fa0b3f4cac6c4945364ac.

## Comprobación focalizada
Se ejecutó el cuerpo real modificado de edDeliveryLocationPreview con datos sintéticos y dependencias mínimas. Tres aserciones sobre el HTML generado:
- total 3 ubicaciones;
- Plaza: 1 almacén, 1 destino, 1 sin coordenadas;
- Centro Habana: 0 almacenes, 1 destino, 0 sin coordenadas.
**3/3 superadas en motor JavaScript aislado.** No es una prueba de navegador ni un cálculo de rutas.

## Pendientes
La persistencia compartida insegura continúa PENDIENTE y su investigación permanece cerrada. La vista es informativa, no calcula distancias viales ni modifica asociaciones. No se realizó despliegue.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
