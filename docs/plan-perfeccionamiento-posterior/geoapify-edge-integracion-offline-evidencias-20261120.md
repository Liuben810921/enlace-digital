# Geoapify — Edge Function offline integrada, 2026-11-20

## Alcance y commits
Base `d292cbe49d7fce9adc49f57f87421719a7fe22eb`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial: `identical`; no había commits posteriores. Archivos:
- `experiments/havana-delivery-quote/edge-function-offline/gateway.mjs`: núcleo ESM reutilizable por Node y Deno.
- `experiments/havana-delivery-quote/edge-function-offline/index.ts`: entrada Deno conectada al núcleo, sin adaptadores configurados, fail-closed.
- `experiments/havana-delivery-quote/edge-function-offline/gateway.test.mjs`: 18 casos focalizados.

## Evidencia ejecutada
Se ejecutaron **18/18 PASS** en Node.js v22.16.0 mediante `node /mnt/data/ed-geoapify-offline/gateway.test.mjs`, con copia local del núcleo y pruebas equivalentes. Casos: entrada deshabilitada, método incorrecto, éxito sintético que permanece PENDIENTE, identidad no verificada, rol incorrecto, JSON inválido, tipo de contenido incorrecto, cuerpo grande, campos extra, destino fuera de caja geográfica, almacenes duplicados, revisión y operación inválidas, reserva rechazada, excepción, orden autenticación-reserva, 10 solicitudes concurrentes con **adaptador simulado de exclusión**, cabeceras no-cache.

**Importante:** las pruebas no demuestran atomicidad real de PostgreSQL ni ejecución de Deno. El adaptador de prueba simula la decisión de reserva y no representa una transacción real. No se ejecutaron los archivos directamente desde un checkout de GitHub ni se invocó GitHub Actions.

## Contrato transaccional requerido (DISEÑO, NO IMPLEMENTADO)
`reserveAtomic({principal, operationId, revision, credits, scope, destination})` debe:
1. Verificar principal y autorización en servidor; nunca aceptar rol de cuerpo/headers arbitrarios.
2. En una sola transacción PostgreSQL, bloquear la fila del presupuesto por proyecto/día (o efectuar UPDATE condicional atómico), validar límites diarios y por ventana y registrar reserva idempotente por `(principal,operationId)`.
3. Comparar hash canónico de payload, revisión, orígenes y destino. Repetir una operación idéntica debe recuperar la misma reserva **sin consumir créditos otra vez**; mismo operationId con payload distinto debe fallar.
4. Mantener saldo y reserva en la misma transacción; concurrencia entre instancias no debe permitir doble gasto. Controlar carreras de primera inserción, deadlocks, reintentos acotados y commit de resultado desconocido.
5. Gestionar expiración, cancelación, consumo real y conciliación de créditos sin asumir que un reintento Geoapify es gratuito.
6. Devolver `committed:true` solo con evidencia de commit confirmado; cualquier error → PENDIENTE.

## Restricciones de seguridad
- La caja `22.8–23.3 N, -82.65–-82.05 E` es solo filtro geográfico grueso, **no** límite administrativo de La Habana.
- La entrada Deno no dispone de autenticador ni ledger configurados: devuelve `GATEWAY_NOT_CONFIGURED` para POST. No hay Geoapify fetch, secretos ni tarifas.
- El núcleo no verifica por sí mismo JWT: exige un adaptador confiable que produzca `verified:true` y `authorized:true` y rol permitido. No se permite confiar en claims editables por el usuario.
- El frontend no puede activar estado `verified`; no se produce tarifa, pedido ni ruta. Integración con checkout real aún pendiente.
- Deben añadirse: identidad real, ledger transaccional real, geocerca precisa, validación de asociaciones de almacenes en servidor, validación estricta de respuesta proveedor, límites, CORS, logging sin datos sensibles, pruebas Deno/Chromium y control de versiones.

**Sin accesos a Supabase, llamadas Geoapify, claves, GitHub Actions, staging, producción, pedidos reales, despliegues ni costos.** Persistencia compartida insegura y atomicidad entre pestañas continúan PENDIENTES.
