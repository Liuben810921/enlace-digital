# Auditoría estática PL/pgSQL — PR #2 (2026-11-09)

Estado: propuesta NO EJECUTADA. GitHub Actions #68 aprobó análisis exterior SQL y contratos estáticos, no compilación de cuerpos PL/pgSQL.

## Cinco RPC revisadas

- ed_cliente_registrar_privado: inserta cliente y credencial con hash bcrypt; depende de secuencia, columnas añadidas y extensión pgcrypto. Comprobación de duplicado antes de INSERT no evita carreras por sí sola: verificar índice UNIQUE de teléfono en staging antes de aplicar.
- ed_cliente_registrar_residencia_privado: exige provincia, municipio y dirección a residentes en Cuba; extranjeros no requieren dirección cubana. Llama a registro base y actualiza únicamente el número devuelto.
- ed_cliente_login_privado: compara bcrypt, bloquea tras cinco fallos y crea sesión. **Defecto confirmado en propuesta**: condición IF p_token_hash !~ regex no rechaza explícitamente NULL; requiere IS NULL OR. La Edge Function genera hash no nulo, pero la RPC privilegiada debe validar independientemente.
- ed_cliente_sesion_privada: consulta sesión no caducada y no revocada; revocación opcional. **Mismo defecto NULL** en validación de token. Debe corregirse antes de migrar.
- ed_cliente_direccion_privada: deriva cliente de token de sesión y restringe actualización a residencia Cuba y número de cliente autenticado.

## Permisos y aislamiento

Las cinco RPC declaran SECURITY DEFINER SET search_path TO '' y emplean referencias de tablas y funciones de aplicación calificadas por esquema. El SQL revoca EXECUTE a PUBLIC, anon y authenticated y lo concede a service_role. Estos permisos propuestos no equivalen a permisos instalados; se deben contrastar mediante catálogo SELECT antes de aplicar. Verificar además propietarios, privilegios de secuencia y funciones dependientes.

La Edge Function usa el cliente service_role, por lo que **RLS no sustituye la autorización por cliente**. Las consultas y modificaciones de destinatarios/direcciones observadas filtran por cliente_numero derivado de ed_cliente_sesion_privada, y las inserciones fijan ese número del lado servidor. Aun así faltan pruebas negativas de integración (ID ajeno, token revocado, caducidad, acceso cruzado) y verificación de privilegios de tablas y secuencias.

## Bloqueos previos a aprobación

1. Corregir ambos IF con IS NULL OR y comprobar integridad del archivo tras guardar; nunca modificar un borrador que duplique funciones.
2. Añadir validación real de PL/pgSQL en entorno aislado autorizado; pglast solo analiza SQL exterior.
3. Comprobar índices UNIQUE, columnas, extensiones, propietario y GRANT/REVOKE por consultas SELECT.
4. Ejecutar pruebas negativas únicamente tras autorización expresa, sin correos ni pedidos reales.

No se han ejecutado migraciones, funciones SQL con efectos, despliegues ni escrituras en Supabase.
