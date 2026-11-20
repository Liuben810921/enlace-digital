# Evidencias — intermediario Geoapify offline (2026-11-20)

Base: `9366527fe600ba4ac79bd4c10b4d93a824e85a5f`; comparación con rama aislada: `identical` antes de editar. No se accedió a Supabase, Geoapify, GitHub Actions ni staging/producción.

## Implementación
- `experiments/havana-delivery-quote/geoapify-edge-core.cjs`: política offline de autenticación mediante adaptador confiable, comprobación de rol de prueba, validación de coordenadas en una **caja geográfica aproximada** de La Habana, revisión, IDs únicos, modo `drive`, reserva atómica exigida mediante interfaz `reserveAtomic`, salida siempre PENDIENTE. Sin llamadas de red ni tarifas.
- `geoapify-edge-core.test.cjs`: doce pruebas focalizadas ejecutadas localmente con Node.js v22.16.0, resultado **12/12 PASS**. Incluyen sin adaptadores, no autenticado, rol incorrecto, destino fuera de caja, NaN, orígenes duplicados, modo inválido, revisión inválida, reserva rechazada, excepción, éxito simulado que sigue PENDIENTE y precedencia de autenticación.
- `edge-function-offline/index.ts`: entrada Supabase Edge Function **deshabilitada por defecto**, sin imports ni secretos; POST devuelve 503/PENDIENTE, otros métodos 405/PENDIENTE. No se desplegó ni se ejecutó en Deno.

## Límites de seguridad y pendientes obligatorios

**No es una integración productiva ni un intermediario seguro completo.** La interfaz `authenticate` es un contrato, no un validador real de tokens; `reserveAtomic` es un contrato, no una transacción implementada. El archivo CJS es un núcleo de pruebas Node.js y no está enlazado a `index.ts` (Deno). No se ha comprobado el runtime Deno.

Antes de conectar Geoapify se requiere: autenticar en servidor con credenciales verificadas (no confiar en rol/ID suministrados por cliente), autorización de usuarios de prueba, presupuesto transaccional persistente con reservas idempotentes y límites por tiempo, geocerca administrativa exacta (la caja actual es solo un filtro grueso), origen de almacenes desde registros confiables, validación de respuestas Geoapify, revisión/expiración de rutas, no exposición de secretos, política CORS y auditoría. También pruebas de carreras reales en PostgreSQL desechable, integración Deno y navegador. No habilitar cotización real ni pedidos hasta completar estas garantías.

## Evidencia local

Comando: `node /mnt/data/geoapify-edge-offline/core.test.js` en Node.js v22.16.0. Salida observada: 12 líneas PASS y `12 / 12 PASS`. La versión fuente y casos se copiaron a GitHub con nombres `geoapify-edge-core.cjs` y `geoapify-edge-core.test.cjs`; no se afirma haber ejecutado directamente los archivos del repositorio en un checkout local.

No llamadas Geoapify, claves, GitHub Actions, Supabase, staging, producción, pedidos reales, despliegues ni costos.
