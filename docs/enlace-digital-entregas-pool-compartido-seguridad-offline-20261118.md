# ENLACE DIGITAL — seguridad de pool compartido, 2026-11-18
Base `66c14f6b08dc2748d35d1213b38ef88c01d38930`; GitHub compare: identical.

## Hallazgo reproducible por inspección
`manual_approval_rpc.sql` contenía secuencias literales `\\n` dentro de comentarios SQL; por ello sentencias de `GRANT`, `REVOKE CREATE` y `ALTER FUNCTION ... OWNER TO` quedaban comentadas hasta el salto de línea físico siguiente. Esto impedía aplicar correctamente las restricciones de privilegios previstas. Se sustituyeron las secuencias por saltos reales y se corrigió `seed_disposable.sql`. Corrección por inspección del texto, NO verificada con PostgreSQL.

## Separación de modelos
- Logins individuales: el prototipo `session_user` solo puede identificar actores cuando cada uno dispone de autenticación PostgreSQL separada y controlada.
- Pool compartido: `session_user` es el servicio, nunca el administrador. El prototipo anterior **no es válido** para autorizar clientes con pool compartido.
- Se propone gateway que autentica servidor-side, intención de autorización de un solo uso almacenada por una ruta privilegiada independiente, vinculación de actor/acción/operación/contexto/importe/expiración, y consumo transaccional con nonce único. **No implementado**.

## Publicación
`shared_pool_boundary.md`, `shared_pool_adversarial.md`, `shared_pool_static.test.js`, SQL RPC corregido y seed corregido. Pruebas adversariales estáticas preparadas, no ejecutadas contra motor PostgreSQL. No se ha verificado sintaxis PL/pgSQL, permisos efectivos, RLS, aislamiento, concurrencia ni persistencia. Sin PostgreSQL local disponible.

## Bloqueantes concretos
1. Implementar gateway con identidad autenticada, roles vigentes y ruta de escritura privilegiada independiente del pool.
2. Implementar tabla de intenciones y consumo transaccional anti-replay, con identidad y contexto autoritativos.
3. Verificar propietario mínimo, ausencia de BYPASSRLS, EXECUTE restringido y que el pool no pueda SET ROLE al propietario.
4. Verificar en PostgreSQL desechable permisos, intentos de suplantación, dos conexiones y reinicios.
5. Integrar revalidación atómica de cesta, destino, almacenes y revocación en el punto de uso.
Hasta entonces, cestas mixtas especiales: `PENDIENTE`, sin autorización de cobro.

Sin GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, cartografía ni costos.
