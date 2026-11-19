# Pruebas focalizadas de concurrencia y reinicio — 2026-11-19

Base verificada: `f70aec7810371cec4e775d41db3a5d6c86fdd00f`. Rama: `plan/havana-osrm-benchmark-offline-20261114`. Sin commits posteriores antes de las pruebas.

## Prueba 1: edQueueInventory, dos versiones en cola (PASS)
Se ejecutó el cuerpo real de `edQueueInventory()` con dependencias simuladas. Se encoló la versión A del producto 7, se modificó el estado a B y se encoló B. Una barrera asíncrona retrasó la primera escritura. Resultado: llamadas en orden A, B; la cola terminó `true`; servidor ficticio con versión B.

## Prueba 2: edSaveSupplierAlias, concurrencia y timeout posterior al commit (PASS para el alcance simulado)
Se ejecutó la función real con dos llamadas simultáneas sobre `producto_id=8` y alias X. La primera API simulada persistió el alias y lanzó timeout; la segunda completó. Resultados `rejected` y `fulfilled`; un solo registro ficticio. No demuestra que ambas llamadas obtengan confirmación ni garantiza seguridad de alias diferentes en carrera.

## Prueba 3: cuarentena tras reinicio simulado (PASS)
Se ejecutó `edDeliveryIsQuarantined()` con estado de sesión inicial `false` y clave persistida de cuarentena. Resultado `true`, bloqueo mantenido.

## Decisión
No se identificó defecto reproducible en estos tres escenarios; **no se modificó el código**. No se probaron carreras entre ediciones de distintos clientes, commit remoto incierto con cambios de alias diferentes, recarga real de navegador, reintentos automáticos de asociaciones, compatibilidad real de upsert, ni transacciones integrales. Todo ello permanece **PENDIENTE**.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral sujeta a autorización previa.
