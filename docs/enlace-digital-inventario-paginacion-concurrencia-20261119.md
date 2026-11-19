# Paginación y concurrencia del inventario — 2026-11-19

Base 279a35a40e462c3ec65c40e8d7269abfbbc92c46; rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical.

## Cambios
edLoadInventory pagina mediante limit=500 y offset hasta recibir una página con menos de 500 registros. Valida cada página y los IDs únicos del conjunto. Un contador de generación descarta respuestas de cargas anteriores que lleguen tarde. edInventoryLoaded permanece false durante la recarga y solo pasa a true tras persistir la copia local. Transferencias existentes exigen edInventoryLoaded.

## Pruebas sintéticas focalizadas
Función real edLoadInventory extraída de index.html con edApi, estado y localStorage ficticios:
- 1 producto: éxito, una llamada y una escritura.
- 501 productos: éxito, dos llamadas, una escritura.
- Error en segunda página: rechaza, señal false, cero escrituras.
- Página no array: rechaza, señal false, cero escrituras.
- ID duplicado entre páginas: rechaza, señal false, cero escrituras.
- Dos recargas concurrentes: la segunda prevalece y la primera se rechaza sin sobrescribir, una escritura.

6/6 resultados esperados antes del ajuste final de orden de la señal. Ajuste final: mover edInventoryLoaded=true después de localStorage.setItem para no declarar carga completa ante fallo de persistencia. Este ajuste no tuvo una segunda ejecución sintética en esta sesión.

## Limitaciones y pendientes
La paginación con offset no garantiza una instantánea transaccional si el catálogo remoto cambia durante la lectura. No se comprobó respuesta HTTP real ni límites del servidor; para garantizar consistencia fuerte haría falta un mecanismo de snapshot/versionado del servidor. Quedan pendientes prueba focalizada de localStorage.setItem fallido tras el último ajuste, transferencia durante recarga con promesa pendiente y errores de sincronización. No se ejecutó navegador ni batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
