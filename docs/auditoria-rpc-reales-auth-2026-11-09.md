# Auditoría complementaria: RPC reales de producción (solo lectura)

Se consultaron definiciones y permisos de cinco funciones en producción sin ejecutarlas ni modificarlas.

## Contratos reales
- `public.ed_cliente_registrar_residencia_privado`: 9 argumentos, SECURITY DEFINER, `search_path=''`; valida residencia y dirección, llama a `public.ed_cliente_registrar_privado`, actualiza `clientes_oficiales` y devuelve JSON.
- `public.ed_cliente_login_privado`: teléfono, contraseña y hash de token; valida contraseña con `extensions.crypt` y bcrypt (`gen_salt('bf',10)` para ruta de teléfono inexistente), registra intentos, bloqueo de 15 min tras fallos, inserta hash de sesión con 30 días de caducidad.
- `public.ed_cliente_sesion_privada`: token hash y revocación; comprueba no revocada y no caducada; devuelve perfil o revoca.
- `public.ed_cliente_direccion_privada`: token hash y dirección; verifica sesión, residencia Cuba, límites y actualiza solo cliente autenticado.
- `public.ed_cliente_registrar_privado`: dependencia adicional, cuerpo no inspeccionado aún.

## Permisos observados
En producción, las cinco RPC consultadas: EXECUTE para `anon=false`, `authenticated=false`, `service_role=true`. Las cuatro primeras son SECURITY DEFINER con `search_path` vacío. Este modelo requiere revisión de `service_role` y de funciones dependientes antes de copiarse.

## Estado staging
Solo está `ed_cliente_limite_privado` de las RPC requeridas por la Edge Function; faltan las demás. **No se instalaron ni ejecutaron**.

## Riesgos y pasos pendientes
- Auditar el cuerpo de `ed_cliente_registrar_privado` y los grants/propietarios de cada función.
- Verificar el esquema exacto de producción para `clientes_direcciones_entrega`, incluidas las columnas de ruta; no aplicar la propuesta inicial sin resolver discrepancias.
- Diseñar una migración transaccional y reversible con controles de identidad, bcrypt, hashes de tokens, bloqueo de intentos, pertenencia y RLS.
- Mantener la Edge Function staging inactiva y no desplegada; realizar pruebas estáticas de TypeScript/Deno y revisión de seguridad antes de autorización de despliegue.
