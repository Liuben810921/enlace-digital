# Duplicación de destinos de referencia — 2026-11-19

Base bdb7f5a0891f65e402f578e61c3befe77d8de84d; comparación inicial identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Función operativa
Commit 4f7d93096aa8dd8e241d14c02f734c16ea965341; index.html blob 27232574df135da9b3a597744f925c283aa70c6c.

Se añadió edDeliveryDestinationDuplicate(id) y botón Duplicar a cada destino de referencia. El botón prepara un borrador nuevo mediante edDeliveryDestinationCancelEdit, rellena nombre con sufijo «(copia)», municipio, dirección y coordenadas, vacía explícitamente el ID y enfoca el formulario. El registro original permanece intacto; el usuario puede revisar el borrador y guardarlo mediante el flujo existente de creación. Bloqueado durante cuarentena.

## Verificación focalizada
Función real ejecutada con DOM y dependencias sintéticas:
1. Destino existente: true, ID vacío, nombre «Hospital (copia)», municipio Plaza, latitud conservada y foco en nombre.
2. Cuarentena activa: false, sin rellenar borrador.
3. ID inexistente: false, sin rellenar borrador.
**3/3 escenarios esperados**. Sintaxis validada. No se ejecutó navegador ni batería integral.

## Límites
No se ejecutó el guardado de destino duplicado en navegador. Persistencia compartida insegura y atomicidad entre pestañas: PENDIENTE, investigación cerrada. Sin despliegue ni acceso a datos reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
