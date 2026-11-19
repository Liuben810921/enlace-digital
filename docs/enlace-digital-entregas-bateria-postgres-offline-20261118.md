# ENLACE DIGITAL — batería PostgreSQL desechable: idempotencia y bloqueos
Fecha: 2026-11-18. Base `3ad4620258b460505dbff1e6a3fad7c56073bd57`, comparación inicial `identical`.

## Hallazgo corregido
En `apply_intent`, el patrón `SELECT ... FOR UPDATE` seguido de `INSERT` puede sufrir carrera cuando dos transacciones no ven fila previa para el mismo `(actor_id,operation_id)`. La restricción UNIQUE protege la integridad, pero sin tratamiento el segundo INSERT puede terminar en `unique_violation`. Se añadió `ON CONFLICT (actor_id,operation_id) DO NOTHING RETURNING id` y retorno `PENDIENTE` si no se insertó. Esto evita consumir la intención en la ruta de conflicto. La restricción de intenciones `UNIQUE(actor_id,operation_id,action)` ya bloquea dos intenciones `approve` con idéntica clave; por tanto, el caso es una defensa adicional, no una carrera demostrada para el flujo actual.

## Preparación y orden (solo base desechable)
1. DBA crea base local descartable y ejecuta `manual_approval.sql`, `shared_pool_intents.sql`, `shared_pool_atomic_lab.sql`, en ese orden.
2. DBA ejecuta `atomic_disposable_roles.sql`; las cuentas LOGIN carecen de contraseñas y requieren configuración de autenticación local por el DBA. El script no establece ni altera esa configuración.
3. DBA ejecuta `atomic_two_connections_setup.sql` y guarda `intent_id` y `nonce_hash` retornados. No reutilizar el fixture en otro escenario sin restaurar base.
4. En conexiones separadas, bajo identidad de pool de prueba y permisos `ed_intent_pool`, ejecutar `atomic_two_connections_A.sql` y, durante su pausa, `atomic_two_connections_B.sql`. Pasar los mismos valores de fixture como variables psql. El SQL usa `:intent_id` y `:'nonce_hash'` y requiere psql o sustitución manual segura.
5. Resultado **esperado, NO observado**: A `LAB_APPLIED_ONLY`, B `PENDIENTE`; una aprobación, intención consumida una vez. Repetir con A ROLLBACK: B puede completar, sin mutación parcial de A.
6. `atomic_two_distinct_intents.sql` intenta duplicar una clave de intención y **debe fallar por UNIQUE**. Ejecutar por separado con control explícito de errores; no combinar con una transacción de pruebas que espere éxito.
7. `atomic_privileges_adversarial.sql` inspecciona privilegios efectivos y contiene un UPDATE que **debe fallar** como pool. Separar comprobaciones positivas y negativas.
8. `atomic_two_connections_revocation.sql` documenta carreras de revocación y requiere fixture de aprobación/revocación adicional, todavía no automatizado.

## Verificación realizada
Mediante lectura de contenido exacto desde GitHub se confirmaron hashes de los archivos y seis invariantes de texto: guardia ON CONFLICT, retorno PENDIENTE, ausencia de `\\n` literal en SQL atómico, guardia de rol, unicidad de intención y existencia del archivo estático. Esto **no equivale a ejecutar** el test Node. `atomic_offline_contract.test.js` contiene 18 comprobaciones preparadas; no se materializaron copias locales ni se ejecutó Node. Sin motor PostgreSQL disponible, **cero pruebas SQL ejecutadas**.

## Bloqueantes
La batería no es aún totalmente automatizada: necesita aprovisionamiento local de login, fixture de revocación, control de dos sesiones y validación del comportamiento real. El gateway autenticado y la actualización autoritativa de contexto y roles siguen sin implementar. `LAB_APPLIED_ONLY` no es autorización operativa. Revocación frente a uso final de una cotización no está integrada. Estado de entregas especiales: `PENDIENTE`.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
