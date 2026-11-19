# Continuidad de reasignación segura — 19 de noviembre de 2026

Base confirmada: 6e58a01539aaea2da327d1b77109762017952605, rama plan/havana-osrm-benchmark-offline-20261114. No había commits posteriores al iniciar.

## Cambios
- La transferencia de almacenes entre proveedores exige que el inventario esté cargado para poder revisar dependencias.
- Sigue bloqueando cualquier almacén con productos asociados. Primero se debe reasignar o desvincular cada producto con las operaciones existentes.
- Al transferir almacenes sin productos asociados, se restablece defaultForSupplier=false y se incrementa la versión de cada almacén.
- Se toman instantáneas serializadas de proveedores, almacenes y asociaciones antes de la confirmación y se comparan tras ella. Se cancela si hubo modificaciones detectables.
- Se conserva la persistencia local verificada, invalidación de cotizaciones y cuarentena preexistentes.

## Verificación focalizada
Lectura posterior de index.html mediante GitHub: se confirmó la presencia de las guardas de inventario, dependencias, instantáneas, versión, predeterminado y persistencia. Durante la revisión se detectaron y corrigieron separadores de sentencias y formato del diálogo. No se ejecutó navegador ni batería integral; la ejecución funcional continúa **PENDIENTE**. Las instantáneas no son un mecanismo transaccional entre pestañas o administradores.

## Restricciones
Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral reservada para autorización previa.
