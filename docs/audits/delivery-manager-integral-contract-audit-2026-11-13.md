# Auditoría integral de contratos sintéticos de mensajería y gestores

**Fecha:** 13 noviembre 2026. **Rama aislada:** `audit/delivery-map-readonly-20261113`. **CI:** https://github.com/Liuben810921/enlace-digital/actions/runs/43501076714 — success.

## Alcance y hallazgo
La revisión identificó que los contratos de autorización, procedencia de rutas y cotización comercial tenían pruebas individuales, pero **no existía una prueba de integración que exigiera atravesar los tres límites de confianza en una sola operación**. Esto no demuestra una vulnerabilidad de producción, porque todos los módulos están aislados y no desplegados, pero era una brecha de cobertura técnica.

## Corrección
Se añadió `tests/delivery-manager-integrated-boundary-isolated.cjs`, que compone:
1. Matriz de permisos del principal simulado (`authorize`).
2. Acceso a cesta, cliente asignado y dirección guardada/alternativa/nueva.
3. Validación de procedencia de rutas (`verifyRouteProvenance`), con destino, cesta, versión de tarifas, almacenes y caducidad.
4. Conversión de las distancias verificadas a la estructura esperada por el motor sintético de contabilidad (`quoteManagerServerContract`).

Se añadió `tests/delivery-manager-integrated-boundary-isolated.test.cjs` con casos de gestor válido, cliente nuevo y habitual, dirección alternativa, entrega gratuita, acceso ajeno, suplantación de rol, rutas caducadas o procedentes del navegador, distancias manipuladas, campos extra y cambios de versión de configuración tras un evento de auditoría. Se incorporó la prueba al workflow de GitHub Actions y la ejecución final fue satisfactoria.

## Reglas comerciales conservadas
- Umbral de entrega gratis de 200 USD, configurable solo por administrador general.
- Redondeo al alza al múltiplo de 100 CUP.
- La entrega gratuita mantiene `calculatedDeliveryValueCup` y registra `promotionCoveredCup` mientras `customerFeeCup=0`.
- El último importe histórico de mensajería no sustituye la cotización vigente.
- La mensajería comercial no se confunde con el gasto real del transportista.

## Requisitos pendientes antes de staging
1. **Identidad y autorización reales:** el backend debe construir el principal y las asignaciones desde una sesión confiable, nunca desde datos del navegador.
2. **Procedencia real de rutas:** la bandera `trustedByServer` es solo una afirmación en un fixture; debe provenir de un servicio o caché confiable y estar vinculada a destino, cesta, almacenes y versión.
3. **Consistencia transaccional:** obtener cesta, direcciones, tarifas y ruta desde una instantánea coherente; detectar modificaciones concurrentes y reintentos.
4. **Auditoría persistente:** registrar cambios administrativos de tarifas en almacenamiento append-only con control de versión, actor y permisos de lectura. Un hash SHA-256 aislado no proporciona inmutabilidad ni autenticidad por sí mismo.
5. **Política de roles:** confirmar si el supervisor puede consultar registros de auditoría, manteniendo su carácter de solo lectura.
6. **Pruebas de integración y experiencia móvil:** realizar pruebas autorizadas con staging sintético, controles de sesión y rutas verificadas antes de activar el cotizador.
7. **Controles operativos:** límites de tamaño y tasa, tratamiento de errores, privacidad de direcciones, trazas sin datos sensibles, recuperación y reversión.

## Límites
Este trabajo valida **contratos sintéticos**, no servicios operativos. No demuestra que la integración con Supabase, autenticación real, geocodificación o pagos esté lista. No se modificaron Supabase, producción, clientes reales ni pedidos.
