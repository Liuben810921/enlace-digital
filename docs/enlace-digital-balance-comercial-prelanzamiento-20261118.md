# ENLACE DIGITAL — Balance comercial previo al lanzamiento
Fecha: 2026-11-18
Rama aislada: `plan/havana-osrm-benchmark-offline-20261114`
Base comprobada: `8e119d295733b51fbe706aafd33e7f953a55fcc0` (comparación GitHub `identical`).

## Decisión de alcance
Se considera **suficientemente avanzada para esta etapa** la investigación experimental de IPC. Se conservan sus códigos, pruebas y evidencias; se documentan sus riesgos residuales, sin declarar resueltos bypass de `startBroker`, TOCTOU o autenticación `SO_PEERCRED`. No se seguirá profundizando en seguridad teórica salvo que surja un defecto reproducible o una necesidad operativa.

No se ejecutaron pruebas nuevas, no se modificó código funcional, no se consultó ni modificó Supabase, staging, producción o pedidos reales. No se lanzaron GitHub Actions ni despliegues.

## Fuentes verificadas en GitHub
- `index.html`, blob `342a73d7698d2b9f5db7234e77d65dd56f6ca517`: inspección de la sección inicial del código HTML/CSS de la tienda. Evidencia de estructura de catálogo, navegación por categorías y estilos responsive; **no demuestra funcionamiento integral de los flujos**.
- `experiments/havana-delivery-quote/quote.js`, blob `39f82bed45f7645b935e5951f559a68af27cdda9`: contrato offline `quoteDelivery`; valida revisión, orígenes, proveedores, distancias verificadas, tarifa mínima, tarifa especial y cuarentena. Su encabezado indica expresamente que **no está conectado al checkout ni a producción**.
- `docs/havana-ipc-physical-current-blob-revalidation-20261118.md`, blob `34598a269b124114ad528ef8976c4c8600da6347`: pruebas experimentales IPC previas, con limitaciones documentadas.

## Matriz de prioridad y criterios de aceptación
| Orden | Área | Resultado necesario | Verificación pendiente |
|---|---|---|---|
| P0-1 | Registro, login, sesiones y destinatarios | Clientes Cuba y extranjero completan el flujo ficticio; permisos correctos | Inspeccionar implementación exacta y ejecutar pruebas controladas autorizadas |
| P0-2 | Catálogo, variantes y stock | Precio y disponibilidad consistentes; agotados no comprables | Prueba móvil y de integridad con datos ficticios |
| P0-3 | Carrito, checkout y pagos | Recorrido íntegro con pagos y pedidos reales desactivados | Prueba end-to-end ficticia y validaciones de formularios |
| P0-4 | Entregas en La Habana | Tarifas, almacenes, proveedores y destinos coherentes con el checkout | Integración y verificación del cotizador; no asumir cartografía operativa |
| P1-1 | Administración móvil | Alta/edición de productos y revisión de pedidos sin pérdida de estado | Prueba funcional móvil |
| P1-2 | Experiencia móvil | Sin bloqueos en formularios, carrito, navegación o retorno | Revisión dirigida de recorridos críticos |
| P1-3 | Gestores/comisiones | Roles, cotización y comisiones según alcance de apertura | Definir si es requisito del lanzamiento inicial o siguiente fase |
| P2 | SMTP, dominio y mejoras opcionales | Comunicaciones y recuperación sin depender de SMS | Depende de dominio, configuración y autorización específicas |

## Criterios para evitar trabajo improductivo
1. No repetir auditorías generales o pruebas que ya tienen evidencia suficiente.
2. Solo corregir defectos reproducidos; registrar la reproducción y verificar la regresión.
3. No ampliar prototipos IPC/OSRM por escenarios extremos sin beneficio comercial concreto.
4. Priorizar pruebas reales de interfaz móvil con código exacto antes de modificar UI.
5. No afirmar listo para lanzamiento hasta validar de extremo a extremo registro, catálogo, checkout y entrega.
6. Mantener pedidos reales desactivados hasta autorización expresa; conservar clientes y datos existentes.
7. No activar servicios, correo transaccional, pagos, staging ni producción sin autorización específica.

## Siguiente bloque de trabajo recomendado
**Inspección focalizada del recorrido comercial en el HTML exacto**: localizar funciones de registro, sesión, catálogo, carrito, destinatarios y checkout; clasificar cuáles están conectadas y cuáles son prototipos; preparar una batería pequeña de pruebas ficticias, preferentemente móvil, sin servicios reales. Después corregir solo fallos demostrados y presentar evidencia verificable.

## Incertidumbres explícitas
Este balance es de planificación y priorización. La revisión actual no incluye ejecución de navegador ni prueba integrada de Supabase o checkout, y no certifica que un módulo concreto esté funcional o roto. Los criterios comerciales se apoyan en las decisiones de producto previamente acordadas; los hechos sobre los archivos provienen de los blobs indicados.
