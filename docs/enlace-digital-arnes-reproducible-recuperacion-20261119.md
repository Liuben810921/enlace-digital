# Arnés reproducible de recuperación e interferencias — 2026-11-19

Base 5e06880225f73e41e033ca518110619d229887a2; rama idéntica al inicio; HTML blob bc167baf595fa3085009b421a12eac08438d1b86.

## Archivo incorporado
tests/storage-real-gate-injection-focal.test.cjs (blob 3630da7add66e6a0cb4444cc3c3ee8261f68dc50). Contiene los cuerpos literales extraídos del HTML de edQueueInventory, deleteProductForever, edLoadInventory y las dos migraciones iniciales. Aplica transformaciones con aserción de anclaje único, y comprueba compilación con new Function.

## Resultados verificados en motor JS aislado
El arnés fue evaluado directamente con equivalencia mínima de node:assert/strict y envoltura asíncrona. Tras corregir un ReferenceError por falta de enlace de shared en el caso de inventario, produjo:
- PASS queue remote-once, blocked retry, explicit reconciliation
- PASS delete remote-once, blocked retry, explicit reconciliation
- PASS inventory real interference reproduced
- PASS migrations interference reproduced

**4/4 casos de ejecución JS aislada.** No se ejecutó el archivo con Node; no declarar 4/4 Node. Las 11 y 9 pruebas Node anteriores no se repitieron.

La reconciliación simulada compara remoteSnapshot esperado y products local antes de liberar gate.pending. No reconsulta API remota, no verifica versiones transaccionales, no sobrevive recargas ni impide escrituras desde otra pestaña. En cola, remoteTouched se marca antes de invocar API y por ello trata un fallo de resultado desconocido como potencialmente aplicado, sin reintento destructivo. Falta un caso específico de rechazo remoto y confirmación desconocida.

Interferencia en edLoadInventory: durante segunda lectura de API ficticia se modifica fees.delivery de 1 a 99; la función real persiste 1 y pierde la actualización. Migraciones: durante primer setItem del estado compartido se intercala fees.delivery=99; el escritor restaura 1, y ambas flags terminan done. Se trata de interferencia en setItem simulado; no hay atomicidad ni prueba navegador.

## Decisión
index.html intacto. Aún faltan pruebas integradas de los ocho escritores con persistencia por campos, bloqueo duradero entre pestañas, recuperación tras resultados remotos desconocidos y reconciliación verificable. Web Locks nativo PENDIENTE. Solo después evaluar modificación operativa.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
