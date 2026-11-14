# Validación funcional móvil sin despliegue — 14 noviembre 2026

## Verificación previa
- [GitHub Actions #43634436458](https://github.com/Liuben810921/enlace-digital/actions/runs/43634436458): **success**. Se comprobaron cuarentena, recuperación explícita, almacenes efectivos, asociaciones e invalidación de cotizaciones.

## Pruebas incorporadas
- `tests/delivery-mobile-markup-contract.test.cjs`: extrae el código real de `index.html` y evalúa en un DOM sintético el formulario de asociaciones. Comprueba `viewport` móvil, selección de proveedor, filtro por almacén, asociación marcada, aviso accesible de cuarentena y desaparición de casillas durante el bloqueo.
- Incorporada al workflow aislado `isolated-delivery-quote`, sin dependencias externas ni despliegue.
- [GitHub Actions #43634694171](https://github.com/Liuben810921/enlace-digital/actions/runs/43634694171): ejecución nueva a verificar.

## Protocolo visual reproducible (pendiente de ejecución manual)
1. Abrir el archivo local `index.html` desde un entorno de pruebas aislado, sin conectar Supabase ni usar datos reales; no utilizar GitHub Pages público ni producción.
2. En un navegador móvil o emulador, comprobar anchos 320, 375 y 430 px, zoom 100 % y 200 %, orientación vertical y horizontal.
3. Revisar Administración de entregas: tarjetas de proveedores, almacenes, formularios, etiquetas, botones de 44 px o más y desplazamiento horizontal.
4. Simular localStorage con proveedores y almacenes ficticios; comprobar selector de proveedor, almacenes efectivos y que el cambio de proveedor no conserve almacenes de otro proveedor.
5. Forzar la cuarentena mediante entorno de pruebas, comprobar aviso visible y ausencia de casillas, recuperación explícita y rechazo si quedan asociaciones inválidas.
6. Capturar pantalla y registrar dispositivo, navegador, dimensiones y resultados; esta fase no afirma que se hayan capturado pantallas reales.

## Restricciones
No hay pruebas visuales reales ejecutadas en Android en esta fase; las aserciones son de marcado y DOM simulado. El prototipo local no garantiza persistencia transaccional ni validación de pedidos. Sin cambios en Supabase, staging, producción, clientes, pedidos o servicios.
