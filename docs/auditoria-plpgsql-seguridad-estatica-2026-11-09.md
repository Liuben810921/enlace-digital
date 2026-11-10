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

## Actualización verificada — CI #76 y catálogo SELECT (2026-11-09)

**Corrección aplicada**: los dos IF de validación de p_token_hash incluyen ahora IS NULL OR y la prueba estática exige las condiciones completas. Commit 8d1a1dd; GitHub Actions #76, run 42681386540: completed/success. Los dos hallazgos NULL anteriores están **resueltos en el borrador**, no instalados en staging. Los puntos de bloqueo 1 anteriores se consideran completados; 2–4 siguen pendientes.

**Catálogo staging consultado exclusivamente mediante SELECT:**

- Tablas existentes enlace_auth.cliente_credenciales, enlace_auth.cliente_sesiones, enlace_auth.solicitudes_limite y public.clientes_oficiales: propietario postgres, RLS habilitado, sin privilegio SELECT directo para anon, authenticated ni service_role.
- Función instalada public.ed_cliente_limite_privado(text,integer,integer): propietario postgres, SECURITY DEFINER, search_path vacío; EXECUTE solo para service_role, no anon ni authenticated. Las cinco RPC propuestas aún no están instaladas.
- Índices únicos comprobados: enlace_auth.cliente_credenciales(telefono_e164), enlace_auth.cliente_credenciales(cliente_numero), enlace_auth.cliente_sesiones(token_hash), public.clientes_oficiales(numero) y public.clientes_oficiales(codigo). Esto mitiga carreras de teléfono en credenciales, pero las violaciones UNIQUE deben manejarse correctamente al registrar.
- No existen todavía las tablas propuestas public.clientes_destinatarios ni public.clientes_direcciones_entrega ni la secuencia public.clientes_oficiales_numero_seq.

**Riesgos pendientes:** secuencia nueva debe inicializarse con seguridad respecto de numeros existentes antes de cualquier migración; los privilegios reales de funciones y tablas nuevas no pueden validarse hasta su instalación autorizada; las consultas Edge con service_role requieren pruebas negativas de aislamiento (cliente A intentando actualizar ID de cliente B). RLS habilitado no basta para demostrar autorización si se utiliza service_role.

Estas consultas fueron de solo lectura. No se ejecutaron migraciones, RPC con efectos, ni escrituras.

## Secuencia e aislamiento — auditoría adicional

La propuesta actual crea public.clientes_oficiales_numero_seq con START WITH 1 y la RPC de registro consume nextval. **No existe en el borrador un paso seguro de sincronización con MAX(public.clientes_oficiales.numero)**. Incluso si el máximo observado en una lectura anterior era NULL, puede cambiar antes de una migración. Bloqueo de despliegue: durante una futura ventana autorizada, bloquear concurrentemente las altas, verificar MAX(numero) y estado de secuencia y preparar un ajuste atómico apropiado, con revisión de propiedad/permisos y sin perder números; nunca ejecutar esta operación durante la auditoría. Las secuencias no se revierten por ROLLBACK.

Se añadió scripts/check_staging_isolation.py, ejecutado por el workflow en GitHub Actions: comprueba estáticamente que el cliente se obtiene de la sesión, que las actualizaciones por ID incluyen cliente_numero, que las consultas de perfil filtran por cliente y que las tablas propuestas tienen FK y RLS. **Limitación**: las coincidencias de código no demuestran aislamiento en tiempo de ejecución; las pruebas negativas entre clientes siguen bloqueadas hasta autorización de un entorno de pruebas. El checker deja explícito el bloqueo de inicialización de secuencia, sin ejecutar ninguna SQL.
