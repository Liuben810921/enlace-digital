# Cloudflare Workers Free: verificación y prototipo local de proxy (2026-11-18)

Base: `c85984fecc083b86061461417d429090d5f33a78`; rama `plan/havana-osrm-benchmark-offline-20261114`. Sin creación de cuentas, servicios, claves reales, despliegues, llamadas de rutas, costos, GitHub Actions, Supabase, staging, producción o pedidos.

## Condiciones verificadas en documentación oficial (18-11-2026)
- Workers Free: **100.000 solicitudes/día**, **10 ms CPU/solicitud**, **128 MB RAM**, **50 subrequests por invocación**: https://developers.cloudflare.com/workers/platform/limits/
- Workers Free permite **Durable Objects SQLite-backed**; cuota de objetos/lecturas/escrituras/almacenamiento separada: https://developers.cloudflare.com/workers/platform/pricing/ y https://developers.cloudflare.com/durable-objects/platform/limits/
- En Workers Free, límites de uso son estrictos; no extrapolar que todos los servicios Cloudflare carecen de costo. Los spending limits de Workers no cubren automáticamente Durable Objects/KV/R2: https://developers.cloudflare.com/workers/platform/spend-management/
- Uso comercial: documentación de límites/precios no demuestra por sí sola elegibilidad contractual universal ni disponibilidad para cada cuenta; pendiente verificación de términos aplicables antes de activar. No divulgar datos empresariales no requeridos; no falsear datos obligatorios.
- Secretos de Workers deben permanecer solo en el runtime gestionado; no publicar clave Geoapify en GitHub Pages, URL, HTML o logs.

## Ejecución real offline
Se crearon **solo en el entorno temporal local** `/mnt/data/geoapify-offline/proxy-offline.mjs` y `proxy-offline.test.mjs` (no integrados ni subidos a GitHub en este commit). Node.js `v22.16.0`.
- `node adapter-v2.test.mjs`: **PASS 42 offline assertions**.
- `node proxy-offline.test.mjs`: **PASS 12 proxy assertions; concurrent accepted 2/30, rejected 28/30**.
- SHA-256 de `proxy-offline.mjs`: `0f70829ea0336b6859b8fb5b50481b3a63301815f8c9fbdb172a817190216476`.
- SHA-256 de `proxy-offline.test.mjs`: `8491809fcfb15662c8a86e2c560c8523645399da676d41ce2a9098a79bf0f9d4`.
- Inspección de archivos: sin `fetch(`, URL HTTP ni `listen(`. El prototipo usa HMAC de prueba, validación de coordenadas, nonces para replay, reserva serializada **en memoria** antes de una llamada simulada, denegación de cuotas, errores simulados y reinicio por día.
- **Limitación crítica:** la serialización solo funciona en una instancia Node. No protege procesos paralelos, reinicios ni distribución; el HMAC de prueba tampoco es un modelo de autenticación de usuarios del sitio. Durable Objects con SQLite y autenticación real quedan por diseñar, autorizar y probar en entorno aislado antes de producción.
- No se ha ejecutado ningún Worker real ni Geoapify; cobertura real de rutas: **0**.

## Decisión
GO para diseño aislado; NO-GO para cuentas, despliegue, clave, llamadas externas, integración operativa o cotizaciones reales. Próximo paso técnico: contrato Worker + Durable Object con reserva transaccional y autenticación de sesión, pruebas adversariales offline y presupuesto conservador. No se modificó el código operativo.
