# Auditoría de interfaz móvil y reglas de mensajería

**Fecha:** 13 noviembre 2026. **Rama aislada:** `audit/delivery-map-readonly-20261113`.

## Hallazgos y correcciones
1. En pantallas estrechas, los importes y botones podían comprimirse: botones flexibles, métricas apiladas por debajo de 360 px, alineación adaptable, `overflow-wrap` y ancho mínimo cero.
2. La región de resultados no tenía un rol explícito: se añadió `role=region` y estado de anuncio `aria-live=polite`, `aria-atomic=true`; se respeta movimiento reducido.
3. El formulario aceptaba subtotal con más de dos decimales y distancias o importes sintéticos desmesurados: se validan centavos, máximos y el umbral activo antes de cotizar. Errores ocultan resultados anteriores.
4. Se ampliaron pruebas de límites: distancia 3,00 km = 600 CUP; 3,01 km = 700 CUP; 4,01 km = 900 CUP, redondeo hacia arriba a 100 CUP; suelo especial 1.250 CUP = 1.300 CUP; pedidos gratuitos preservan el valor comercial y la bonificación.

## Evidencias
- Archivos: `tests/fixtures/delivery-admin-mobile-demo.html`, `tests/delivery-admin-mobile-demo.test.cjs`, `tests/delivery-accounting-manager-isolated.test.cjs`.
- GitHub Actions: workflow `isolated-delivery-quote.yml`; última ejecución https://github.com/Liuben810921/enlace-digital/actions/runs/43499252577 (comprobar estado).

## Limitaciones
Pruebas de marcado HTML y lógica con Node VM; **no equivalen a una inspección visual real** ni auditoría WCAG completa. La pantalla es independiente, sin autenticación real, almacenamiento, conexión de rutas, Supabase, checkout, producción o pedidos. Los roles administrativos siguen siendo un contrato sintético; deberán aplicarse en servidor antes de activar la configuración. Los costos de mensajería reales se contabilizarán aparte del valor comercial estimado.
