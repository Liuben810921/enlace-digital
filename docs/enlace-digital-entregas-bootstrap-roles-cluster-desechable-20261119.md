# ENLACE DIGITAL — corrección del bootstrap de roles (2026-11-19)

Base: `0dd6dd1aa5565b2ec6353aac4a9dd91ae117d895`; comparación inicial de rama: identical.

## Defecto demostrado
El runner conectaba `LAB_POOL_URL` antes de ejecutar `atomic_disposable_roles.sql`, que creaba `ed_intent_test_pool`. Era imposible usar un clúster fresco y conectar con ese rol antes de crearlo. Además `CREATE ROLE` tiene efecto global en el clúster.

## Corrección publicada
- `atomic_disposable_roles.sql` **ya no crea logins**. Comprueba que `ed_intent_test_pool` y `ed_intent_test_gateway` existen con LOGIN, NOINHERIT, NOSUPERUSER y NOBYPASSRLS, y concede membresía a los roles funcionales creados durante la instalación del laboratorio.
- El operador debe preparar ambos logins **antes** de iniciar el runner, en un clúster local completamente desechable. El runner exige `LAB_DISPOSABLE_CLUSTER_ACK=YES_DISCARD_WHOLE_CLUSTER` y verifica que `session_user` del pool es `ed_intent_test_pool`.
- Se incorpora escalada de SIGTERM a SIGKILL tras 1,5 segundos en procesos activos; se evita propagar stderr de psql en errores de sesión y consultas.
- Los comandos SQL existentes siguen siendo sintéticos y están restringidos al laboratorio.

## Procedimiento futuro (NO ejecutado)
1. Crear un clúster PostgreSQL local **exclusivo**, nuevo y completamente descartable, sin datos reales ni conexiones externas. Preparar una base no estándar y los logins `ed_intent_test_pool` y `ed_intent_test_gateway` con atributos restrictivos.
2. Preparar credenciales locales separadas de administrador y pool, confirmar que no apuntan a ningún servidor compartido.
3. Configurar el reconocimiento explícito `LAB_DISPOSABLE_CLUSTER_ACK` y ejecutar cada escenario en un clúster nuevo. No subir credenciales ni ejecutar GitHub Actions.

## Evidencias verificadas
- Runner blob `cc563d83032ae2bcf01e04be1c9ebed08cf43f6f`, parseo V8 **PASS**.
- Roles SQL blob `0b963d3eb4d271afba62cc91f2b0fdea3856c79b`; no contiene sentencias `CREATE ROLE`.
- **0 ejecuciones PostgreSQL, 0 psql, 0 ejecución del runner como proceso**. La sintaxis SQL y el aislamiento real **no están verificados por motor**.
- El reconocimiento mediante variable es una salvaguarda administrativa, **no una prueba criptográfica** de que el clúster sea descartable.
- Persisten pruebas integradas pendientes y posibles problemas de cancelación ante fallos de procesos hijos. No se habilita uso comercial.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues ni costos.
