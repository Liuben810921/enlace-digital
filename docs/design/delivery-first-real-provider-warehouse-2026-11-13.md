# Primera ubicación confirmada — origen real, uso controlado

**Confirmación del propietario:** 13-11-2026.

## Identidad y coordenadas

- **Tipo:** almacén **real** de un proveedor de ENLACE DIGITAL; no es un almacén ficticio ni la vivienda del cliente.
- **Referencia provisional de registro:** `PROVEEDOR_REAL_01 / ALMACEN_REAL_01`. Estos son identificadores de diseño, **no** el nombre real del proveedor.
- **Coordenadas OsmAnd comunicadas y confirmadas por el propietario:** latitud `23.13024`, longitud `-82.36028` (WGS84, pendiente de verificación cartográfica independiente).
- **Función:** punto de origen para cotizaciones y pruebas de mensajería en La Habana.
- **Nombre comercial, dirección postal y contacto:** pendientes de proporcionar/validar. No inventarlos.
- **Destino de pruebas:** dirección de la vivienda del propietario, **aún no suministrada ni registrada**. Cuando se suministre, tratarla como dato privado y restringir acceso; preferir coordenadas o referencia de prueba con acceso limitado, nunca publicar el domicilio en GitHub.
- **Clientes, cestas y pedidos:** únicamente sintéticos; no registrar pedidos reales.
- **Persistencia:** NO escribir en Supabase, staging o producción con la autorización actual. El registro definitivo deberá realizarse posteriormente con autorización específica, sin convertir los fixtures en datos de producción automáticamente.

## Reglas de diseño aprobadas

1. El sistema debe permitir **crear, editar, activar y desactivar** tantos almacenes propios y de proveedores como sean necesarios, con relación a proveedores y productos, permisos administrativos y auditoría.
2. Cada almacén tiene identidad estable, tipo de titularidad, dirección/ubicación versionada, estado, referencias de proveedor y productos/orígenes efectivos.
3. Cambiar ubicación, asignación de origen, ruta o tarifa invalida las cotizaciones dependientes. No reescribir historial de cotizaciones ya emitidas.
4. Preparar desde el inicio soporte multi-almacén; si intervienen varios almacenes efectivos, respetar la regla comercial aprobada del origen más lejano, con excepciones de tarifa especial definidas.
5. Para la prueba inicial utilizar el almacén real confirmado como origen y destinos de referencia públicos de La Habana; posteriormente podrá añadirse el domicilio privado del propietario en entorno autorizado y con acceso restringido.
6. Una distancia mostrada por OsmAnd **al centro del mapa** no equivale a una ruta vial; no usarla como base de cobro.
7. Hasta integrar un motor de rutas fiable, indicar «Tarifa pendiente de confirmar» cuando no exista distancia vial verificable.

## Pruebas de aceptación propuestas

- Coordenadas del almacén de origen conservadas con precisión y orden correcto latitud/longitud.
- Ruta vial trazable entre origen y destino de prueba, contrastable manualmente en OsmAnd; registrar proveedor, versión, timestamp y distancia.
- Tarifa calculada desde ruta válida, aplicando mínimo 3 km, base de ejemplo 200 CUP/km y mínimo 600 CUP; parámetros editables y tarifa especial por producto.
- Edición de coordenadas o desactivación de almacén invalida cotizaciones previas afectadas.
- Cambio de destino/cesta/origen/almacén obliga a recotizar.
- Pruebas multi-almacén sintéticas aunque inicialmente solo haya un almacén real confirmado.
- Sin escrituras a Supabase, sin publicación de dirección privada, sin correos, pagos o pedidos reales.

## Estado de verificación

Confirmación de origen recibida del usuario y documentada en GitHub. **No** se ha consultado OsmAnd ni se ha medido una ruta real en esta tarea. No existe aún registro en base de datos, integración de mapas ni prueba E2E. El próximo paso es desarrollar la administración completa en GitHub aislado y validar cartografía cuando se autorice.
