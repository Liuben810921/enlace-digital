# ENLACE DIGITAL — comprobación de contexto confiable y despacho offline

Base: `7160403f79ec1ad6bc7f8bcccc28fc56432032ec`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial GitHub: `identical`.

## Cambio funcional
`edge-function-offline/gateway.mjs` ahora exige `resolveTrustedContext`, además de autenticación, reserva y autorización de despacho. El resolvedor debe entregar `verified:true`, revisión, modo, destino y orígenes obtenidos de una fuente confiable del servidor. Se valida el contexto confiable con las mismas restricciones geográficas y se compara el SHA-256 del contexto solicitado con el autorizado. Revisión, coordenadas o almacenes diferentes fallan con `CONTEXT_NOT_CURRENT` antes de reservar créditos. El gateway sigue fail-closed y no conecta proveedores.

`gateway.test.mjs` añade cinco casos adversariales (revisión, destino, origen, resolvedor ausente y contexto no verificado), pasando de 24 a 29 aserciones previstas.

## Evidencias verificadas y límites
- Los archivos originales se leyeron directamente desde GitHub, y se verificó que la rama coincidía con el commit base.
- El entorno tiene Node.js v22.16.0 y Git, pero `git ls-remote` a GitHub falló con `Could not resolve host: github.com`. No se pudo materializar mediante Git una copia local exacta de los archivos modificados.
- **No se ejecutó la batería de 29 pruebas en esta sesión**. No se afirma 29/29 PASS ni coincidencia de hashes de copias locales.
- No se instaló ni ejecutó PostgreSQL; tampoco se usó GitHub Actions, Supabase, Geoapify o servicios reales.

## Pendientes
- La consulta de contexto confiable debe ser consistente con la transacción de reserva/despacho. La comprobación en el gateway por sí sola no elimina una carrera si la revisión cambia después de la consulta.
- El adaptador SQL debe persistir y comparar una revisión confiable con bloqueo/versión transaccional; actualmente `p_context_revision` es un argumento que no se coteja independientemente con datos del servidor.
- Los recibos sintéticos no demuestran exclusión mutua entre procesos. El proveedor permanece desconectado y todo sigue `PENDIENTE`.
