# Auditoría del backend original y alternativa staging — 2026-11-09

## Fuente verificada (solo lectura)
Supabase producción `ubrvuplslconfxwpfzxj`: Edge Function `enlace-cliente-auth`, versión **12**, `verify_jwt=false`. Se obtuvo su código mediante lectura autorizada del panel conectado, sin ejecución ni cambios. No se publican secretos; usa variables de entorno `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. La función de producción no estaba en el repositorio GitHub revisado. Staging `xqahthghvozeigbojhyi` tiene **0 Edge Functions**.

## Contratos reales encontrados
- `register`: valida nombre, teléfono E.164, contraseña 8–128, residencia `cuba|extranjero` y dirección cubana; llama `ed_cliente_registrar_residencia_privado`.
- `login`: aplica rate limits IP/teléfono, genera token aleatorio de 32 bytes y almacena SHA-256 del token mediante `ed_cliente_login_privado`; devuelve `token`, `expires_in:2592000` (30 días).
- `profile`/`session`/`logout`: valida hash del token mediante `ed_cliente_sesion_privada`; `logout` solicita revocación.
- `address-save`: autentica sesión y llama `ed_cliente_direccion_privada`.
- `recipient-save`: exige sesión, inserta o actualiza con `cliente_numero` derivado del token y, al editar, filtra `id` y propietario.
- `delivery-location-save`: exige sesión, limita frecuencia, busca coincidencia por cliente y dirección, reutiliza o inserta; también filtra propietario.
- `profile` lista destinatarios y direcciones limitados por `cliente_numero`.

## Riesgos y desajustes comprobados
1. La función original tiene `verify_jwt=false` y usa `service_role`; la autenticación/autorización depende por completo del token propio y las RPC privadas. Requiere auditoría rigurosa.
2. Staging: consulta de catálogo de funciones confirma **solo** `ed_cliente_limite_privado(p_clave text,p_max integer,p_ventana_seg integer)`; faltan las otras cuatro RPC de registro/login/sesión/dirección. **No es posible ejecutar E2E aún**.
3. La propuesta SQL inicial de direcciones omite `usado_en`, `distancia_km`, `punto_salida_id`, `ruta_version`, `calculado_en` que el backend consulta; la primera propuesta NO debe ejecutarse tal como está. Ver adenda de contrato.
4. La expresión regular de teléfono en `delivery-location-save` original presenta un escape duplicado; la adaptación corrige el patrón para teléfonos cubanos. No se ha verificado el comportamiento de la versión desplegada con pruebas reales.
5. La CORS original permite el origen de GitHub Pages productivo. La adaptación usa origen no resoluble `https://staging-preview.invalid`, lo que impide conectar la web hasta definir un origen autorizado.
6. El backend usa `service_role` con privilegios elevados. No debe filtrarse al frontend; exigir validación de propietario y pruebas de acceso cruzado.
7. Las direcciones reutilizadas se actualizan; el historial de pedidos necesita snapshots inmutables independientes.
8. El frontend de staging tiene `fetch` bloqueado y clave publicable de marcador; **no es una aplicación funcional**.

## Artefactos
- `supabase/functions/enlace-cliente-auth-staging/index.ts`: adaptación de la función v12 con guardas `ED_STAGING_CUSTOMER_AUTH_ENABLED===true` y hostname exacto de staging. **Inactiva por defecto**; no desplegada.
- `sql/propuestas/staging_contrato_backend_adenda_no_ejecutar.sql`: adenda documental de columnas y RPC pendientes, sin DDL ejecutable.
- `staging-preview/index.html`: copia visual aislada sin red.
- `sql/propuestas/staging_registro_destinatarios_no_ejecutar.sql`: propuesta anterior, **incompleta y bloqueada**.

## Verificaciones estáticas
- Backend fuente recuperado de producción v12 por lectura, no por conjetura.
- Backend staging con guardas de activación y proyecto exacto.
- Ausencia del identificador de producción en backend adaptado.
- Función no desplegada; no SQL de escritura ejecutado; ningún merge.
- **Pendiente**: comprobar con Deno/TypeScript en CI, reconciliar esquema y RPC de producción, diseñar políticas/contratos y ejecutar tests en staging tras nueva autorización.

## Recomendación
No desplegar ni aplicar SQL. Siguiente paso seguro: lectura de definiciones de las 4 RPC originales en producción (sin secretos) y esquema de direcciones; preparar versión transaccional de migraciones, revisarla estáticamente y someterla a autorización separada.
