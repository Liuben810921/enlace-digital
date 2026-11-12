# G4 — preparación de validación integrada, solo GitHub
Fecha: 2026-11-11. Rama: `audit/f6b21-identity-idempotency-20261110`.

## Evidencia inspeccionada
- `supabase/functions/enlace-cliente-auth-staging/index.ts` (borrador no desplegado).
- `tests/edge_auth_mock_test.ts` (pruebas mock sin conexión).
- `docs/st00b-auditoria-definiciones-rpc-controlador-staging-2026-11-10.md`.
- `docs/st01-st12-plan-definitivo-ejecucion-controlada-2026-11-10.md`.
- `scripts/check_g4_integrated_contract_offline.py`: 20 aserciones de código; no sustituye pruebas de comportamiento.
- `.github/workflows/g4-integrated-contract-offline.yml`: Python estándar sin servicios externos, secretos ni PostgreSQL.

## Matriz de contrato / caso negativo pendiente
| Contrato | Evidencia de código | Prueba negativa integrada pendiente |
|---|---|---|
| Registro Cuba | `ed_cliente_registrar_residencia_privado`; dirección habitual requerida | Cuba sin provincia/municipio/calle => 400 y cero persistencia |
| Registro extranjero | residencia `extranjero` sin dirección obligatoria | extranjero sin dirección => registro válido; teléfono duplicado => 409 |
| Login | `ed_cliente_login_privado`; token aleatorio y hash SHA-256 | contraseña errónea => 401, sin sesión nueva |
| Sesión | `ed_cliente_sesion_privada` en rutas protegidas | token inválido, expirado y revocado => 401, cero cambios |
| Destinatarios | `cliente_numero` en SELECT/UPDATE, asignación del dueño en INSERT | cliente B edita ID de A => 404, A sin alteración |
| Direcciones de entrega | SELECT/UPDATE/deduplicación filtrados por `cliente_numero` | misma dirección para A/B no debe fusionar identidades |
| IDOR de perfil | SELECT filtrado por `data.numero` de sesión | token B nunca ve datos A, incluso si envía IDs de A |
| Roles y RLS | 8 tablas RLS; ACL anon/authenticated negadas en auditoría previa | prueba con roles no privilegiados, nunca certificar RLS con service_role |
| Entrada JSON | 4096 bytes, rechazo de claves duplicadas, UTF-8 estricto | 400/413 antes de RPC y sin efecto lateral |
| Rate limit | límite global y por teléfono | 429 sin RPC de login; verificar impacto de presupuesto compartido |

## Hallazgos y límites
1. El controlador usa `service_role` deliberadamente y aplica filtros de propiedad en el código; cualquier omisión sería un IDOR. La verificación estática no sustituye la prueba de aislamiento con dos identidades.
2. El wrapper `ed_cliente_registrar_residencia_privado` llama a una función base cuyo EXECUTE directo está retirado a `service_role`; la revisión ST-00B documentó esta encapsulación como deliberada. No conceder EXECUTE adicional preventivamente.
3. El controlador sigue sin desplegarse. El código no demuestra valores reales de banderas, CORS del gateway, aislamiento de efectos externos ni limpieza selectiva.
4. Las pruebas sintéticas de idempotencia F6-B23–B30 no equivalen a integración operativa. No marcar ST-06–08 como PASS en staging.
5. El workflow G4 sintético #3 se observó SUCCESS por captura; el nuevo comprobador offline requiere su propio CI, sin atribuirle PASS hasta verificarlo.

## Criterios para una autorización futura independiente
- G1–G7 documentados PASS; aislamiento de staging confirmado; cero correo, SMS, pagos, pedidos, webhook.
- Protocolo de dos identidades sintéticas y limpieza exacta, sin tocar clientes históricos.
- Identificadores ficticios no enrutables aceptados por validación; límite de operaciones y rollback aprobado.
- Si se necesita desplegar una Edge Function, **solicitar autorización distinta de despliegue**; no asumir que autorización de pruebas cubre despliegue.
- NO-GO para escritura/HTTP de staging, producción y servicios hasta permisos específicos.

**Resultado de esta fase:** preparación de contrato y CI offline en GitHub; ninguna operación de staging ni despliegue.
