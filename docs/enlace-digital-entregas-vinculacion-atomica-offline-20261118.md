# ENLACE DIGITAL — vinculación transaccional de intenciones (offline)
Fecha 2026-11-18. Base `0177875be6d7e1f35086e63613af18b08525fe23`; comparación inicial GitHub: identical.

## Archivos publicados y SHA confirmados por GitHub
- `shared_pool_atomic_lab.sql`: `907434be048db1bfaec107a6fb200dc4c7b0be52`
- `shared_pool_atomic_static.test.js`: `66dc37cb86b8a931d581658731685f0e46ec4de2`
- `shared_pool_atomic_adversarial.md`: `2e9712ef566c0d71b82212831a204928eb493a13`

## Contrato experimental
La función `apply_intent` toma bloqueo compartido de contexto, exclusivo de intención y exclusivo de aprobación; comprueba nonce, expiración, consumo previo, revisión, fingerprint y rol vigente, después inserta o revoca aprobación y marca intención consumida dentro de la misma transacción. Devuelve únicamente `LAB_APPLIED_ONLY`, que NO habilita cobros ni checkout. La función anterior `consume` pierde EXECUTE del pool para impedir consumir sin aplicar. La revocación exige mismo actor que intención.

## Defectos corregidos por inspección
- El prototipo previo permitía `consume` aislado, sin aprobación: se revocó el acceso de pool al instalar el nuevo laboratorio.
- La revocación por ID sin comprobar actor permitía afectar aprobaciones ajenas: ahora compara actor.
- Se añadieron guardas de contexto y rol, antes ausentes de `consume`.

## Bloqueantes
1. `authoritative_context` y `admin_roles` no tienen carga confiable ni sincronización real; el gateway debe verificar identidad, rol, cesta, destino, almacenes y reglas. No es autorización operativa.
2. No se ha ejecutado SQL. Sin PostgreSQL local, **ninguna prueba de sintaxis, permisos, concurrencia, RLS, durabilidad ni transacción** está verificada. El archivo Node tiene 24 aserciones textuales preparadas, no resultados.
3. Revocación concurrente frente a uso de aprobación en checkout exige comprobación final en una única transacción; no implementada.
4. El esquema experimental requiere DBA con roles y permisos mínimos; los roles NOLOGIN no representan usuarios autenticados ni se deben conectar al navegador.
5. Las 14 pruebas adversariales están descritas, no ejecutadas. Reintentos tras commit desconocido y carreras reales permanecen pendientes.

**Estado comercial:** PENDIENTE para tarifas especiales sin autorización comprobada; mensajería fuera de caja.

No se invocaron GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
