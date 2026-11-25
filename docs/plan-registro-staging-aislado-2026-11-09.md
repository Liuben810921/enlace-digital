# Preparación aislada de registro y destinatarios — 2026-11-09

**NO DESPLEGAR / NO EJECUTAR SQL / NO FUSIONAR.**

## Contrato verificado en frontend `index.html` (main)
- `register`: `{name,phone,email,password,residence,address:{province,municipality,neighborhood,street}}`; respuesta usa `cliente.codigo`.
- `login`: `{phone,password}`; respuesta `{token,expires_in}`.
- `profile`: `{token}`; respuesta `{cliente,destinatarios,direcciones_entrega}`.
- `logout`: `{token}`.
- `address-save`: `{token,address}`.
- `recipient-save`: `{token,id,recipient:{name,phone,province,municipality,neighborhood,address,references}}`; respuesta `id`.
- `delivery-location-save`: `{token,location:{name,phone,province,municipality,neighborhood,address,references}}`; respuesta `id`.
- La interfaz administrativa espera tablas `clientes_oficiales`, `clientes_destinatarios`, `pedidos_oficiales`; la última NO está propuesta ni habilitada.

**Límite de revisión:** No existe código de `enlace-cliente-auth` en los archivos inspeccionados; staging no tiene Edge Functions desplegadas. Por tanto, el contrato de backend no está verificado y la migración NO está lista para ejecución.

## Archivos
- `staging-preview/index.html`: copia de la web con las 3 URL de Supabase dirigidas a staging. La clave publicable original se reemplaza por marcador no funcional. Se intercepta `window.fetch` para impedir toda llamada de red de JavaScript. Es una **vista de inspección**, no una app E2E operativa. No subir a GitHub Pages.
- `sql/propuestas/staging_registro_destinatarios_no_ejecutar.sql`: DDL propuesta que respeta las 6 tablas staging existentes, añade campos faltantes a `clientes_oficiales` y crea destinatarios y direcciones con FKs, RLS deny-by-default y sin grants de cliente. No crea pedidos ni Edge Functions.

## Preflight staging (lectura)
`clientes_oficiales` tiene `numero,codigo,nombre,auth_user_id,residencia,creado_en`; `cliente_credenciales` tiene teléfono y hash; `cliente_sesiones` tiene hash, caducidad y revocación. Staging reporta 0 Edge Functions. Ninguna de las tablas propuestas existe.

## Controles pendientes antes de aplicar
1. Obtener/revisar implementación real de Edge Function de producción mediante lectura autorizada, sin extraer secretos, y decidir implementación equivalente segura en staging.
2. Determinar quién valida la pertenencia de cada destinatario; ningún cliente debe acceder a datos ajenos. Sin políticas RLS de acceso cliente hasta validar identidad y rol.
3. Verificar compatibilidad de nombres y restricciones con el backend y el esquema existente. Revisar transacciones, unicidad de teléfonos, hashes, errores, rate limits, CORS y auditoría.
4. Definir migración y rollback de staging aprobados, backups y pruebas de no regresión.
5. Mantener envíos de correo y pedidos reales desactivados; no usar la web productiva para pruebas.

## Verificaciones estáticas de preparación
- Copia web sin referencias al identificador del proyecto productivo: comprobado antes de commit.
- 3 referencias a staging, clave publicable no configurada, `fetch` bloqueado por defecto.
- DDL contiene FKs, RLS y revocación explícita; **no ejecutada**.
- Producción, Supabase staging y main sin cambios.
