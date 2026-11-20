# ENLACE DIGITAL — autorización final de envío offline (2026-11-20)

Base `b768984dd6c6dfbdb9fb7305656ee3471a2ff009`; rama aislada `plan/havana-osrm-benchmark-offline-20261114`. Comparación inicial `identical`.

## Cambios
- `019_geoapify_final_send_gate.sql`: introduce `SEND_AUTHORIZED`, columna `send_authorized_at` y RPC `authorize_send_once`. Solo un CLAIMED con token correcto, contexto vigente y reserva DISPATCHED pasa a SEND_AUTHORIZED. Un replay no concede nueva autorización.
- `set_trusted_context`: revisiones estrictamente monotónicas para cambios; igual revisión + distinto digest es error. Igual revisión + mismo digest es idempotente. Cambio de contexto cuarentena READY/CLAIMED y marca UNKNOWN si ya existía SEND_AUTHORIZED.
- `finish_dispatch`: resultados terminales o UNKNOWN solo tras SEND_AUTHORIZED, o conciliación desde UNKNOWN; no admite cierre desde CLAIMED.
- `020_geoapify_final_send_gate_tests.sql`: rollback-only para confirmación prematura, autorización final única, UNKNOWN sin reenvío, conciliación, conflicto de revisión y contexto modificado tras claim.
- `run_concurrency.py`: ejecuta 019 y 020 después de 018, preservando las pruebas previas que ejercitan el contrato anterior.

## Comprobaciones ejecutadas
Archivos leídos directamente desde GitHub:
- 019 blob `0fbaa5a201753f5365cd247d7d7d29be8cc4a2d4`: 5/5 comprobaciones estructurales.
- 020 blob `89197082126ebab1b476ca64e422ebe8b447cbc4`: 5/5 comprobaciones estructurales.
- runner blob `fc2b61afe6fadd67e6e2e6e3ad04ad4ce9126756`: 3/3 comprobaciones de presencia y orden.
Total **13/13** verificaciones textuales superadas. **No se ejecutaron SQL, PostgreSQL, pruebas Node.js ni concurrencia real**.

## Límites críticos
1. `authorize_send_once` registra una autorización irreversible antes del transporte. El worker debe confirmar COMMIT y obtener autorización aplicada exactamente una vez; una respuesta de commit desconocido no permite reenvío automático.
2. No existe forma de mantener el bloqueo PostgreSQL durante una llamada HTTP externa sin consecuencias graves; el contexto puede cambiar después del commit y antes de enviar. En tal caso UNKNOWN evita reintentos, pero **no puede impedir físicamente que un worker ya autorizado envíe una petición obsoleta**. Se requiere una política de congelación del contexto o validación adicional del lado proveedor para cerrar completamente esa ventana.
3. Los advisory locks son cooperativos, y PostgreSQL exige orden consistente para evitar deadlocks. Documentación: https://www.postgresql.org/docs/current/explicit-locking.html
4. El SQL no ha sido validado con motor PostgreSQL. El aislamiento de roles y permisos sobre tablas sigue pendiente.
5. El gateway y el proveedor permanecen desconectados. No se activaron envíos, tarifas ni pedidos.

Sin instalar PostgreSQL ni usar Supabase, GitHub Actions, Geoapify, claves, staging, producción, despliegues, pedidos reales ni costos.
