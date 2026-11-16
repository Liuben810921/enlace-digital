# Integración local de demostración — Administración de entregas

**Base:** `6e9f1e5a703d658b5caa22c5ef1c16afe4427de9`  
**Commit de implementación:** `df818f308a30bfb88437f36fd66ed3604b7643a1`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`

## Cambio realizado

Se modificó exclusivamente `index.html` para incluir `edDeliveryQuoteDemoPanel()` en la sección de Administración de entregas, entre ubicaciones de referencia y laboratorio OsmAnd. El panel usa `edDeliveryOriginsRead()`, `edDeliverySuppliersRead()`, `edDeliveryDestinationsRead()` y `edDeliveryIsQuarantined()`, ya presentes en la tienda.

El usuario puede seleccionar un destino de referencia y tarifa ficticia. Sin rutas verificadas, la pantalla muestra **PENDIENTE** sin importe. Un botón separado permite crear distancias inventadas, exclusivamente en memoria, para ilustrar origen más lejano, mínimo de 3 km y tarifa CUP/km. Los resultados se identifican como **SIMULACIÓN FICTICIA / NO ES TARIFA REAL**. No se escriben distancias, cotizaciones ni pedidos en almacenamiento o servicios.

**Límite de integración:** el panel usa la misma regla de negocio que el contrato aislado de `experiments/havana-delivery-quote/quote.js`, pero no importa ni ejecuta ese módulo CommonJS directamente. La convergencia hacia una implementación única compartida sigue pendiente. Tampoco utiliza rutas viales autenticadas; la cotización operativa permanece bloqueada.

## Comprobaciones efectuadas

Se recuperó `index.html` desde GitHub en el commit `df818f308a30bfb88437f36fd66ed3604b7643a1`; Git blob remoto: `1f69cb46579773ba2049161a6143815035a31f7c`.

Se realizaron **7/7 comprobaciones estáticas focalizadas** sobre el contenido remoto:
1. Inserción del panel en la pestaña de entregas.
2. Definición del panel.
3. Definición del controlador.
4. Bloqueo de cuarentena.
5. Resultado PENDIENTE ante ausencia de rutas verificadas.
6. Etiquetado inequívoco NO ES TARIFA REAL.
7. Ausencia de llamadas de red en el nuevo bloque.

**No se ejecutó el navegador sobre los bytes publicados.** Aunque Chromium está disponible en el entorno de trabajo, el archivo completo remoto no pudo materializarse localmente mediante la conexión disponible. No se inventan resultados visuales. No se repitieron las 259 auditorías de seguridad.

## Pruebas móviles pendientes (con datos ficticios)

- Abrir Administración de entregas en ancho 360–390 px; comprobar que el panel no recorta controles.
- Crear proveedor y almacén, desactivar proveedor y comprobar exclusión.
- Crear dos almacenes y un destino de referencia; seleccionar destino.
- Pulsar Comprobar estado PENDIENTE y verificar que no aparece importe.
- Pulsar Simular distancias ficticias; comprobar etiqueta y origen más lejano.
- Cambiar tarifa ficticia y comprobar importe de ejemplo.
- Activar cuarentena sintética y comprobar bloqueo.
- Comprobar navegación con teclado, foco y zoom al 200 %.
- Confirmar que carrito, pedidos y datos operativos permanecen sin cambios.

## Restricciones y pendientes

No se tocó Supabase, staging, producción, pedidos, inventario real, workflows ni servicios. Sin cartografía, descargas, OSRM, Actions o costos. Pendiente: ejecutar las pruebas visuales sobre una copia local exacta de la rama; evitar duplicar la lógica de cotización; definir fuente confiable de rutas antes de tarifas operativas.
