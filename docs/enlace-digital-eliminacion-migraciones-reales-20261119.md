# Eliminación y migraciones reales: reproducción focalizada — 2026-11-19

Base 3ffbc5c73ca3e9b7d17f44b29275220c12eb0885; rama aislada idéntica antes de esta fase. Fuente exacta inspeccionada: index.html, blob SHA bc167baf595fa3085009b421a12eac08438d1b86.

## Evidencias ejecutadas en JavaScript aislado
1. `deleteProductForever` extraída literalmente de index.html y ejecutada con `edApi`, confirmación, estado y localStorage simulados. La respuesta remota ficticia cambió fees.delivery de 1 a 99 en almacenamiento. La función real eliminó id=1, volvió a persistir `JSON.stringify(state)` con fees.delivery=1 y mostró mensaje de éxito. **Pérdida ajena reproducida**. No hubo petición remota real.
2. Fragmento original de migraciones de la línea 905, extraído hasta `const techDefaults=` y ejecutado con localStorage simulado. Durante la primera escritura se intercaló un cambio de fees.delivery a 99; la siguiente escritura completa dejó fees.delivery=1 y marcó ambas migraciones como `done`. **Pérdida ajena reproducida**. La simulación fuerza el cambio externo en el setter; no demuestra simultaneidad real del navegador.

Se añadió `tests/inventory-real-other-writers-focal.test.cjs` con los dos casos reproducibles. **El archivo no fue ejecutado mediante Node en esta sesión**: las ejecuciones anteriores usaron directamente el código extraído en el entorno JS de herramientas. `tests/inventory-real-queue-focal.test.cjs` permanece preparado y pendiente de ejecución independiente por Node sobre una copia exacta local del HTML.

## Función común propuesta, no integrada
Contrato de `edPersistFields(patch, expected)`:
- leer JSON compartido y validar forma sin reemplazar datos corruptos;
- comprobar versión/huella de los campos afectados y rechazar conflictos de products;
- fusionar exclusivamente los campos explícitos del parche sobre el estado más reciente;
- escribir, verificar, y devolver estado de éxito/conflicto/fallo de almacenamiento;
- para colas, actualizar baseline solo tras persistencia confirmada; para eliminación, revalidar antes de API remota y al guardar; para migraciones, fijar marcas `done` solo tras persistencia validada.
No es CAS atómico. Escritores ajenos entre última lectura y escritura pueden perder cambios. Web Locks solo coordinaría escritores cooperativos; su validación nativa sigue PENDIENTE.

## Decisión
No cambiar index.html aún: hay defectos reales reproducidos en carga de categorías, carga de inventario, eliminación y migraciones, pero no hay validación de la función común en todas las rutas reales ni coordinación segura con operaciones remotas. Un parche parcial puede generar falsas garantías. Quedan PENDIENTES: test Node independiente de cola, pruebas de integración de helper en los cinco escritores, conflicto post-API, Web Locks nativo, y batería integral (requiere autorización).

Restricciones respetadas: sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
