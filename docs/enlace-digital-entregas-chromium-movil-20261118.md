# ENLACE DIGITAL — Administración de entregas: pruebas Chromium móvil focalizadas (2026-11-18)

## Alcance y procedencia
Base `c51276982bf1caf449847759a18b9ac5c1c87e0c`, rama aislada `plan/havana-osrm-benchmark-offline-20261114`; comparación inicial GitHub: `identical`.
Se comprobó `index.html` exacto de GitHub SHA Git `342a73d7698d2b9f5db7234e77d65dd56f6ca517`; la copia local `/mnt/data/ed_exact/index.html` produjo exactamente ese hash con `git hash-object`. Tamaño local: 352443 bytes. El archivo original no se modificó en GitHub.

## Ejecución Chromium
Entorno: Chromium local `/usr/bin/chromium`, Playwright Python, viewport móvil 390×844, DPR 2, emulación táctil; red externa bloqueada. La navegación directa `file://` y `http://127.0.0.1` falló con `ERR_BLOCKED_BY_ADMINISTRATOR`. Para evitar servicios y acceso remoto se utilizó `page.set_content` con los bytes del HTML exacto, añadiendo **únicamente al harness en memoria** un shim de `localStorage` por las restricciones del origen `about:blank`. Se retiró la clase visual `hidden` del panel admin mediante el harness para probar sus formularios, sin autenticar un usuario real. Estas adaptaciones limitan el alcance de la prueba: no validan autenticación, persistencia tras cerrar el navegador ni carga normal de recursos externos.

### Casos comprobados
1. El código JavaScript inicializa sin `pageerror` cuando existe almacenamiento local de pruebas.
2. `adminTab('delivery')` genera el panel y el encabezado **Proveedores**; contiene formularios de proveedores, puntos de salida, destinos, simulador y tarifa.
3. Registrar proveedor ficticio mediante formulario guarda un objeto `active:true` en `edDeliverySuppliersRead()`.
4. Registrar almacén propio ficticio en Plaza de la Revolución, con dirección manual, guarda un origen `type:'propio'` y `version:1` en `edDeliveryOriginsRead()`.
5. Registrar destino ficticio en Playa guarda su nombre, municipio y dirección en `edDeliveryDestinationsRead()`.
6. Al seleccionar destino y pulsar **Comprobar estado PENDIENTE**, se muestra `PENDIENTE · Contrato offline no disponible; no se puede simular.`
7. Pulsar **Simular distancias ficticias** mantiene el mismo estado cuando no está cargado `EDOfflineQuote`; no muestra tarifa falsa.
8. Sin errores JavaScript observados durante los pasos anteriores.

La ausencia del contrato en esta ejecución es una limitación del harness: el HTML original incluye `<script src="experiments/havana-delivery-quote/quote.js">`, pero el navegador aislado no cargó esa ruta relativa desde `about:blank`. **No se atribuye este resultado a un defecto demostrado del sitio en su despliegue normal**.

## Evidencias locales
Capturas producidas en `/mnt/data/ed_exact/delivery_mobile_initial.png` y `/mnt/data/ed_exact/delivery_mobile_after.png`. Script del harness local `/mnt/data/ed_exact/test_delivery_mobile.py`. Las capturas no se subieron al repositorio; el informe conserva los pasos reproducibles y la limitación de origen.

## Criterios de cierre
| Componente | Estado |
|---|---|
| Nombre y navegación de Administración de entregas | Presente y renderiza en Chromium móvil sintético |
| Alta de proveedor | Superada en navegador simulado |
| Alta de almacén propio | Superada en navegador simulado |
| Alta de destino de referencia | Superada en navegador simulado |
| Estado PENDIENTE sin contrato | Superado, sin tarifa ficticia |
| Edición/desactivación de proveedores y almacenes | No ejecutado en esta batería |
| Asociaciones de productos y cuarentena | No ejecutado en esta batería |
| Tarifas especiales, almacén más lejano | No ejecutado en esta batería |
| Persistencia real y acceso administrativo autenticado | No acreditado |
| Integración de distancias viales y checkout | No acreditado; el código usa demostraciones locales |

## Decisión
**No declarar cerrado todavía** el módulo empresarial de entregas. No se reprodujo un fallo que justifique cambiar el código operativo. Priorizar una batería móvil ampliada y controlada de edición, asociaciones, cuarentena, tarifas y contrato offline cargado localmente, y distinguir claramente los bloqueantes de integración empresarial de los experimentos. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos.
