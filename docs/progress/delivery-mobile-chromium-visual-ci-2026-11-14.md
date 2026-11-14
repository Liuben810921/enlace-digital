# Pruebas visuales móviles automatizadas, sin despliegue — 14 noviembre 2026

## Base verificada
- [GitHub Actions #43634694171](https://github.com/Liuben810921/enlace-digital/actions/runs/43634694171) **success**: prueba de marcado móvil y regresiones funcionales de entregas.

## Implementación
- `tests/build-delivery-mobile-visual-fixture.py`: genera HTML aislado desde funciones reales de `index.html` (sin conexión de red y con datos ficticios).
- `tests/delivery-mobile-visual.playwright.cjs`: navegador Chromium a 320, 375 y 430 px; comprueba proveedor, almacén, asociación, ausencia de desbordamiento horizontal, cuarentena, invalidación de cotizaciones y recuperación explícita; guarda tres capturas por anchura.
- `.github/workflows/isolated-delivery-mobile-visual.yml`: ejecución aislada y publicación de capturas como artefacto de Actions, con retención de siete días.
- `.github/workflows/isolated-delivery-quote.yml`: añade trabajo visual junto a la batería existente.
- El primer intento [#43634958078](https://github.com/Liuben810921/enlace-digital/actions/runs/43634958078) falló durante instalación: Playwright 1.56.1 no admite instalar Chromium con dependencias sobre Ubuntu 26.04. Se cambió a contenedor `mcr.microsoft.com/playwright:v1.56.1-noble`, con versión fija.
- [Visual #43635029622](https://github.com/Liuben810921/enlace-digital/actions/runs/43635029622) y [CI integral #43635038531](https://github.com/Liuben810921/enlace-digital/actions/runs/43635038531) requieren verificación final.

## Restricciones
Las capturas solo son evidencia si el job de Chromium termina con éxito y publica el artefacto; no se afirma que ya estén disponibles. No son capturas de un teléfono físico ni pruebas completas de todo el sitio. Sin cambios en Supabase, staging, producción, clientes, pedidos ni servicios.
