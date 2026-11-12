# Continuidad de auditoría de seguridad — 2026-11-12

Alcance: consultas de solo lectura a metadatos y definiciones SQL en Supabase staging. Ninguna fila de clientes, secretos, cambios de datos, despliegues o correos.

## Comprobaciones realizadas
- El asesor de seguridad identifica ocho tablas con RLS habilitado y cero políticas. Una consulta a pg_catalog confirmó que los roles anon y authenticated no tienen privilegios directos SELECT/INSERT en esas ocho tablas. Es una configuración de denegación directa, no evidencia por sí sola de exposición.
- Diez funciones privadas examinadas: anon y authenticated sin EXECUTE. Todas con search_path restringido a cadena vacía.
- La función antigua ed_cliente_registrar_privado no concede EXECUTE directo a service_role, pero la nueva ed_cliente_registrar_residencia_privado sí. La segunda es SECURITY DEFINER, propiedad de postgres y llama a la antigua. No modificar sin probar dependencia.
- Registro: nombre y apellido, teléfono E.164, contraseña 8–128 caracteres y máximo 72 bytes; residencia Cuba requiere provincia, municipio y dirección.
- Login: contraseña con crypt/bcrypt, bloqueo de 15 minutos tras 5 intentos, sesiones de 30 días; función de sesión soporta revocación.
- Tokens: verificación 24 horas, recuperación 20 minutos; cooldown de 10 minutos también tras consumir token; token de un solo uso; al recuperar contraseña se revocan sesiones.
- La emisión/consumo de tokens comprueba configuracion_correo.envios_habilitados=true y el propósito habilitado. No se leyó el contenido de esa tabla.

## Hallazgo que requiere corrección y prueba aislada
**Diferencia de validación de contraseña**: registro rechaza >72 bytes mediante octet_length; ed_consumir_token_correo_privado, en la ruta recuperar_clave, solo verifica length 8–128 caracteres. Con bcrypt/crypt, contraseñas UTF-8 largas pueden ser truncadas a 72 bytes y crear inconsistencias. Preparar prueba negativa y corrección en rama de trabajo aislada, sin alterar staging hasta autorización específica.

## Riesgos aún pendientes
- Inspección de grants EXECUTE de roles intermedios y de exposición de esquema a través de API/Edge.
- Pruebas sintéticas completas con GoTrue/Mailpit y PostgreSQL efímero.
- Verificación de controles de abuso y de permisos mínimos en flujos completos.
- Pruebas de destinatarios y aislamiento multi-cliente.
- Configuración hospedada de Auth y recuperación real por correo aplazadas hasta dominio/Brevo y autorización específica.

## Decisión operativa
No dar por concluida la seguridad solo por resultados de catálogo. Mantener producción y pedidos reales desactivados. No realizar cambios hospedados ni enviar correos.
