# Validación móvil: capturas actualizadas, zoom y teclado — 14 noviembre 2026

## Ejecuciones confirmadas
- CI visual [#43635752486](https://github.com/Liuben810921/enlace-digital/actions/runs/43635752486): **success**, SHA `4620a6772b4498255ba1f0c6af626c3e1f667fcd`.
- CI integral [#43635752475](https://github.com/Liuben810921/enlace-digital/actions/runs/43635752475): **success**, mismo SHA.
- Artefacto visual [#14129472980](https://github.com/Liuben810921/enlace-digital/actions/runs/43635752486/artifacts/14129472980): ZIP de 1.340.618 bytes, no caducado. Se extrajeron nueve imágenes (320/375/430 px, normal/cuarentena/recuperado).
- Se inspeccionó una lámina de contacto de las nueve capturas: aviso visible, controles deshabilitados en cuarentena, restauración visual después de recuperar; no se aprecia corte horizontal en la lámina. La detección automatizada de desbordamiento ya aprobó las tres anchuras.

## Pruebas ampliadas
En `tests/delivery-mobile-visual.playwright.cjs` se añadieron verificaciones Chromium para cada anchura:
1. Zoom CSS del 200 % con viewport de doble ancho, manteniendo anchura CSS efectiva equivalente; ausencia de desbordamiento horizontal.
2. Campos de proveedor y almacén recuperan editabilidad tras desbloqueo.
3. Nueva cuarentena vuelve a deshabilitar ambos campos incluso con zoom.
4. Doce pulsaciones de Tab no deben enfocar controles deshabilitados; aviso con `role=alert`.
5. Capturas adicionales `delivery-*-zoom200-quarantine.png` y `delivery-*-zoom200-recovered.png`, si CI termina correctamente (15 imágenes en total).

## Limitaciones y pendientes
- El zoom CSS simulado no certifica todas las particularidades del zoom nativo del navegador o de accesibilidad del sistema operativo.
- No se ha ejecutado lector de pantalla ni prueba Android física.
- Las comprobaciones de teclado cubren exclusión de campos deshabilitados, no una auditoría WCAG completa.
- Las nuevas 15 capturas y pruebas ampliadas quedan pendientes de conclusión de CI.
- Sin despliegue ni modificaciones a Supabase, staging, producción, clientes, pedidos o servicios.
