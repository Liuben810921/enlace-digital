# ENLACE DIGITAL — Batería móvil ampliada de entregas, 2026-11-18

## Base y hashes
Rama aislada `plan/havana-osrm-benchmark-offline-20261114`, base `e9917f28d14127903d57b5f14d9cc0d14522dfea`; comparación inicial GitHub: `identical`.
- `index.html`: SHA Git `342a73d7698d2b9f5db7234e77d65dd56f6ca517`, verificado con `git hash-object /mnt/data/ed_exact/index.html`.
- `experiments/havana-delivery-quote/quote.js`: SHA Git `39f82bed45f7645b935e5951f559a68af27cdda9`, verificado con `git hash-object /mnt/data/ed_exact/quote.js`.

## Harness y entorno
Chromium local headless con Playwright Python, pantalla móvil 390×844, DPR 2 y emulación táctil. Se cargó el HTML exacto mediante `page.set_content`, con un shim de `localStorage` exclusivamente en memoria para el origen `about:blank`; se inyectó el texto exacto de `quote.js` mediante `page.evaluate`. Se expuso la vista administrativa en el harness sin autenticar ni acceder a sistemas reales. Se emplearon datos ficticios y ninguna solicitud de red externa. No se ejecutaron GitHub Actions ni despliegues.

Script local reproducible: `/mnt/data/ed_exact/test_delivery_extended.py`; captura local: `/mnt/data/ed_exact/delivery_mobile_extended.png`.

## Resultado reproducido
Ejecución final: **PASS 24 comprobaciones, 0 errores JavaScript**:
1. Panel móvil presente.
2. Alta de proveedor.
3. Edición de nombre.
4–5. Desactivación y reactivación de proveedor.
6. Alta de almacén propio.
7. Edición de almacén.
8–9. Desactivación y reactivación de almacén.
10. Guardar destino ficticio.
11. Contrato offline cargado correctamente.
12. `PENDIENTE` sin distancias verificadas.
13. `SIMULACIÓN FICTICIA` con contrato y distancias inventadas explícitas.
14. Incremento de revisión de contexto.
15–16. Asociación y persistencia local de producto ficticio.
17. Desactivar un almacén asociado **no** dispara cuarentena automáticamente.
18. Cuarentena explícita activa bloqueo.
19. Recuperación rechazada si asociación apunta a almacén inactivo.
20. Recuperación aprobada después de corregir asociación.
21. Reactivación de almacén.
22. Dos almacenes ficticios a 2 y 7 km: origen más lejano y tarifa 1400 CUP a 200 CUP/km.
23. Tarifa especial 900 CUP, distancia 1 km, mínimo facturable 3 km.
24. Sin errores de JavaScript.

## Incidencia de prueba y diagnóstico
La primera versión del harness suponía que desactivar un almacén asociado provocaba cuarentena automática; la aserción falló. La inspección del código exacto muestra que `edDeliveryOriginToggle` modifica el estado e invalida revisión mediante `edDeliveryPersistAndInvalidate`, pero **no** llama a `edDeliveryQuarantine`. La cuarentena se reserva a inconsistencias de almacenamiento o activación explícita. Se corrigió **solo la expectativa del harness**, no el código operativo. La recuperación sí valida que todas las asociaciones referencien orígenes elegibles. No se afirma defecto funcional sin especificación adicional que exija cuarentena automática.

## Estado de cierre
**Aprobado en laboratorio móvil:** formularios básicos, cambios de estado, destinos, asociaciones, control de revisión, cuarentena y recuperación, simulación y tarifas especiales.

**No cerrado comercialmente:** persistencia multiusuario de almacenes/proveedores (hoy demo local), conexión con checkout y distancia vial verificada; autenticación administrativa real y comportamiento al recargar una página con origen normal no se verificaron en este harness. No se activa nada sin autorización independiente.

No se alteraron módulos históricos ni código operativo. No se accedió a Supabase, staging, producción, pedidos reales ni servicios externos.
