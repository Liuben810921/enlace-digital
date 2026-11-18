# Geoapify offline: segunda batería y diseño sin servidor propio

Base `9415ba19791b48d42237a69a19871a2c8e4a6b69`; rama aislada. Archivos nuevos `experiments/geoapify-offline/adapter-v2.mjs` y `adapter-v2.test.mjs`, **sin integración con código operativo**. Se prioriza una sola ubicación de origen; múltiples orígenes son excepcionales. El cálculo de créditos es conservador: uno por ruta sencilla simulada, no garantía de tarifa API.

## Protección de claves y arquitectura
**No existe secreto confiable en GitHub Pages.** Restringir la API key por HTTP referrer puede reducir abuso casual pero no ocultarla; no habilitar cotizaciones comerciales usando una clave pública. Para cero servidor propio, evaluar posteriormente un intermediario gestionado con secretos, autenticación, cuota dura y límite de gasto cero, sujeto a condiciones gratuitas verificadas y autorización independiente. No se crea ni configura ninguno. Alternativa sin intermediario seguro: mantener cotización manual/PENDIENTE; nunca simular seguridad con ofuscación.

## Garantías de pruebas
Parser de fixtures sin red: errores de red/timeout, 401/403/404/429/500, NoRoute, respuesta vacía, rutas duplicadas, NaN/Infinity, tiempo y distancia inválidos. Validación estricta de coordenadas, coste, mínimo de kilómetros y arreglo de orígenes. Presupuesto offline por `used + reserved + planned <= limit`; **no es un limitador transaccional real**, no protege concurrencia entre usuarios. Respuesta cerrada `PENDIENTE` si falta una ruta, se agota cuota o hay anomalía. No hay credenciales ni fetch.

Para reproducir en entorno con Node.js ya instalado: `node experiments/geoapify-offline/adapter-v2.test.mjs`. Sin dependencias externas.

## Puertas
Ninguna cuenta, API key, solicitud externa, servicio, descarga, despliegue, GitHub Actions, Supabase, staging, producción ni pedidos. Para piloto real hace falta aprobación separada y una arquitectura de clave/costo seguro demostrada. Cobertura real y distancia de calles: no comprobadas.
