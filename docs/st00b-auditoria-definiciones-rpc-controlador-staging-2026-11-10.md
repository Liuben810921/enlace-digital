# ST-00B — auditoría autorizada de funciones, permisos y controlador (solo lectura)

Fecha: 2026-11-10. Base ST-00: `7276d795aef855e96f76e3b9d7d347b09c98363b`, CI #157. Supabase staging `xqahthghvozeigbojhyi`. Sin invocar RPC ni consultar filas de datos.

## Fuentes comprobadas
- Catálogo de PostgreSQL: `pg_get_functiondef` de diez funciones de `public` y `enlace_auth`; ACL, propietarios y `has_function_privilege` observados en ST-00.
- GitHub: `supabase/functions/enlace-cliente-auth-staging/index.ts`, `scripts/staging_customer_web_adapter.mjs`, `docs/conciliacion-rpc-controlador-staging-offline-2026-11-10.md`, `docs/configuracion-minima-staging-sin-clave-duplicada-2026-11-09.md`.
- Estado administrativo de staging en ST-00: ninguna Edge Function desplegada; ocho tablas con RLS habilitado y cero políticas.

## Conclusiones de la ruta de registro
1. El controlador **no** invoca `public.ed_cliente_registrar_privado` directamente. Su acción `register` invoca `public.ed_cliente_registrar_residencia_privado` con nueve parámetros, y el cuerpo SQL real de este wrapper llama internamente a `public.ed_cliente_registrar_privado`.
2. Ambas funciones están definidas `SECURITY DEFINER`, con propietario `postgres` y `SET search_path TO ''`; el wrapper tiene EXECUTE para `service_role` y la función base no. **El ACL asimétrico es coherente con el encapsulamiento deliberado**, porque la llamada interna se realiza bajo el contexto privilegiado del wrapper. No se justifica un GRANT adicional sin un fallo demostrado.
3. El wrapper exige residencia `cuba` o `extranjero`; para Cuba exige provincia, municipio y dirección; la función base exige nombre y apellido, teléfono E.164, contraseña de 8–128 caracteres y 72 bytes como máximo. La creación de cuenta y credenciales ocurre en la misma transacción SQL del wrapper; no se ejecutó para comprobarlo.
4. Los ocho procedimientos privilegiados están definidos con `search_path` vacío y referencias a esquemas explícitos; esto reduce riesgos de resolución de objetos, pero **no demuestra seguridad total** de funciones con privilegios elevados.
5. Las dos funciones de correo del esquema privado tienen controles de habilitación por configuración y cooldown de 10 minutos incluso si un token ya fue consumido. Las dos funciones públicas de correo son wrappers `SECURITY INVOKER`. **No se leyó la fila de configuración** ni se emitió/consumió token.

## Contrato de controlador y seguridad

| Control | Evidencia estática | Estado / riesgo |
|---|---|---|
| Aislamiento de proyecto | `expectedProject` fija la referencia staging; `validProject` exige hostname coincidente | PASS estático; no desplegado |
| Interruptor de servicio | `ED_STAGING_CUSTOMER_AUTH_ENABLED === 'true'` y requisitos de clave/origen | Fail-closed estático; **valor real no verificado** |
| CORS | `ED_STAGING_ALLOWED_ORIGIN` exige origen HTTPS exacto `https://liuben810921.github.io` | PASS estático; CORS no autentica |
| Clave de navegador | Lee `SUPABASE_PUBLISHABLE_KEYS.default`, comprueba prefijo y `apikey` | PASS estático; presencia real de clave no comprobada |
| Servicio privilegiado | `SUPABASE_SERVICE_ROLE_KEY` solo en entorno servidor, `createClient(url,key)` | Requiere despliegue y prueba controlada; nunca exponer clave al navegador |
| Sesiones de clientes | Token aleatorio de 32 bytes, hash SHA-256 en RPC de login/sesión, expiración 30 días, revocación en logout | Implementación SQL y controlador observadas; **no es JWT de Supabase Auth**; pruebas negativas pendientes |
| RLS y datos de clientes | RPC `SECURITY DEFINER` y `db.from(...)` bajo cliente `service_role`; filtros explícitos `cliente_numero` tras validar token | Privilegio elevado deliberado; riesgo de IDOR si faltan filtros. Requiere pruebas de aislamiento y revisión de todas las rutas |
| Rate limiting | `ip='unverified-proxy'`, hash compartido para todos los visitantes; límite global y por teléfono | **Riesgo operativo confirmado en código:** todos comparten cupos por IP hasta atribución de proxy confiable. No habilitar públicamente sin diseño y pruebas |
| Validación JSON | `JSON.parse` y tamaño máximo 4096 bytes, pero no se detectan claves duplicadas ni se impone contrato léxico ED-OP-v1 | **Brecha de integración** respecto a pruebas sintéticas F6-B24; no afirmar equivalencia de validadores |
| Destinatarios y direcciones | Validación de token de sesión antes de consultas `service_role`; filtros `cliente_numero` en lecturas/actualizaciones | Estructura defensiva; falta prueba concurrente y de acceso cruzado |
| Correo | No se observó invocación directa de las funciones de correo en controlador de cliente | Configuración real y otras rutas no verificadas |
| Pedidos y pagos | No hay rutas de pedido real en este controlador | No extrapolar a seguridad de checkout |
| Despliegue | Listado administrativo de Edge Functions vacío | **No desplegado; NO-GO para ensayos HTTP** |

## Requisitos de configuración (solo nombres, sin valores)
- `ED_STAGING_CUSTOMER_AUTH_ENABLED`: interruptor fail-closed, no activar en esta fase.
- `ED_STAGING_ALLOWED_ORIGIN`: origen HTTPS exacto de GitHub Pages, no habilitar sin validación.
- `SUPABASE_URL`: proyecto staging exacto.
- `SUPABASE_SERVICE_ROLE_KEY`: solo servidor; nunca navegador ni documentación.
- `SUPABASE_PUBLISHABLE_KEYS`: JSON inyectado por Supabase, entrada `default` válida.
- `verify_jwt=false` está contemplado para un registro anónimo con autenticación propia por clave pública + token de cliente; **no confundir con protección equivalente a JWT**. Configuración real del gateway no comprobada.
- Banderas de correo y pedidos: no se leyeron valores de secretos ni filas de configuración; **NO VERIFICADAS**.

## Prioridades y puertas de autorización
- **P0:** mantener Edge Function desactivada/no desplegada; no ejecutar HTTP ni RPC; confirmar banderas y aislamiento antes de cualquier prueba de escritura.
- **P1:** diseñar rate limiting con atribución de proxy confiable y fallback seguro, sin confiar en encabezados controlables por cliente; comprobar que los cupos no bloqueen colectivamente usuarios.
- **P1:** validar contractualmente que la función de registro interna solo es accesible por wrapper y que `service_role` no requiere grant directo; **no modificar ACL preventivamente**.
- **P1:** pruebas negativas de sesión, acceso cruzado, IDOR, concurrencia y revocación con cuentas ficticias, previa autorización de escritura.
- **P1:** reconciliar el parser JSON operativo con las restricciones de entrada realmente necesarias; el contrato sintético de idempotencia no está integrado en este controlador.
- **P2:** verificar configuración Auth/gateway y documentación actualizada sin revelar secretos; requiere acceso administrativo apropiado y autorizaciones de cambios separadas.

**Resultado:** AUDITORÍA ESTÁTICA COMPLETADA; **NO-GO para habilitar servicio público** hasta validaciones integradas. Ninguna escritura, RPC operativa, lectura de filas, migración, despliegue, activación de servicios o cambio de configuración se realizó.
