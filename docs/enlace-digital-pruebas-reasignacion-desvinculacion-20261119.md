# Pruebas focalizadas de reasignación y desvinculación — 2026-11-19

Base: 509c673c9005eef411b0ba1ec3e89d8302cfb0f1. Rama aislada: plan/havana-osrm-benchmark-offline-20261114. Comparación inicial: identical, cero commits posteriores.

## Correcciones
Commits cf1d332a8bb7795eeb5bcb8877e40ab4ea25ad7e y fbaf7c464876a7d245260e6170ac037fd3ef213f.
- Reasignación y desvinculación exigen inventario cargado.
- Ambas interpretan estrictamente el JSON bruto de asociaciones, rechazando datos malformados, objetos incorrectos y listas con valores no string.
- Ambas comprueban instantáneas serializadas de asociaciones, almacenes y proveedores tras confirmar; cancelan si hay cambios detectados.
- Se preservan reversión e invalidación de cotizaciones ya existentes.

## Ejecución focalizada
Se extrajeron las funciones reales desde index.html obtenido mediante GitHub y se ejecutaron con un arnés JavaScript sintético, sin navegador, servicios ni datos reales. Dos productos ficticios: p1=[w1], p2=[w1,w2]. Para cada función se ejecutaron cinco escenarios:

| Escenario | Reasignar w1 a w2 | Desvincular w1 |
|---|---|---|
| Normal | PASS: p1=[w2], p2=[w2]; 1 escritura | PASS: p1=[], p2=[w2]; 1 escritura |
| JSON malformado | PASS: rechaza, 0 escrituras | PASS: rechaza, 0 escrituras |
| Almacenes cambian durante confirmación | PASS: rechaza, 0 escrituras | PASS: rechaza, 0 escrituras |
| Escritura simulada falla | PASS: rechaza, intenta restauración y entra en cuarentena | PASS: igual |
| Invalidación simulada falla | PASS: rechaza y restaura mapa previo | PASS: igual |

10 escenarios ejecutados; 10 PASS en el arnés sintético. El fallo de escritura simulado lanza también durante restauración, por lo que la cuarentena es esperada. Las escrituras contadas incluyen intentos fallidos de restauración.

## Limitaciones
No se han probado DOM, Chromium móvil, persistencia real, concurrencia entre pestañas, recuperación de cuarentena con almacenamiento real, ni integración con inventario remoto. El control de instantáneas no equivale a transacciones atómicas. Las pruebas de otros flujos y la batería integral permanecen PENDIENTES, sujetas a autorización independiente.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
