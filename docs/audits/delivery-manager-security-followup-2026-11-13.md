# Auditoría incremental del cotizador PostgreSQL — 13 noviembre 2026

**Ámbito:** exclusivamente rama aislada `audit/delivery-map-readonly-20261113`, PostgreSQL desechable, sin Supabase, staging ni producción.

## Hallazgo corregido
La huella `md5(p_cart||':'||p_customer||':'||p_revision::text)` no era inyectiva respecto de la tupla de entrada. Ejemplo: `('a:b','c',1)` y `('a','b:c',1)` se serializaban de forma idéntica. Se reemplazó por `md5(jsonb_build_array(p_cart,p_customer,p_revision)::text)` y se agregó una aserción de regresión. Sigue siendo un hash MD5 de laboratorio, **no un contrato de producción**.

## Revisión de límites
- Escrituras: los gestores no tienen UPDATE/DELETE en tablas versionadas; se añadieron aserciones de privilegios de tabla para los roles. El propietario técnico NOLOGIN/NOBYPASSRLS y FORCE RLS permanecen sin alteración.
- TOCTOU: las RPC usan advisory transaction locks compartidos/exclusivos en orden tarifa → almacén → cesta. La garantía presupone que **todos** los escritores de contexto usan estas RPC. Un escritor privilegiado externo que omita esos bloqueos puede romperla.
- Aislamiento: el protocolo se probó originalmente en sesiones de aislamiento predeterminado READ COMMITTED. No se declara seguro para snapshots REPEATABLE READ/SERIALIZABLE sin pruebas adicionales; en esos modos deben tratarse errores de serialización y reintentos completos.
- Idempotencia: la comparación de versiones impide reproducir una cotización antigua tras cambios de contexto. La clave sigue limitada a un prototipo sintético y el digest no incluye un payload comercial completo.
- RLS: las políticas dependen de `session_user` de cuentas PostgreSQL ficticias. No equivalen a identidad de usuarios en conexiones agrupadas de Supabase.
- Auditoría: mutaciones administrativas insertan evento en la misma transacción. No es un registro inmutable frente a un superusuario de la base desechable.
- Bloqueos: el orden es consistente entre las RPC existentes; quedan fuera de garantía escritores futuros que no sigan el mismo orden.

## Pruebas y evidencia
Se incorporaron aserciones adicionales en `tests/postgres-delivery-rpc-rls-lab.py` y corrección en `tests/postgres-delivery-rpc-rls-lab.sql`. El workflow `isolated-delivery-quote.yml` incluye ambos archivos en su filtro de push y ejecuta el laboratorio PostgreSQL.

**Estado de ejecución de este cambio:** pendiente de confirmación de un nuevo GitHub Actions run; no afirmar PASS hasta consultar la ejecución correspondiente. La ejecución anterior #43507242475 figura como exitosa en el informe histórico, pero no valida los commits nuevos.

**Dictamen:** corrección puntual realizada; NO-GO para staging/producción. No se desplegó, no se fusionó, no se consultaron datos reales.

## Segunda pasada — aislamiento y bypass de versiones
- **Hallazgo confirmado por inspección:** el protocolo advisory-lock + SELECT de versiones depende de `READ COMMITTED`. En `REPEATABLE READ` / `SERIALIZABLE`, una instantánea MVCC anterior puede sobrevivir a la espera del bloqueo; no debe declararse seguro sin diseño específico. Se añadió rechazo explícito `0A000` al inicio de `quote_preview`, `update_rate` y `mutate_context`.
- **Regresión añadida:** `tests/postgres-delivery-rpc-rls-lab.py` comprueba rechazo de las tres RPC bajo ambos niveles de aislamiento, y que el login administrador no puede actualizar directamente las tablas de cesta, ruta, almacenes y tarifas.
- **TOCTOU y locks:** las carreras anteriores verifican espera real en `pg_stat_activity` y liberación antes de continuar. Los bloqueos advisory **no** protegen frente a un superusuario u otro escritor privilegiado externo; queda explícitamente fuera del contrato.
- **Evidencia histórica:** ejecución GitHub Actions `43507242475`, job `132167978986`, estado `completed/success`, verificado por la API de GitHub. Esa ejecución **precede** a estos commits y no acredita las nuevas regresiones.
- **Evidencia nueva:** commits `06481087634e49b76aae67c4ac83643ed853c52c` y `ace322a1b08a7d8b76c5f3ba0d95510ccd54c892`. La ejecución PostgreSQL posterior sigue **pendiente de confirmación**. No se declara PASS.
- **Restricción:** ninguna modificación fuera de la rama aislada; ninguna conexión a Supabase/staging/producción, clientes o pedidos.
