# ENLACE DIGITAL — Validación de existencias en edición rápida
Fecha: 2026-11-19. Rama `plan/havana-osrm-benchmark-offline-20261114`.

## Base y concurrencia
La base solicitada era `7fdd0bb14ed304c3085ac48fd4fcd71e222522fd`. Al comenzar, HEAD ya estaba **4 commits por delante**, con modificaciones previas a `index.html` y documentación de guardado de asociaciones. Se trabajó sobre el HEAD existente sin revertir esos cambios.

## Defecto reproducido
La función `changeProduct` convertía `qty='1.8'` en `1` por `Math.floor`, y valores no numéricos en `0` por el fallback. Eso podía alterar silenciosamente las existencias. Se reprodujo la conversión de 1.8 a 1 en la función original con datos ficticios.

## Corrección
Edición rápida: validar cantidades como enteros seguros no negativos, rechazar texto no numérico, negativos y fracciones sin guardar; permitir campo vacío como existencias pendientes (`null`). Validar precio como número finito no negativo. Limitar esta función a los campos `qty` y `price`.

## Pruebas focalizadas
Fuente GitHub `index.html`, blob `7f79892b087034e4a3a58b31070a138ac1cb4462`.
- Cantidad fraccionaria 1.8: rechazada, cantidad previa 5 intacta, sin guardar — **PASS**.
- Texto inválido: rechazado, cantidad previa intacta — **PASS**.
- Cantidad entera 3: guardada — **PASS**.
- Campo vacío: existencias `null` — **PASS**.
- Precio decimal válido 12.5: guardado — **PASS**.
- Sintaxis JavaScript inline completo: **PASS**.

Pruebas aisladas con estado ficticio; no se ejecutaron pruebas de navegador ni la batería integral. Cotizaciones de rutas no verificadas permanecen `PENDIENTE`. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
