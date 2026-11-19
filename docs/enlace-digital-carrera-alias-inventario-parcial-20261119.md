# Concurrencia de alias y sincronización parcial — 2026-11-19

Base: `a545c90f29fd51e2dc95fbe72b93faab5844d802`. Corrección: `429b218a52fdb45bfe71b82418ecd98eac3bf8f3`.

## Defecto reproducido: alias diferentes en carrera
Dos llamadas reales a `edSaveSupplierAlias(5,...)` enviaron alias `Viejo` y `Nuevo`. Con API ficticia que retrasaba la primera escritura, antes de corregir: `start Viejo`, `start Nuevo`, `finish Nuevo`, `finish Viejo`; valor final **Viejo**, pese a ser una solicitud anterior.

## Corrección y pruebas (2/2 PASS)
Se agregó una cola de promesas por ID de producto en memoria de la sesión, con limpieza tras completar y recuperación de errores previos. Prueba A: las solicitudes Viejo y Nuevo se ejecutaron en ese orden; resultado final **Nuevo**. Prueba B: la primera solicitud falló por timeout y la segunda completó; resultado final **Nuevo**. Los rechazos siguen propagándose al llamador.

## Inventario con fallo parcial (PASS simulado)
Se ejecutó la función real `edQueueInventory()` con dos productos ficticios. La primera ejecución escribió ambos y simuló timeout posterior al commit del segundo; resultado `false`. El reintento terminó `true` con dos registros remotos ficticios, llamadas ID `1,2,1,2`. No se cambió esta función.

## Pendientes
Concurrencia entre sesiones/dispositivos, garantías de restricciones de unicidad y permisos en servidor, reintentos tras reinicio, estados inciertos de imágenes y asociaciones, recuperación integral y pruebas en navegador **PENDIENTE**. La cola de alias no constituye una transacción ni garantiza orden global. No se ejecutaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral reservada para autorización previa.
