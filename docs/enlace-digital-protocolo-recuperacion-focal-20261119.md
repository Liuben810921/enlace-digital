# Protocolo focalizado de recuperación tras API remota — 2026-11-19

Base cf481afd992cd871293a31469f05ee413ee6e814; comparación inicial identical; HTML SHA bc167baf595fa3085009b421a12eac08438d1b86.

## Ejecución sobre funciones reales extraídas
En motor JavaScript aislado, sin red, se ejecutaron los cuerpos reales de edQueueInventory y deleteProductForever, con dependencias ficticias:
- Cola: una llamada remota simulada; edición externa de fees.delivery=99 durante la llamada; alerta de conflicto; almacenamiento externo conserva products old y fees 99, memoria conserva products new y fees 1.
- Eliminación: una llamada DELETE simulada confirmada; localStorage.setItem lanza quota; alerta genérica de fallo; memoria sin producto, almacenamiento con producto. **Inconsistencia confirmada**.

## Prototipo de recuperación
Se añadió tests/storage-post-remote-recovery-focal.test.cjs con nueve pruebas de un modelo de recovery gate: bloquear escritura después de remoto confirmado + fallo local, distinguir fallo remoto, evitar reintentos automáticos, rechazar reconciliaciones con datos obsoletos o inesperados, permitir liberación únicamente tras verificar instantáneas coincidentes y preservar campos ajenos en fusión. Una prueba demuestra deliberadamente la carrera no cooperativa. **Este nuevo archivo no se ejecutó con Node en esta sesión**; no atribuirle resultados. Tampoco constituye integración de las funciones reales.

## Diseño propuesto para la integración
1. Registrar operación, identidad del producto y estado remoto confirmado antes de intentar persistencia local. Evitar registrar datos sensibles en localStorage.
2. Si remoto confirmado y local falló, marcar recuperación pendiente y deshabilitar nuevas escrituras de inventario; no reintentar DELETE/PATCH/POST ciegamente.
3. Reconsultar fuente remota por vía autorizada, comparar versiones/snapshots y conciliar el almacenamiento local sin sobrescribir campos ajenos. Exigir verificación antes de liberar el bloqueo.
4. Aplicar persistencia por campos a cargas, cola, eliminación, migraciones, save() y banner con baseline específico; rechazar conflictos y JSON inválido. El bloqueo en memoria no cubre otras pestañas; Web Locks nativo PENDIENTE.
5. Probar las ocho rutas reales con escenarios de fallo remoto, fallo local, carrera y recuperación antes de editar index.html.

## Estado
index.html sin cambios: falta verificación integrada de save, banner, cargas y migraciones con el helper y falta ejecución Node del prototipo. Las 11 pruebas Node anteriores no se repitieron. No hay atomicidad garantizada en localStorage.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
