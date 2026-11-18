# ENLACE DIGITAL — Cierre focalizado de Administración de entregas
Fecha: 2026-11-18. Rama: `plan/havana-osrm-benchmark-offline-20261114`. Base: `5e1d82a66cdf435a2509ba14c00b5bd9008156b3` (comparación GitHub: identical).

## Decisión de prioridad
Se suspenden las revisiones de registro, catálogo, carrito e IPC, salvo regresión necesaria. Único objetivo activo: **terminar y validar Administración de entregas**, almacenes, proveedores, destinos, asociaciones de productos, tarifas y comportamiento móvil, y su relación con el checkout. No declarar cerrado sin evidencia funcional suficiente.

## Hallazgos directos del código
- `index.html`, SHA Git `342a73d7698d2b9f5db7234e77d65dd56f6ca517`, contiene la navegación administrativa literal **Administración de entregas** (`id=navdelivery` y `adminTab('delivery')`).
- La gestión experimental de orígenes y proveedores emplea claves `ed_delivery_origins_demo_v1`, `ed_delivery_suppliers_demo_v1` y revisión/contexto de cuarentena en `localStorage`. El propio código advierte que esos puntos se almacenan **solo en este navegador**, sin escritura a Supabase ni uso para pedidos reales.
- La simulación final usa `window.EDOfflineQuote?.quoteDelivery`, rutas ficticias `km=2+i*3` solo en modo sintético, y el mensaje **SIMULACIÓN FICTICIA ... NO ES TARIFA REAL**. Si no hay contrato offline o distancias verificadas, devuelve `PENDIENTE`.
- `experiments/havana-delivery-quote/quote.js`, SHA `39f82bed45f7645b935e5951f559a68af27cdda9`, declara que es un contrato aislado sin conexión al checkout ni producción.

## Criterios de aceptación del cierre
| Elemento | Estado verificable actual | Requisito para cerrar |
|---|---|---|
| Nombre y navegación administrativa | Etiqueta `Administración de entregas` presente en HTML | Probar apertura, navegación y retorno en móvil |
| Almacenes propios | Código experimental de orígenes presente | Alta, edición, activación, persistencia, validación y recuperación |
| Proveedores y almacenes asociados | Código experimental y referencias a proveedores presentes | Alta/edición, asociaciones correctas, desactivación y cuarentena |
| Destinos y direcciones | Elementos de destino y formulario checkout presentes | Verificar coherencia entre destino, municipio, dirección y cotización |
| Tarifas normales y especiales | Contrato offline admite tarifa por km, mínimo y tarifa especial | Validar parámetros editables y aplicación por producto |
| Selección de almacén más lejano | Contrato offline ordena distancias elegibles descendentes | Prueba con varios orígenes y distancias viales verificadas |
| Estado `PENDIENTE` | Contrato fail-closed para distancias faltantes o inválidas | Probar sin generar cargos reales ni falsos importes |
| Integración con checkout | **No acreditada**: simulación expresamente separada | Decidir integración autorizada y probar recorrido ficticio |
| Pruebas visuales móviles | **No ejecutadas en esta revisión** | Ejecutar Chromium con `index.html` exacto y comprobar formularios |

## Bloqueantes de declaración de cierre
1. Falta evidencia de pruebas funcionales móviles de Administración de entregas sobre el HTML exacto.
2. Los datos de almacenes/proveedores siguen explícitamente marcados como demostración en `localStorage`; no se puede afirmar persistencia empresarial multiusuario.
3. Las distancias son ficticias en la simulación y no existe prueba de cotización vial real ni integración de cobro en checkout.
4. Cualquier activación de almacenamiento remoto, servicios, rutas reales o pedidos necesita autorización específica. No debe hacerse de forma implícita.

## Siguiente ejecución estrictamente focalizada
Obtener el HTML exacto completo en un entorno de navegador local; ejecutar pruebas móviles de alta/edición de almacenes y proveedores, destinos, cuarentena, persistencia y `PENDIENTE`. Corregir solo fallos reproducidos en rama aislada. Si pasa, documentar aceptación de la **administración experimental** y separar expresamente las integraciones empresariales pendientes; no llamar cerrado el módulo comercial completo hasta comprobarlas.

No se modificó código funcional ni se activó ningún servicio, GitHub Actions, staging, producción, Supabase, pedidos o pagos.
