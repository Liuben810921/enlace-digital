# Prueba focalizada en navegador — Administración de entregas

**Alcance:** rama aislada, datos sintéticos, sin red de Geoapify, sin pedidos reales ni despliegue. No es la batería integral ni autoriza producción.

## Preparación
- Abrir una copia exacta del `index.html` de esta rama con sus dependencias locales en Chromium móvil (ancho 393 px).
- Utilizar almacenamiento de navegador desechable y productos, proveedores, almacenes y destinos **ficticios**. No copiar clientes ni inventario real.
- Abrir Administración > Administración de entregas. Comprobar que el panel indique «Simulador local de mensajería · NO OPERATIVO».

## Casos focalizados
1. Crear dos almacenes activos con coordenadas válidas de La Habana, un proveedor activo y un destino de referencia con coordenadas válidas. Asociar dos productos ficticios a sus almacenes. Seleccionar ambos productos y el destino. «Comprobar preparación de rutas» debe informar que faltan autorización, reserva de cuota, rutas verificadas y aprobación staging; no debe enviar solicitudes.
2. Quitar las coordenadas de un almacén de prueba. El diagnóstico debe señalar el almacén afectado y permanecer `PENDIENTE`.
3. Simular distancias ficticias con dos productos y tarifa de 200 CUP/km. Debe calcular **una sola** tarifa de entrega usando la distancia ficticia mayor entre todos los almacenes asociados, respetando 3 km y 600 CUP mínimos. Debe indicar «NO ES TARIFA REAL».
4. Cambiar la selección de producto o destino después de simular. El resultado anterior debe invalidarse inmediatamente y volver a `PENDIENTE`.
5. Redibujar el panel administrativo. Deben conservarse productos, destino y tarifa ficticia introducida.
6. Pulsar «Comprobar estado PENDIENTE». Nunca debe generar una tarifa real ni habilitar pedidos.
7. Activar la cuarentena de asociaciones mediante un estado de prueba controlado. El diagnóstico y simulación deben quedar bloqueados.
8. Revisar la consola del navegador en móvil para errores JavaScript, y verificar que la pestaña Network no contiene solicitudes a Geoapify, Supabase staging ni servicios externos originadas por estas pruebas.

## Criterios de salida
- Todos los casos anteriores comprobados en navegador con evidencia de resultados; los controles de pedidos y cobro real continúan desactivados.
- **No ejecutar** aún la batería integral.
- **No activar** Supabase staging, Geoapify, credenciales ni cuotas sin autorización específica.

## Estado
Preparación documentada; **ejecución en Chromium pendiente**. Ninguna prueba de navegador se declara aprobada por la mera presencia de este documento.
