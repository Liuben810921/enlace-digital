# Revisión del registro base, esquema de direcciones y comprobación estática — 2026-11-09

## Método
Solo lectura de catálogos PostgreSQL en producción, lectura de GitHub y comprobaciones de invariantes de texto de TypeScript y SQL. Sin SQL de escritura, despliegues ni merges.

## Registro base real
`public.ed_cliente_registrar_privado(p_nombre text,p_telefono text,p_password text,p_correo text DEFAULT NULL)` es `SECURITY DEFINER`, `search_path=''`. Valida nombre con apellido, teléfono E.164, contraseña de 8–128 caracteres, correo opcional y teléfono no duplicado. Obtiene `nextval('public.clientes_oficiales_numero_seq')`, inserta `clientes_oficiales` con estado `pendiente_activacion`, calcula hash de contraseña con `extensions.crypt(p_password,extensions.gen_salt('bf',12))`, inserta `enlace_auth.cliente_credenciales` y devuelve número/código. Los pasos de una llamada SQL se ejecutan en una misma transacción. No se ejecutó la función.

## Esquema real de producción
`clientes_destinatarios`: id bigint, cliente_numero integer FK `ON DELETE CASCADE`, nombre y teléfono obligatorios, provincia/municipio/barrio/direccion/referencias, fechas de creación/actualización. Nombre mínimo 2 caracteres. Teléfono al menos 8 caracteres (restricción DB; el backend valida formato Cuba).

`clientes_direcciones_entrega`: id bigint, cliente_numero integer FK `ON DELETE CASCADE`, provincia/municipio/barrio/direccion/referencias, nombre_receptor/telefono_receptor, latitud/longitud double precision, distancia_km numeric, punto_salida_id **text**, ruta_version **text**, calculado_en timestamptz, creado_en/usado_en timestamptz. Restricciones: latitud [-90,90], longitud [-180,180], distancia no negativa, dirección 8–500 caracteres.

`clientes_oficiales`: telefono,correo,estado,direccion_habitual,provincia,municipio,barrio,atencion_personalizada,actualizado_en,residencia y columnas de identidad.

## Borrador staging actualizado
`sql/propuestas/staging_registro_destinatarios_no_ejecutar.sql` ahora incluye coordenadas, distancia, tipos de ruta correctos, `usado_en`, RLS restrictiva, estado por defecto `pendiente_activacion` y FKs compatibles con producción. **Sigue incompleto y bloqueado**: faltan RPC privadas de registro, login, sesión y dirección; debe revisarse la semántica de `ON DELETE CASCADE` frente a retención histórica y faltan snapshots inmutables de pedidos. No ejecutar.

## Verificación estática TypeScript
Se recuperó `supabase/functions/enlace-cliente-auth-staging/index.ts` de la rama y se realizaron 11 comprobaciones de invariantes sobre el código y el SQL, **11/11 satisfactorias**: guardas de activación y proyecto, ausencia de ID productivo, ausencia de clave privilegiada literal, siete acciones esperadas, filtro de propiedad, regex de teléfono, columnas/tipos de rutas, RLS y aviso de no ejecución.

**Limitación importante:** estas son comprobaciones estáticas de contenido; NO se ejecutó `deno check`, `tsc`, pruebas unitarias ni integración. No atribuir aprobación de compilación TypeScript. No se ha comprobado CORS operativo, y la función staging permanece inactiva/no desplegada.

## Bloqueos concretos
1. Diseñar e implementar cuatro RPC privadas que faltan en staging, más su dependencia `ed_cliente_registrar_privado`, después de revisar extensiones y secuencia.
2. Reconciliar esquema final, permisos/grants, historial de pedidos y política de borrado de destinatarios antes de cualquier migración.
3. Ejecutar validación real de TypeScript/Deno en un runner autorizado sin secretos y con dependencias fijadas.
4. Definir un origen de pruebas autorizado y revisar CORS/clave publicable sin permitir tráfico a producción.
5. Obtener autorización separada antes de desplegar o ejecutar migraciones. No activar correos ni pedidos reales.
