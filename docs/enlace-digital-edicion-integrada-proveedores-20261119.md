# Edición integrada de proveedores — 2026-11-19

Base 55a126829ce78b6e194bcf739fcb66abdca6b85f; comparación identical; rama plan/havana-osrm-benchmark-offline-20261114.

## Operación
Commit 02e549f6e62a59b8ae707970420b3be1a115bbd5; index.html blob 34a31d094862c8b6d9041415bd3befe03b4bf3f5.

edDeliverySupplierEdit deja de usar prompt: el botón Editar abre un fieldset inline de nombre y captura el snapshot de proveedores. El botón Guardar nombre invoca la misma función, valida nombre obligatorio y unicidad, verifica snapshot y persiste solo la clave de proveedores. Cancelar cierra el editor y descarta el snapshot sin escribir. El formulario respeta el bloqueo de cuarentena.

## Verificación focalizada
Funciones reales con DOM y almacenamiento sintéticos:
- Abrir edición y guardar «Nuevo»: true, una escritura con el nombre nuevo.
- Intentar duplicar el nombre «Otro»: false, sin escritura.
- Modificar la clave almacenada entre apertura y guardado: false, sin escritura.
- Cancelar: true, sin escritura.
**4 comportamientos esperados**. Sintaxis del panel validada. No navegador ni batería integral.

## Límites
La comprobación de snapshot no proporciona atomicidad entre pestañas. Persistencia compartida insegura: PENDIENTE. Sin despliegue ni sistemas reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
