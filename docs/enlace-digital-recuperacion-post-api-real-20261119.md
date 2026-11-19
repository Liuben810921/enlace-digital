# Recuperación tras API remota ficticia — 2026-11-19

Base 712df08823e23d3a799fc3830829ea62573085e2; rama aislada idéntica al inicio; index.html blob bc167baf595fa3085009b421a12eac08438d1b86.

## Ejecuciones directas de funciones reales
Se extrajeron literalmente de index.html los cuerpos de `edQueueInventory` y `deleteProductForever` y se ejecutaron en JavaScript aislado con API, localStorage y UI simulados. No se llamó a Supabase ni a servicios externos.

1. Cola: durante la API ficticia se modificó fees.delivery de 1 a 99 en almacenamiento compartido. Resultado de cola: false; shared.products conserva 'old', fees.delivery conserva 99; edInventorySnapshot sigue 'old'; se emitió alerta de no sincronización. La API ficticia ya había retornado éxito, por lo que la instantánea local no acredita estado remoto.
2. Eliminación: durante DELETE ficticio se cambió fees.delivery a 99; la función eliminó el producto 1 y persistió el estado completo con fees.delivery=1, perdiendo la tarifa externa, y anunció éxito.
3. Eliminación con fallo local: DELETE ficticio devolvió una fila confirmada; localStorage.setItem lanzó 'quota'. El estado en memoria ya había eliminado el producto 1, mientras el almacenamiento compartido conservó ambos productos; la alerta dijo 'No se pudo confirmar la eliminación: quota', aunque DELETE remoto ficticio había concluido. **Divergencia de recuperación reproducida**.

## Propuesta mínima de corrección (NO integrada)
Separar resultado remoto confirmado de resultado de persistencia local. Para operaciones remotas confirmadas, no repetir ciegamente DELETE/PATCH/POST; mostrar estado de reconciliación pendiente y recargar datos de fuente autorizada antes de permitir nuevas escrituras. En cola, no actualizar edInventorySnapshot hasta comprobar que estado local y remoto son consistentes; si API se aplicó y falla local, mantener bloqueo de escritura y ruta explícita de recuperación. Para eliminación, no mutar cart/state/snapshot antes de persistencia local comprobada; tras DELETE confirmada, el fallo local debe informar 'eliminación remota confirmada, sincronización local pendiente' y no 'no se pudo confirmar la eliminación'. Para cargas, migraciones, save() y banner, fusionar solo campos propios con baseline y rechazar conflictos; no afirmar atomicidad.

## Cobertura y límites
Ocho escritores identificados: edLoadCategories, edLoadInventory, edQueueInventory, dos migraciones, save(), banner y deleteProductForever. Las rutas save/banner/cargas/migraciones siguen sin validación integrada del helper con código real; no modificar index.html hasta demostrar recuperación segura. Web Locks nativo PENDIENTE; la función merge por campos no protege de escritores no cooperativos entre lectura y escritura. La prueba Node de cola sobre HTML exacto permanece PENDIENTE; no repetir las 11 pruebas Node ya ejecutadas.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
