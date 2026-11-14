# Cierre verificado de CI visual móvil — 14 noviembre 2026

## Resultados confirmados
- [CI visual #43635029622](https://github.com/Liuben810921/enlace-digital/actions/runs/43635029622): **completed / success**, SHA `6ce18c948e8f2b2996590884fb488aee1aad04c0`.
- [CI integral #43635038531](https://github.com/Liuben810921/enlace-digital/actions/runs/43635038531): **completed / success**, SHA `d0c065ab2360f66dbe97a262714245d32d0b5273`; jobs `mobile-visual` y `test` aprobados.
- Logs de Chromium: PASS 320, 375 y 430 px, cada uno con proveedor, almacén efectivo, asociación, cuarentena, invalidación de cotización, recuperación y capturas.
- Logs de `actions/upload-artifact`: **9 archivos subidos**. Artefacto [#14129921411](https://github.com/Liuben810921/enlace-digital/actions/runs/43635029622/artifacts/14129921411), nombre `isolated-delivery-mobile-320-375-430`, tamaño 1.339.382 bytes, `expired=false`.
- Segundo artefacto [#14129317384](https://github.com/Liuben810921/enlace-digital/actions/runs/43635038531/artifacts/14129317384), `delivery-mobile-visual-320-375-430`, 1.339.382 bytes, `expired=false`.

## Matriz de capturas
| Ancho | Normal | Cuarentena | Recuperado |
|---|---|---|---|
| 320 px | delivery-320-normal.png | delivery-320-quarantine.png | delivery-320-recovered.png |
| 375 px | delivery-375-normal.png | delivery-375-quarantine.png | delivery-375-recovered.png |
| 430 px | delivery-430-normal.png | delivery-430-quarantine.png | delivery-430-recovered.png |

## Incidencias y resolución
- [Intento fallido #43634958078](https://github.com/Liuben810921/enlace-digital/actions/runs/43634958078): Playwright 1.56.1 no admitía instalación de Chromium sobre Ubuntu 26.04.
- Solución: ejecutar la prueba visual en el contenedor fijado `mcr.microsoft.com/playwright:v1.56.1-noble`; verificado en ambas CI aprobadas.

## Alcance y límites
Pruebas con Chromium aislado y datos ficticios generados desde funciones reales de `index.html`; no se ha inspeccionado manualmente cada PNG ni se ha probado un teléfono Android físico. El flujo comercial real sigue pendiente de validación transaccional en backend y rutas viales verificadas. No se ha desplegado ni se ha modificado Supabase, staging, producción, clientes reales, pedidos ni servicios.
