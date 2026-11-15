# Auditoría adversarial estática: identidad RLS, roles, CAS e idempotencia

**Base:** `38eda68a22031f70c17f38e196e7e1dd0f01b4a0`  
**Rama aislada:** `plan/havana-osrm-benchmark-offline-20261114`  
**Estado:** exclusivamente offline, sin ejecución SQL ni operaciones empresariales.

## Archivos y trazabilidad exacta

| Archivo | Git blob GitHub = `git hash-object` local | SHA-256 local |
|---|---|---|
| `experiments/havana-osrm-portable/pg_security_negative_cases.json` | `f750d6ba23ecef71977cd28a961d826c42867330` | `6cd5cb035ce0cb855f6c65df41847b04c843134b21e79b89e415396622d741e2` |
| `experiments/havana-osrm-portable/test_pg_security_negative_static.py` | `baa590b7fabff3ea95b4eb03deccf1f4fb5db951` | `25a3a296bdf9da5a4f5bfb13bd1b19de3d77be5d7e7a3a92770eb766c30b1bdc` |

Ambos archivos se publicaron mediante el conector GitHub, se recuperaron posteriormente y se compararon con la reconstrucción local en `/mnt/data/ed_adversarial`. Se verificaron **dos de dos blobs**. Los SHA-256 se calcularon con `sha256sum` sobre los mismos bytes.

## Ejecución exacta observada

```sh
cd /mnt/data/ed_adversarial
python -m unittest -q test_pg_security_negative_static
python -O -m unittest -q test_pg_security_negative_static
git hash-object pg_security_negative_cases.json test_pg_security_negative_static.py
sha256sum pg_security_negative_cases.json test_pg_security_negative_static.py
```

Resultados: **Ran 27 tests ... OK** tanto en Python normal como en `-O`. Son 22 verificaciones de casos negativos y cinco comprobaciones generales del contrato. No se reprodujeron fallos en el validador ni en la matriz, por lo que no se modificó código operativo ni la especificación SQL original.

## Matriz de rechazo — 22 casos

| Área | Casos | Oráculos esperados |
|---|---:|---|
| Identidad y RLS | 5 | Rechazar GUC falsificada, identidad ausente/malformada y acceso cruzado de lectura/escritura |
| Roles y permisos | 4 | Bloquear despliegue con roles ausentes, BYPASSRLS, permisos PUBLIC o search_path inseguro |
| CAS de versiones | 6 | Rechazar las cuatro versiones obsoletas y desbordamiento; solo un escritor confirma |
| Idempotencia | 7 | Repetición única, conflicto de payload, resultado rechazado sin cotización, commit desconocido, 40001, 40P01 y caducidad de clave |

**Nota crucial:** los casos describen lo que un futuro sistema debe rechazar. Los 27 tests validan que el contrato JSON conserve esos oráculos. **No verifican que el borrador SQL implemente dichos rechazos**. En particular, el esquema actual sigue teniendo una identidad RLS no autenticada y un CAS no implementado.

## Defectos de diseño detectados por revisión del SQL existente

1. **RLS — suplantación posible si se conecta a clientes:** `current_setting('ed.tenant_id',true)` acepta un parámetro de sesión, no una identidad autenticada. Debe sustituirse por un contexto de identidad confiable y comprobarse que el rol de aplicación no puede falsificarlo.
2. **Roles — esquema no autónomo:** `ed_synth_app` aparece en `GRANT USAGE` pero su creación solo figura como comentario. No puede considerarse migración ejecutable; falta definición independiente y revisión de propiedad/privilegios.
3. **CAS — no implementado:** el `UPDATE ... RETURNING` aparece comentado, sin coordinación de escritores ni protección del commit de cotización.
4. **Idempotencia — unicidad insuficiente:** `PRIMARY KEY(tenant_id,operation_id)` no resuelve comparación de hashes, recuperación de commits desconocidos ni carreras. La FK obligatoria de `quote_id` entra en conflicto conceptual con el estado `rejected` sin cotización.
5. **RPC y RLS — no ensayadas:** no existen funciones ejecutables en este borrador; no se ha probado propietario técnico sin `BYPASSRLS`, `FORCE RLS` real ni `search_path` de funciones.

## Criterios de salida para una futura fase autorizada

Para cada caso negativo, exigir trazas de dos conexiones, identidad sintética, vector de versiones anterior/posterior, filas afectadas, SQLSTATE, rollback completo, resultado idempotente y ausencia de aprobación comercial. Ningún caso debe producir acceso cruzado ni duplicados. La ejecución real requerirá PostgreSQL efímero, roles sintéticos y autorización independiente.

**Restricciones respetadas:** sin PostgreSQL, GitHub Actions, OSRM, descargas cartográficas, costos, Supabase, staging, producción, clientes, pedidos, inventario, tienda o workflows.
