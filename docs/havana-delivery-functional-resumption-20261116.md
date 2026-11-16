# ENLACE DIGITAL — Retoma funcional de entregas (16 noviembre 2026)

**Punto de partida:** `279ad16edd4c280cab001638a5a78852b79775c0`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Alcance:** revisión de código de solo lectura y planificación funcional. Sin acceso a servicios ni datos reales.

## Acuerdos de ejecución

1. Se congela la ampliación rutinaria de las 259 pruebas de seguridad offline. Solo se repiten pruebas directamente afectadas por cambios o defectos demostrados.
2. Prioridad: almacenes, proveedores, localizaciones, distancias viales, cálculo de tarifas y pruebas móviles de punta a punta.
3. No confundir la existencia de una función en código con su verificación en navegador, su persistencia entre dispositivos ni su operación en staging.
4. Cambios solo en rama aislada y dentro de autorización; staging, Supabase, producción, servicios externos y cualquier costo requieren aprobación independiente.
5. Pedidos reales permanecen desactivados. Datos de prueba siempre sintéticos. Reportar evidencias y bloqueantes sin abrir auditorías indefinidas.

## Inventario de implementación inspeccionado

**Fuente:** `index.html`, blob Git `5585560a6fba8e92800f923a6103a340072f2f47` en el commit base.

| Área | Evidencia en código | Limitación |
|---|---|---|
| Proveedores | `edDeliverySuppliersRead`, `edDeliverySupplierAdd`, `edDeliverySupplierEdit`, `edDeliverySupplierToggle` | Estado de demostración en `localStorage` |
| Almacenes | `edDeliveryOriginsRead`, `edDeliveryOriginSave`, `edDeliveryOriginToggle`, `edDeliveryOriginSetDefault` | Sin persistencia compartida comprobada |
| Asociaciones producto/origen | `edProductOriginsRead`, `edProductOriginsSave`, `edDeliveryEffectiveOrigins` | Datos locales; no incluidos en payload de inventario Supabase |
| Seguridad de asociaciones | `edDeliveryIsQuarantined`, `edDeliveryRecoverQuarantine`, `edDeliveryPersistAndInvalidate` | Comportamiento móvil y multiusuario no comprobado |
| Destinos | `edDeliveryDestinationSave`, `edDeliveryDestinationsRead` | Ubicaciones de referencia locales |
| Ubicaciones | `edDeliveryLocationPreview` | SVG esquemático; indica expresamente que no hay calles ni rutas |
| OsmAnd | `edOsmAndMatrixValidate`, `edOsmAndMatrixAssess`, `edOsmAndMatrixFixtures` | Comparación de rutas sintéticas; no motor vial |
| Cotizaciones | `edDeliveryQuoteSnapshot`, `edDeliveryQuoteStillValid` | Estado `pending_verified_road_distance`; no equivale a tarifa vial confirmada |

## Conclusiones verificables

- La interfaz contiene controles para administrar almacenes y proveedores, pero la persistencia actual examinada depende del almacenamiento del navegador.
- Hay validación de latitud y longitud y opciones para pegar coordenadas OsmAnd; no hay evidencia en `index.html` de cálculo OSRM operativo (cero coincidencias de `osrm`).
- La pantalla de ubicaciones se describe a sí misma como esquema local, no mapa de calles.
- La comparación de distancias OsmAnd admite hasta 100 filas, rechaza algunas entradas con datos personales y utiliza 12 rutas ficticias de ejemplo.
- La cotización permanece marcada como pendiente de distancia vial verificada.
- **No se ha realizado una prueba funcional en navegador ni en staging en esta fase**. No se declara ninguna funcionalidad lista para operar.

## Secuencia de trabajo priorizada

### F1 — Cierre de comportamiento local móvil, sin servicios
Preparar escenarios reproducibles: alta/edición/desactivación de proveedor; alta/edición/desactivación de almacén propio o de proveedor; asociación de productos; cuarentena y recuperación; coordenadas inválidas; recarga de página; zoom 200 %, teclado y pantalla móvil. No ejecutar sobre datos reales.

### F2 — Contrato de cotización vial, sin red
Definir entrada y salida: orígenes activos y vinculados, destino, revisiones de cesta/dirección/almacenes, distancia vial verificada por origen, regla de cobro desde origen más lejano, mínimo de 3 km, tarifa configurable y tratamiento de productos voluminosos. Si falta ruta verificada o configuración, devolver `PENDIENTE`, nunca tarifa inventada ni cero implícito.

### F3 — Mapa y motor vial
Revisar proveedor de extractos OSM, cobertura, licencia, atribución, memoria, almacenamiento y costos antes de descargas o servicios. La integración y cualquier costo requieren aprobación específica.

### F4 — Persistencia y prueba integrada en staging
Solicitar autorización para persistencia compartida, roles, aislamiento y pruebas con datos ficticios. Probar desde teléfono registro, direcciones, destinatarios, carrito, cotización y visualización administrativa; pedidos reales desactivados.

## Próximo bloque de trabajo permitido

Preparar un contrato funcional offline de cotización y una matriz móvil concreta, sin desplegar. Corregir solo fallos que puedan reproducirse con pruebas sobre el código exacto de la rama. La validación de interfaz en navegador y la integración con staging quedan pendientes hasta contar con entorno y autorización apropiados.

## Cambios y restricciones

Este documento es el único cambio de esta etapa. No se modificó `index.html`, ni se ejecutaron PostgreSQL, GitHub Actions, OSRM, descargas cartográficas o pruebas contra servicios. No se accedió a Supabase, staging, producción, clientes, pedidos o inventario reales; no se generaron costos.
