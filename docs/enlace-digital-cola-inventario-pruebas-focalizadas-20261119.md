# Pruebas focalizadas de cola real de inventario — 2026-11-19

Base fcc21c5e32ff7ca7a24e78b30d03523c1a182833; rama aislada plan/havana-osrm-benchmark-offline-20261114. Comparación inicial identical; no commits posteriores.

## Método
Se extrajo la función real edQueueInventory de index.html y se ejecutó mediante JavaScript con edApi, edToken, edUploadPhoto, localStorage y estado simulados. Sin conexión a servicios ni navegador.

## Resultados
1. Guardado correcto: contador 1 -> 0, una llamada API, snapshot actualizado al producto guardado.
2. Error remoto simulado: contador 1 -> 0, snapshot anterior preservado; el estado local cambiado permanece diferente, por lo que la transferencia queda bloqueada por la validación ya implementada.
3. Normalización de foto: una subida ficticia, URL resultante reflejada tanto en snapshot como en state.products; contador 1 -> 0.
4. Edición posterior al encolado: snapshot refleja lote capturado (name=new), estado actual conserva edición posterior (name=later), por lo que una transferencia se bloquea hasta sincronizar; contador 1 -> 0.
5. Dos guardados encolados: contador 2 -> 0, dos llamadas API, snapshot final refleja segundo lote.

Los cinco escenarios devolvieron los resultados esperados. No se reprodujo un defecto nuevo; no se modificó index.html.

## Alcance y pendientes
El error remoto se simuló en una única operación API; falta una prueba con varias filas y fallo después de una escritura remota ficticia para cubrir explícitamente fallo parcial. No se ejecutó la función de transferencia en este ciclo: su bloqueo mediante contador se verificó en la etapa anterior. No se ejecutó navegador ni batería integral. Los escenarios no prueban atomicidad remota, persistencia real ni concurrencia entre pestañas.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
