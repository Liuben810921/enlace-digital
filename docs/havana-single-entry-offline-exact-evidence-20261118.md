# ENLACE DIGITAL — entrada única offline, cuota y SQLite (2026-11-18)

Base: `a45e1baa99b1468bead82fa9bee4bf81e77505ca`; rama: `plan/havana-osrm-benchmark-offline-20261114`. GitHub compare antes de escribir: `identical`.

## Artefactos publicados y hashes verificados
Los tres archivos se recuperaron de GitHub mediante conector, se compararon contra copias locales mediante `git hash-object` y se ejecutaron después de obtener coincidencia exacta:
- `experiments/geoapify-offline/single-entry.mjs`: `3c924e1d1d4355505e389d2596490dade1a62cc8`
- `experiments/geoapify-offline/single-entry.test.mjs`: `daf3c13c29e255e9a764539393fbf05521eda3fd`
- `experiments/geoapify-offline/single-entry.race.test.mjs`: `5e9c4b1b07c2371a1faf9fe1a30163628c3b1c12`

Node v22.16.0, SQLite experimental; exit 0:
```
PASS 16 single-entry assertions
PASS 3 single-entry race assertions; 24 processes, 3 reserved, 21 quota
```

## Cobertura
- Dos etiquetas de versión (`legacy` y `NORM-v2`) comparten una cuota por día al llamar por `createSingleEntry`.
- Credencial temporal aleatoria en memoria, vinculada a identidad ficticia con prefijo `test-`; tras cerrar y reabrir se invalidan las sesiones previas.
- Principal ajeno con token válido no puede finalizar la operación de otro (CONFLICT); token inválido devuelve UNAUTHORIZED.
- Cambio de día con reloj inyectado: las reservas del día anterior permanecen imputadas al día original y no consumen el presupuesto nuevo.
- SQLite bloqueado con `BEGIN IMMEDIATE` desde otro proceso: devuelve PENDIENTE, no una reserva concedida.
- Archivo no SQLite: constructor falla cerrado, no se conceden reservas.
- 24 procesos Node independientes con operaciones sintéticas alternando versiones: 3 reservas y 21 rechazos por cuota; contadores correctos al reabrir.

## Defecto y corrección
Una expectativa inicial de prueba asumía erróneamente UNAUTHORIZED para un token válido de otro principal; el coordinador devuelve CONFLICT. Se corrigió la **prueba**, no el código. No se reprodujo defecto en el coordinador. El test publicado inicialmente difería de la copia local por comentarios; se eliminó esa diferencia en la copia local y se repitieron ambas baterías con hashes exactos.

## Límites de seguridad — NO-GO
**No existe todavía un punto de entrada obligatorio.** Este módulo es una fachada optativa: los archivos `idempotency-ledger.mjs`, `idempotency-norm-v2.mjs` y `unified-guarded.mjs` siguen siendo importables por código que tenga acceso al mismo entorno. Para impedir el bypass hace falta una frontera de ejecución confiable (aislamiento de proceso, privilegios mínimos y eliminación de importaciones directas) y auditoría de todos los llamadores. No se afirma lo contrario.

La credencial sintética no es autenticación real: `issueSyntheticPrincipal` es accesible a los llamadores y permite crear identidades `test-*`. Tampoco hay control de permisos del sistema de archivos ni unificación con tablas legacy existentes. El bloqueo y la corrupción fueron simulados en SQLite ficticio; no se probaron fallos físicos.

No se utilizaron GitHub Actions, cuentas, claves, servicios, despliegues, Supabase, staging, producción, clientes ni pedidos.

## Siguiente paso
Diseñar frontera de ejecución que impida llamadas directas, unificar políticas de identidad y medir casos de corrupción/recuperación adversariales sin desplegar ni conectar servicios.
