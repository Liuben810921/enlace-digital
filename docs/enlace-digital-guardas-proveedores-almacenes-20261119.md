# Administración de entregas — guardas de cuarentena en proveedores y almacenes

Base: 56840d4831771bf68ceb8412867b93f902741beb; rama plan/havana-osrm-benchmark-offline-20261114, sin commits posteriores al inicio.

## Cambios operativos
index.html commit c5b1e5dbe65d2d36b47951ab8e27a1e5461f459a (blob 07fe54f69f524bde7be2113e29c10da014b6d472):
- edDeliverySupplierAdd: al inicio, si edDeliveryIsQuarantined(), retorna false antes de leer el formulario o escribir proveedores.
- edDeliveryOriginSave: al inicio, si edDeliveryIsQuarantined(), retorna false antes de leer el formulario o escribir almacenes.

Estas funciones carecían de guarda de cuarentena, a diferencia de otras operaciones del mismo panel. La modificación es mínima, sin alterar persistencia, contratos de API o lógica de asociaciones.

## Verificación focalizada
Se extrajeron los dos cuerpos reales modificados, se compilaron con new Function y se ejecutaron con edDeliveryIsQuarantined()=true. Ambos devolvieron false antes de acceder a DOM o dependencias de persistencia. No se ejecutaron las rutas completas con cuarentena desactivada ni pruebas de navegador. No repetir auditorías anteriores.

## Pendientes
Persistencia compartida y recuperación de inventario: PENDIENTE por decisión de cierre anterior. No se declara resuelta la seguridad multi-pestaña. La interfaz operativa continúa sin despliegue ni pruebas integrales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
