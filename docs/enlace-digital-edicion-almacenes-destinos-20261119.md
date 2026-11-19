# Edición segura de almacenes y destinos — pruebas focalizadas 2026-11-19

Base: 69df6168a67e4e9aa280e588387fd1198cc025ba. Rama plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical; sin commits posteriores.

## Cambios implementados
- edDeliveryOriginEdit y edDeliveryDestinationEdit capturan instantáneas brutas de almacenamiento al abrir edición.
- edDeliveryOriginSave y edDeliveryDestinationSave rechazan guardar registros existentes cuando no existe instantánea o cambió la configuración desde la apertura.
- edDeliveryOriginSave deja de interpretar JSON corrupto de asociaciones como ausencia de dependencias al cambiar tipo/proveedor; rechaza listas malformadas y valores no textuales.
- Los guardados de creación (sin ID existente) conservan el comportamiento previo.
- La comprobación localStorage no garantiza atomicidad entre pestañas: queda pendiente una estrategia transaccional para múltiples administradores.

## Ejecución sintética focalizada
Se extrajeron funciones reales de index.html desde GitHub y se ejecutaron con datos ficticios y dobles de DOM, localStorage y persistencia.

| Función | Escenario | Resultado |
|---|---|---|
| edDeliveryOriginSave | Edición válida con instantánea vigente | PASS, una llamada de persistencia |
| edDeliveryOriginSave | Datos modificados desde apertura | PASS, rechaza, cero escrituras |
| edDeliveryOriginSave | Falta instantánea de edición | PASS, rechaza, cero escrituras |
| edDeliveryDestinationSave | Edición válida con instantánea vigente | PASS, una llamada de persistencia |
| edDeliveryDestinationSave | Datos modificados desde apertura | PASS, rechaza, cero escrituras |
| edDeliveryDestinationSave | Falta instantánea de edición | PASS, rechaza, cero escrituras |

6/6 escenarios ejecutados con resultado esperado. El endurecimiento de asociaciones al cambiar proveedor/tipo fue verificado por inspección del código actualizado, no mediante ejecución focalizada de ese caso.

## Pendiente
Pruebas específicas de asociaciones malformadas al editar almacén, escenarios de cambios de proveedor, persistencia real, restauración de cuarentena y navegador móvil. No se ejecutó batería integral.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
