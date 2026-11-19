# Prueba focalizada de fotografías y reintentos — 2026-11-19

Base verificada: `09578fbcb06b04206ddf67de722af6374016c511`. Corrección: `eb380eb8d9974b8a0e474ade27f975ac35b8a341`.

## Defecto reproducido
Se ejecutó el cuerpo real de `edQueueInventory()` con producto ficticio ID 11, una fotografía `data:image`, almacenamiento y API simulados. La API persistió el producto y luego lanzó timeout. Antes de la corrección: primer intento `false`, segundo `true`, **dos subidas** de la misma fotografía y el registro remoto ficticio referenciando la segunda URL.

## Corrección
Después de completar la subida y transformar la fila, se actualizan las URL de fotos y variantes en el producto en memoria **antes** del upsert remoto, para que un reintento de la sesión no vuelva a subir archivos ya confirmados.

## Prueba posterior (PASS)
Primer intento `false` por timeout posterior al commit; segundo intento `true`. **Una sola subida**; URL de foto idéntica en estado local y registro remoto ficticio.

## Límites y PENDIENTE
No se garantiza que una subida con timeout de confirmación desconocida no deje archivos huérfanos, ni persistencia de URL tras reiniciar navegador, ni transacción global entre fotos/productos/alias/asociaciones. La recuperación de cuarentena tras reinicio y concurrencia entre operaciones en distintos clientes requieren pruebas específicas adicionales. No se ejecutó navegador ni servicios externos.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos. Batería integral requiere autorización previa.
