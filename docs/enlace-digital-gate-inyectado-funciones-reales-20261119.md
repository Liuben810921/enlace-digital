# Inyección focalizada de gate en funciones reales — 2026-11-19

Base 9f51ff0b7925fc3e44c68970cadbf3db11bc1aea; rama idéntica al inicio; index.html blob bc167baf595fa3085009b421a12eac08438d1b86.

## Resultados ejecutados
Se extrajeron literalmente los cuerpos de edQueueInventory y deleteProductForever desde index.html mediante el conector GitHub. En motor JavaScript aislado se inyectaron guardias dentro de las funciones por reemplazos con anclajes exactos y únicos, con verificación de unicidad (split(anchor).length===2). La compilación con new Function superó los errores de sintaxis de la fase anterior. API, almacenamiento y UI fueron simulados.

- edQueueInventory: la API ficticia se ejecutó una vez y durante ella otra pestaña ficticia cambió fees.delivery=99. La comprobación local falló; se marcó gate.pending=true. El segundo intento no llamó a la API: **1 llamada total, 1 alerta**.
- deleteProductForever: DELETE ficticio confirmado devolvió una fila; localStorage.setItem lanzó quota. Se marcó gate.pending=true. El segundo intento no llamó a la API: **1 llamada total, 1 alerta**.

Los resultados verifican el bloqueo **en los cuerpos transformados en el arnés**, no en index.html, que no fue modificado. La marca remoteConfirmed en cola se establece inmediatamente antes de invocar edApi; es conservadora y NO demuestra confirmación efectiva si edApi falla. Es necesario distinguir operaciones remotas confirmadas de resultados desconocidos.

## Pendientes
No se verificó todavía la reconciliación explícita que libera el gate sin repetir operaciones remotas. No se materializó un archivo Node reproducible con las funciones reales; la ejecución fue en motor JS aislado. No se ejecutaron en esta fase interferencias nuevas durante ambas migraciones ni edLoadInventory. Tampoco se ha probado bloqueo entre pestañas, persistencia del gate entre recargas, ni las ocho rutas con helper integrado. localStorage no ofrece CAS atómico y Web Locks nativo permanece PENDIENTE.

## Decisión
No modificar index.html. Antes de integrar: pruebas reproducibles de reconciliación contra instantáneas remotas ficticias, fallo remoto/resultado desconocido, conflictos concurrentes en cargas/migraciones, bloqueo entre pestañas y validación de los ocho escritores. No repetir las 11 ni las 9 pruebas Node ya superadas.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, costos ni batería integral.
