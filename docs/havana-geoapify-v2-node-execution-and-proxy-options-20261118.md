# Ejecución real Node.js del adaptador Geoapify v2 y evaluación de intermediarios (2026-11-18)

**Base:** `d9dd57f3dd6777935d98ed199e9958b0402313c0`. Rama aislada `plan/havana-osrm-benchmark-offline-20261114`.

## Prueba ejecutada
- Se recuperaron desde GitHub los archivos exactos `experiments/geoapify-offline/adapter-v2.mjs` y `adapter-v2.test.mjs` del commit base y se reprodujeron en directorio temporal aislado.
- `node --version`: **v22.16.0**.
- `node /mnt/data/geoapify-offline/adapter-v2.test.mjs`: **`PASS 42 offline assertions`**, salida real, exit code 0.
- 42 comprobaciones: caso habitual un almacén, varios almacenes excepcionales, distancias y tarifas sintéticas, fallos de red/timeout, HTTP 401/403/404/429/500, NoRoute, respuestas ausentes o inválidas, NaN/Infinity, coordenadas fuera de rango, presupuesto diario y cuotas.
- No se reprodujo defecto con la batería existente; **sin cambios de código**. El script tiene 42 aserciones efectivas, no 19: el bucle cuenta las instancias.
- Limitaciones: no es prueba integrada ni de concurrencia, ni validación de la respuesta real de Geoapify. `budgetDecision` es aritmética local y **no** reserva créditos atómicamente; podría excederse con solicitudes concurrentes. El parser acepta estructura de fixtures y debe contrastarse con un payload oficial real antes de producción. 0 rutas reales.

## Alternativas para clave segura sin servidor propio (evaluación arquitectónica; no se crearon recursos)
1. **Cloudflare Workers + Secrets + KV/Durable Objects**: puede alojar proxy sin servidor propio; secrets no visibles en cliente; control transaccional de cuota requiere Durable Objects u otra solución consistente, autenticación, rate limiting, límites de CPU y solicitudes. Existen planes gratuitos con límites, pero **elegibilidad, disponibilidad, condiciones comerciales, cuotas y costo cero integral no comprobados**. No asumir que KV por sí solo garantiza cuotas atómicas. Requiere cuenta/servicio externo, por ahora prohibido.
2. **Vercel Functions / Netlify Functions**: variables de entorno secretas y endpoints gestionados; planes gratuitos con límites y restricciones comerciales distintas. En particular, comprobar términos comerciales del plan gratuito antes de recomendar. Necesitan cuenta/servicio, no autorizados.
3. **Supabase Edge Functions**: secret management y funciones alojadas; el usuario prohíbe acceso o cambios a Supabase y su staging/producción, por tanto **fuera de alcance**.
4. **Clave directamente en GitHub Pages restringida por referrer**: **rechazada** para cotización comercial. Una API key en JS o URL es pública y restricciones por referrer no son secreto ni garantizan protección contra abuso.
5. **Sin proxy**: mantener `PENDIENTE` y cotización manual hasta disponer de mecanismo seguro y gratuito verificable.

**Recomendación condicional:** evaluar Cloudflare Workers en un estudio separado como primera opción de intermediario gestionado, pero **no activarlo** hasta verificar restricciones legales, comercialidad, cuotas, autenticación, gasto cero y aceptación expresa. El plan gratuito de Geoapify no prueba gratuidad de un proxy.

## Límites cumplidos
No GitHub Actions, consultas API, descargas, cuentas, servicios, claves, costos, Supabase, staging, producción, pedidos, despliegues ni modificaciones del sitio. Solo documento de evidencia en GitHub. No se ha enviado información empresarial a proveedores.
