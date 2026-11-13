# Auditoría adversarial del contrato de cotización de gestores

**Fecha:** 13 de noviembre de 2026. **Ámbito:** exclusivamente pruebas sintéticas en la rama `audit/delivery-map-readonly-20261113`. **CI:** https://github.com/Liuben810921/enlace-digital/actions/runs/43500428174 — success.

## Cobertura adversarial
Se añadió `tests/delivery-manager-server-adversarial-isolated.test.cjs`, que verifica más de 30 intentos de manipulación: suplantación de rol mediante campos de solicitud, principal inactivo o sin rol permitido, clientes ajenos, direcciones guardadas no autorizadas, titularidad de cesta, distancias negativas, no finitas, omitidas o sobrantes, modificación de umbral, tarifas y redondeo, rutas no verificadas, futuras o caducadas, cambio de versión y asociación a otro destino o cesta. También confirma el registro de la bonificación cuando el cliente paga 0 CUP.

## Correcciones del contrato
- `tests/delivery-manager-server-contract-isolated.cjs` valida estrictamente las distancias por identificador de origen seleccionado, sin admitir claves adicionales, valores negativos, infinitos o cadenas numéricas.
- Rechaza identificadores especiales de prototipo y símbolos en objetos de contrato.
- Valida los parámetros de tarifa y redondeo recibidos del contexto sintético confiable.
- Rechaza una petición que incluya simultáneamente identificador de dirección guardada y dirección alternativa, evitando ambigüedad.
- El workflow `isolated-delivery-quote.yml` ejecuta la batería adversarial junto con las pruebas anteriores.

## Advertencias importantes
- La validación es una **simulación de frontera de servidor**. El contexto es un fixture de pruebas; no existe aún autenticación, sesión, control de acceso ni autorización operativa.
- El campo `verified:true` y la marca temporal de la ruta son datos de fixture, no prueba criptográfica ni certificación real de distancia. Una integración real debe obtener rutas y versiones de un backend confiable.
- Las comprobaciones de distancias y objetos no constituyen un validador general de entradas hostiles ni sustituyen límites de tamaño, controles de tasa, transacciones o registros de auditoría.
- Las tarifas de mensajería son valores comerciales estimados; el gasto efectivo de transporte requiere registro independiente.
- No se modificaron Supabase, producción, checkout, clientes reales ni pedidos.

## Siguiente etapa
Preparar una matriz de permisos de servidor, esquema de procedencia de rutas y contrato de auditoría de cambios del administrador general antes de solicitar autorización independiente para cualquier integración con staging.
