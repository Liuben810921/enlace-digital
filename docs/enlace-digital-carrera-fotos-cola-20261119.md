# Carrera de fotografías en cola de inventario — 2026-11-19

Base `8463b92d313a51c3e675ad35bf5babe494b254d6`; corrección `3afa948cc0d7030dd85ebc81c7bc416acdb7e8a0`.

## Defecto reproducido
Se ejecutó la función real `edQueueInventory()` con una subida de imagen detenida mediante promesa. Mientras esperaba, se cambió `state.products[0].photos` a una nueva fotografía. Antes de la corrección, al completarse la subida antigua, `state.products[0].photos` volvió a la URL antigua, perdiendo la nueva edición local.

## Corrección
La cola compara fotos y variantes actuales con las del snapshot que procesa. Solo reemplaza los valores en `state.products` cuando siguen iguales. El snapshot en curso conserva las URL confirmadas para su propio envío remoto; la siguiente ejecución recoge los cambios nuevos.

## Pruebas posteriores (2/2 PASS)
- Con edición concurrente: primer y segundo intentos `true`; dos subidas ficticias; envíos remotos sucesivos `url-1` y `url-2`; valor final local `url-2`.
- Sin edición concurrente: ambos intentos `true`; una sola subida; URL local y remota `url-1`.

## PENDIENTE
Concurrencia entre pestañas o dispositivos, atomicidad entre inventario, alias y almacenes, persistencia tras reinicio real, estados inciertos de servicios remotos y pruebas integrales. No se afirma haber verificado Supabase o navegador. Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
