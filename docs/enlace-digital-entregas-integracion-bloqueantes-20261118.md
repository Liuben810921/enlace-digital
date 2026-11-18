# ENLACE DIGITAL — Plan de integración final de entregas, sin activar servicios
Fecha: 2026-11-18. Rama `plan/havana-osrm-benchmark-offline-20261114`. Base `2acc5785fbc7aada62a0568f6c7c501c6e38aee1`; comparación GitHub: identical.

## Archivos inspeccionados, versiones exactas
- `index.html`: SHA Git `342a73d7698d2b9f5db7234e77d65dd56f6ca517`; lectura íntegra mediante conector GitHub y búsqueda dirigida de funciones.
- `experiments/havana-delivery-quote/quote.js`: SHA Git `39f82bed45f7645b935e5951f559a68af27cdda9`.

## Diagnóstico de los tres bloqueantes
### 1. Persistencia empresarial
`edDeliveryOriginsRead()` lee `ed_delivery_origins_demo_v1` y `edDeliverySuppliersRead()` lee `ed_delivery_suppliers_demo_v1` desde `localStorage`; `edDeliveryDestinationsRead()` utiliza `ed_delivery_destinations_demo_v1`. `edDeliveryPersistAndInvalidate` guarda JSON local, invalida revisión y revierte ante fallos; no persiste en servidor. El comentario del código es explícito: «Prototipo aislado: puntos de salida almacenados solo en este navegador. No escribir en Supabase ni usar coordenadas para pedidos reales». La existencia de `edAdminRpc()` para otras funciones administrativas no demuestra RPC de entregas.

**Contrato offline que se puede preparar:** estructura versionada de almacén/proveedor/destino, validaciones de pertenencia y estado, actualización optimista de revisión, roles administrativos y prohibición de activar cotizaciones antiguas. **Pendiente de autorización específica:** elección/creación de tablas y RPC, permisos y RLS, migración de datos demostrativos a datos empresariales y pruebas en staging. No ejecutar ninguna de estas operaciones en este alcance.

### 2. Checkout
`calcCheckout()` usa `checkoutAmounts()` y muestra «Mensajería (pago directo al mensajero)». La simulación de entregas, por separado, utiliza `window.EDOfflineQuote?.quoteDelivery` y solo presenta `SIMULACIÓN FICTICIA ... NO ES TARIFA REAL`. El archivo `quote.js` declara expresamente «Not connected to checkout or production».

**Contrato offline que se puede preparar:** adaptador puro entre destino, conjunto de orígenes elegibles, ruta vial verificada, revisión de contexto y presentación; devolver `PENDIENTE` ante ausencia de distancia, revisión inválida o cuarentena. La mensajería seguirá separada del importe de productos. **Pendiente:** implementar la integración tras validar la fuente empresarial de datos y realizar prueba móvil del checkout sin pedidos reales.

### 3. Distancia vial verificada
`quoteDelivery()` exige exactamente una ruta por origen elegible y destino, `status:'verified'`, revisión coincidente, `km` finitos en rango y origen más lejano. La simulación actual genera `km=2+i*3` solo para demostración y nunca debe considerarse distancia real.

**Contrato offline que se puede preparar:** importador/validador de matriz vial con procedencia, revisión y cobertura, rechazo de rutas faltantes y verificación de origen más lejano; no marcar rutas ficticias como verificadas comercialmente. **Pendiente de autorización:** obtención de cartografía, uso de motor de rutas o servicio externo, confirmación de licencias/recursos y costos antes de cualquier descarga o activación.

## Secuencia ejecutiva de cierre
1. Mantener aprobadas las 24 comprobaciones móviles anteriores, sin repetirlas.
2. Diseñar/validar offline el esquema de configuración y el adaptador de cotización (sin tocar checkout operativo).
3. Confirmar autorización separada para persistencia empresarial y su entorno de pruebas; preservar datos existentes.
4. Confirmar fuente de distancias viales y recursos; probar cobertura real de La Habana.
5. Integrar cotización con checkout manteniendo mensajería fuera de caja y `PENDIENTE` cuando falten datos.
6. Ejecutar prueba final móvil de extremo a extremo con datos ficticios y pedidos reales desactivados.
7. Declarar cerrado solo cuando los pasos 3–6 estén verificados.

## Estado al finalizar
No se reprodujo un fallo nuevo en esta inspección de código; por ello no se modificaron funciones históricas ni se introdujo un adaptador no integrado que pudiera simular un cierre inexistente. Se publica este plan concreto y la frontera de autorizaciones. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos.
