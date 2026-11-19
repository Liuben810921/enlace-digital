# Reintentos tras reinicio simulado: inventario y alias — 2026-11-19

Base `f281a1ad0540cbfb8dfb01e10acd24e08f648232`; rama sin commits posteriores al iniciar. No se cambió código operativo porque los casos ensayados no reprodujeron un defecto.

## Método y resultados (2/2 PASS)
Funciones reales extraídas de `index.html`, ejecutadas con almacenamiento y API ficticios. Se reconstruyeron las funciones y sus colas para simular un reinicio de sesión; no se reinició un navegador real.

1. **Inventario: confirmación remota seguida de timeout.** Primera llamada `edQueueInventory`: `false`, snapshot local `[]`, sin persistencia local final; el servidor ficticio ya tiene producto 7 modificado. Tras reconstruir la función y repetir la operación: `true`, snapshot con producto actualizado y estado remoto final `New`. La operación usa upsert idempotente para producto nuevo.
2. **Alias privado: confirmación remota seguida de timeout.** Primera llamada `edSaveSupplierAlias(7,'Alias nuevo')` rechazada después de escribir en mapa remoto ficticio. Tras reconstruir función y cola: segundo intento confirmado; alias final `Alias nuevo`, una fila en mapa remoto (upsert por `producto_id`).

## PENDIENTE
Asociaciones de almacenes en el mismo flujo de confirmación parcial, integridad cruzada entre los tres módulos, persistencia tras reinicio real, cambios simultáneos entre pestañas o dispositivos, permisos y RLS remotos y batería integral previa autorización. No extrapolar estos resultados simulados a Supabase ni a transacciones reales.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
