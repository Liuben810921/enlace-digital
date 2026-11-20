# Continuidad — materialización móvil y operaciones masivas (2026-11-20)

## Base y alcance
Se verificó con GitHub que la rama aislada `plan/havana-osrm-benchmark-offline-20261114` tenía HEAD idéntico a `ac3e9c2ef6c043b098a0d9427ed1013b34eba8c8` al iniciar. `index.html` se recuperó íntegro por el conector GitHub (426642 caracteres, blob `fe7782d675f261c958ba63a82948405691b2ec4f`).

## Bloqueo móvil
El conector GitHub devuelve el texto del archivo al entorno de herramientas, pero no lo materializa automáticamente como archivo en el contenedor que ejecuta Chromium. No existe una ruta local verificada para esos bytes. El intento anterior de acceso directo al dominio raw falló por DNS (código curl 6). No se repitió esa solicitud. **No se ejecutaron pruebas Chromium sobre el HTML exacto**; el bloqueo permanece, sin atribuir resultados visuales.

## Verificaciones funcionales NUEVAS: 4/4 PASS
Se extrajeron las funciones reales de `index.html` y se ejecutaron en JavaScript V8 con un DOM y localStorage sintéticos; no se modificó código operativo.

1. `edDeliveryOriginsMoveSelected`: mover un almacén seleccionado de Playa a Centro Habana borró latitud/longitud, incrementó versión de 2 a 3 y no modificó el otro almacén. **PASS**.
2. `edDeliveryOriginsMoveSelected`: un cambio de la instantánea durante la confirmación canceló el guardado y conservó el cambio concurrente simulado. **PASS**.
3. `edDeliveryDestinationsMoveSelected`: cambiar municipio de un destino seleccionado borró coordenadas, conservó dirección manual y dejó intacto el destino no seleccionado. **PASS**.
4. `edDeliveryDestinationsMoveSelected`: cambio de instantánea durante confirmación canceló el guardado y preservó el cambio concurrente simulado. **PASS**.

Estos casos verifican solo las rutas de código aisladas y **no prueban atomicidad entre pestañas**. No se repitieron los diez casos Geoapify, los seis de aislamiento ni los seis casos de fronteras de la fase anterior.

## Decisión
No se reprodujeron defectos que justifiquen modificar `index.html`. Quedan **PENDIENTES**: pruebas visuales reales Chromium móvil con HTML materializado, operaciones de interfaz extremo a extremo, persistencia compartida segura y atomicidad entre pestañas. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, servicios externos, instalaciones, despliegues ni costos.
