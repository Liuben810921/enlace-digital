# Carga de inventario, migraciones y bloqueo de recuperación — 2026-11-19

Base 59e28b3d9dd12caec34aa846bed5a56de5991e01, rama idéntica al inicio. HTML blob bc167baf595fa3085009b421a12eac08438d1b86.

## Código real ejecutado (JavaScript aislado, sin red)
Se extrajo literalmente edLoadInventory del HTML, con paginación/verificación doble de API ficticia, edFromRow ficticia, estado en memoria fees.delivery=1 y almacenamiento compartido fees.delivery=99. La carga real persistió products=[2] pero sobrescribió fees.delivery a 1. En el arnés, el parche de products con baseline conservó fees.delivery=99 y products=[2]. Es un defecto reproducido y una mitigación de modelo, NO integración operativa.

Se extrajo literalmente el fragmento inicial de ambas migraciones de index.html. Con almacenamiento compartido válido y fees.delivery=99, la migración de categorías añadió B a A, el reseteo dejó products=[], marcó ambas flags done y conservó fees=99. El parche por campos separado del arnés obtuvo el mismo resultado sin conflicto. **No se comprobó en esta ejecución la intercalación de otra pestaña durante ambas migraciones**; las reproducciones de carrera anteriores permanecen evidencia separada.

## Bloqueo y reconciliación
El modelo de gate de recuperación fue probado previamente con 9/9 Node; el gate externo en el arnés bloqueó reintentos tras una operación remota ficticia. **No se integró dentro de las funciones reales edQueueInventory y deleteProductForever**, ni se verificó recuperación remota efectiva. No se puede afirmar que la aplicación bloquee nuevos intentos. Es necesario verificar y persistir el estado de recuperación entre recargas, además de impedir escrituras desde otras pestañas. localStorage no ofrece CAS atómico; Web Locks nativo continúa PENDIENTE.

## Decisión
No modificar index.html. Faltan: integración focalizada de parche en funciones reales de todas las rutas; fallo local posterior a operación remota; reconciliación explícita; bloqueo multi-pestaña; verificación de migraciones con interferencia; pruebas Node del archivo real de cola. No se repitieron las 11 ni las 9 pruebas Node anteriores.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
