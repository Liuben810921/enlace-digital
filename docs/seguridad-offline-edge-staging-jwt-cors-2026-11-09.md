# Cierre técnico offline: JWT, CORS y clave pública — ENLACE DIGITAL staging

## Cambios preparados, no desplegados
- CI base `0b2baf0cd971e974a3a25255c06d58bfead69c70`: run `42716342275` success.
- `supabase/functions/enlace-cliente-auth-staging/index.ts`: exige `ED_STAGING_PUBLISHABLE_KEY` con prefijo `sb_publishable_`, compara valor exacto con cabecera `apikey` antes de ejecutar RPC, rechaza orígenes de navegador diferentes de `https://liuben810921.github.io`, falla con 503 si no hay configuración y conserva gate `ED_STAGING_CUSTOMER_AUTH_ENABLED` false por defecto. CORS solo origen autorizado; `POST/OPTIONS`.
- `supabase/config.toml`: configuración **solo en PR**, `[functions.enlace-cliente-auth-staging] verify_jwt = false`, requerida para admitir registro/login sin JWT de usuario; la verificación de apikey se realiza dentro del controlador. **No es una autorización para aplicar configuración**.
- `tests/edge_auth_mock_test.ts`: casos adicionales de rechazo por clave inválida y origen ajeno; fixtures ajustados a nuevos controles.
- Protección antiabuso preexistente: RPC `ed_cliente_limite_privado` con limitador global 300/min, registro 3/h y 3/d por teléfono, login 20/15min y 10/15min por teléfono, escrituras de dirección 30/h. Identificador IP `unverified-proxy` compartido: evita confiar en headers falsificables, pero puede producir denegación colectiva; **riesgo residual pendiente de revisión de piloto**.
- No hay datos de clientes reales, correos ni pedidos activados por estos commits. Producción `main/index.html` no fue modificada.

## Reversión y permisos
- Captura de Supabase: usuario Owner de la organización Enlace Digital.
- Documentación oficial https://supabase.com/docs/guides/platform/access-control : Owner tiene acceso completo a recursos de organización/proyectos. Es evidencia de autorización administrativa por rol, **no prueba empírica de una operación de eliminación**.
- Staging no tiene funciones desplegadas; no es posible probar Delete sin crear antes una función. La conexión actual no expone una herramienta de eliminación. El operador Owner deberá usar la consola o CLI oficial para borrar exclusivamente `enlace-cliente-auth-staging` si se autoriza un despliegue posterior, y confirmar luego que desaparece de la lista. Documentar quién opera la reversión y qué hacer si el panel no permite Delete.

## Documentación de gateway
- https://supabase.com/docs/guides/functions/auth : modo publishable y `verify_jwt=false` para flujos sin JWT de usuario; un publishable key no acredita identidad de cliente.
- https://supabase.com/docs/guides/functions/auth-headers : apikey y Authorization son credenciales diferentes; no pasar clave pública como Bearer.
- https://supabase.com/docs/guides/functions/function-configuration : configuración por función en `supabase/config.toml`.

## Puertas pendientes
1. Confirmar CI de último commit de mocks y config.
2. Confirmar que `ED_STAGING_PUBLISHABLE_KEY` real se obtiene del proyecto **staging** y no de producción, sin revelar el valor en el chat. Su configuración requiere autorización separada.
3. Verificar política de acceso, configuración gateway y controles de rate limiting en entorno HTTP controlado, solo tras autorización de despliegue desactivado y reversión.
4. Si se habilita piloto, evaluar IP confiable y evitar bloqueo masivo por IP compartida.

**No se desplegó ni se escribió en Supabase.**
