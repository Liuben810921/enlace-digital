# Pruebas sintéticas de concurrencia, reintentos e idempotencia del cotizador

**Fecha:** 13 de noviembre de 2026. **Rama:** `audit/delivery-map-readonly-20261113`. **GitHub Actions:** https://github.com/Liuben810921/enlace-digital/actions/runs/43501352384 — success.

## Entrega
Se incorporaron `tests/delivery-manager-concurrency-idempotency-isolated.cjs` y su batería `tests/delivery-manager-concurrency-idempotency-isolated.test.cjs`, ejecutados dentro del workflow `isolated-delivery-quote.yml` junto a las pruebas existentes.

El modelo simula una operación de cotización con clave de idempotencia por gestor, huella de payload (solicitud y ruta), versión/instantánea de cesta y tarifas, duración de retención de la clave y expiración independiente de la cotización. Reintentos idénticos reciben la misma estimación mientras siga vigente; conflictos de payload, cambios de instantánea y caducidad se rechazan. Se comprueba la contabilidad de entrega gratuita sin perder el valor comercial de mensajería.

## Alcance exacto de las pruebas
Las pruebas son **secuenciales y deterministas** sobre un almacén en memoria, no ensayos de simultaneidad real entre procesos, nodos ni transacciones PostgreSQL. La comparación de instantáneas mediante SHA-256 en este fixture detecta cambios de datos de prueba; no reemplaza bloqueo transaccional, CAS/versionado atómico ni control de concurrencia de una base de datos. Las claves y los resultados se pierden al reiniciar el proceso. La huella de payload no autentica a usuarios ni protege secretos.

## Requisitos antes de staging
1. Implementar clave única por operación y ámbito de usuario en almacenamiento persistente, con restricción UNIQUE y transacciones atómicas.
2. Definir estado de operación (pendiente/completada/fallida), resolución de carreras, reintentos y commits de resultado desconocido, sin duplicar efectos.
3. Revalidar cesta, versión de tarifas, dirección, permisos y ruta verificada dentro de una misma frontera transaccional; impedir resultados obsoletos.
4. Decidir TTL comercial de cotización y retención de claves; los 5 y 15 minutos actuales son valores de laboratorio, no una política aprobada.
5. Usar un reloj confiable de servidor y reglas explícitas para reintentos tras expiración, evitando ambigüedades de facturación.
6. Realizar pruebas concurrentes reales con PostgreSQL desechable o staging autorizado, incluyendo bloqueo, serialización, idempotencia y recuperación tras fallos.
7. Mantener pedidos reales y sistemas operativos desactivados hasta autorización independiente.

**No se modificaron Supabase, producción, clientes reales ni pedidos.**
