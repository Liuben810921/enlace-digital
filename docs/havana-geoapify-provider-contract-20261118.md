# Geoapify — contrato de integración aislada y plan de activación (2026-11-18)

Base: `7f00d7b1c6d2f87c61aa79b861fc9a8b4ffa1e26`; rama `plan/havana-osrm-benchmark-offline-20261114`. Decisión del propietario: elegir Geoapify como proveedor provisional y continuar sin servidor propio. Esta decisión **no autoriza** inventar datos de registro, eludir restricciones de país o términos de servicio, crear cuenta, almacenar claves, efectuar llamadas, activar servicios ni generar gastos. No divulgar información comercial no requerida.

## Principio
El plan de 3.000 créditos/día no significa 3.000 entregas: una simulación con N almacenes puede requerir N rutas y consumir N o más créditos. El presupuesto real requiere medir la respuesta y el consumo, y controles de cuota. No dar por confirmada cobertura de La Habana.

## Contrato de proveedor (propuesto; sin implementación operativa)
Interfaz interna `RoadDistanceProvider.quote({ origin:{lat,lon}, destination:{lat,lon}, mode:'drive', correlationId })` → `{status:'OK'|'NO_ROUTE'|'UNAVAILABLE'|'INVALID'|'QUOTA',distanceMeters?,durationSeconds?,provider:'geoapify',profile:'drive',mapProvenance?,checkedAt?,requestId?}`. No incluir nombres, teléfonos, identificadores de clientes ni direcciones textuales en solicitudes; solo coordenadas públicas en pruebas.

Adaptador Geoapify: `/v1/routing?waypoints=lat,lon|lat,lon&mode=drive&format=json&apiKey=...` (documentación del proveedor; **no ejecutar**). Atención: Geoapify usa `lat,lon`, OSRM usa `lon,lat`. Validar rango de lat/lon, tipo numérico finito, estructura JSON, HTTP, `results[0].distance` en metros y `time` en segundos, geometría y puntos ajustados a carretera. No aceptar rutas en línea recta como sustituto.

La decisión de tarifa continúa separada: varios almacenes → cotizar cada origen aplicable → usar el **más lejano** según regla aprobada; mínimo 3 km y tarifa configurada; si falla una ruta relevante, no afirmar cuál es la más lejana y mantener `PENDIENTE`. Tarifas especiales siguen siendo reglas independientes. No conectar a pedidos reales.

## Seguridad
No poner `apiKey` en HTML, JS, repositorio, logs, URL pública o capturas. Restricciones por referer no convierten una clave en secreto; el uso directo desde GitHub Pages no es solución de seguridad para cobros. Exigir intermediario de confianza con secreto, validación de orígenes, autenticación/autorización, cuotas duras, limitador de tasa, caché y observabilidad sin datos sensibles. **La gratuidad del intermediario no está demostrada**; no activar sin revisión específica de proveedor, condiciones y costos.

## Pruebas antes de activar
- 12 pares públicos del runbook `docs/havana-osrm-local-lab-runbook-20261118.md`; confirmar accesos viales públicos, no centros de edificios.
- Pruebas sintéticas offline del adaptador (sin claves ni red): lat/lon invertidos, NaN, Infinity, respuesta vacía, 4xx, 429, 5xx, timeout, `NoRoute`, distancia 0/negativa, faltan campos, multi-almacén con fallo parcial, cuota agotada y duplicación de solicitudes.
- Para una futura prueba real, exigir aprobación separada de cuenta/clave/12 consultas, condiciones aplicables y política de sobreconsumo, sin declarar producción lista.
- En cualquier error, `PENDIENTE`; jamás crear una tarifa inventada ni activar pedidos.

## Puertas y estado
**GO** para diseño y pruebas sintéticas locales, **NO-GO** para llamadas externas, claves y despliegues. Falta confirmar elegibilidad contractual real, mecanismo seguro sin servidor propio, coste cero extremo a extremo y cobertura. No se ha creado cuenta, enviado ninguna consulta comercial, hecho llamadas API ni activado servicios. No se modificaron Supabase, staging, producción, clientes ni pedidos.
