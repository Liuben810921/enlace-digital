# Plan de pruebas controladas — ENLACE DIGITAL staging (NO EJECUTAR)

Proyecto exclusivo: `xqahthghvozeigbojhyi`. No utilizar producción. El esquema y cinco RPC están instalados; Edge Function no desplegada. No enviar correos ni activar pedidos reales.

## Preflight obligatorio (solo lectura)

1. Confirmar ID/nombre de proyecto y CI verde del commit exacto de esta propuesta.
2. Confirmar cinco RPC y privilegios efectivos: `anon` y `authenticated` sin EXECUTE, `service_role` únicamente en las cuatro externas, no en la auxiliar; propietario `postgres`, `SECURITY DEFINER`, `search_path` vacío.
3. Confirmar tablas y columnas, `pgcrypto`, secuencia, RLS y estado de clientes/credenciales/sesiones. Registrar recuentos antes y después. Detenerse si hay clientes o datos inesperados.
4. Confirmar exclusión de escritores concurrentes y ventana de mantenimiento; el ensayo debe usar una sola transacción administrativa.

## Fixture propuesto y cobertura

Archivo `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql`. Usa exclusivamente teléfonos ficticios +15550001001/+15550001002, correos `example.invalid`, nombres ficticios y hashes de tokens de prueba; no se envían mensajes. En una transacción `BEGIN; DO ...; ROLLBACK;` cubre registro cubano con dirección obligatoria, extranjero sin dirección, rechazo de cubano sin dirección, duplicados, contraseña no almacenada en claro y rechazo de contraseña de 73 bytes; login fallido y correcto, acceso a sesión por token, actualización de dirección cubana y rechazo para extranjero, asociaciones de destinatario y dirección de entrega, revocación/replay, caducidad y permisos efectivos de las cinco RPC.

## Riesgo importante de rollback

**PostgreSQL `nextval()` NO es transaccional.** Aunque `ROLLBACK` revierte las filas ficticias, los números de la secuencia `public.clientes_oficiales_numero_seq` consumidos permanecen consumidos. Esto es un efecto persistente real en staging. No afirmar que se revierten todos los efectos. No reiniciar ni manipular la secuencia mediante `setval` sin autorización independiente. La autorización para ejecutar el fixture debe aceptar expresamente este avance de numeración.

## Postflight y límites

Tras el rollback, consultar recuentos de clientes, credenciales, sesiones, destinatarios y direcciones y comprobar que no quedan datos de prueba; registrar el estado de la secuencia sin alterarla. Detenerse ante cualquier discrepancia. El fixture SQL comprueba relaciones por clave foránea, **no demuestra aislamiento de propietarios en la API**; las rutas `recipient-save`, `profile` y `delivery-location-save` necesitan pruebas de integración de Edge separadas, una vez autorizadas y desplegadas. Tampoco demuestra resistencia a ataques, rate limiting HTTP ni correos. Ninguna prueba se ejecuta con esta preparación.

## Autorización pendiente

Solicitar permiso nuevo y específico antes de ejecutar el fixture transaccional, incluyendo aceptación expresa del avance irreversible de la secuencia en staging. Excluir Edge, correos, pedidos reales y producción.

## Resultado del ensayo autorizado — 2026-11-09

**Autorización específica recibida:** ejecución únicamente del fixture `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql` del commit `f91600532ae0d409f084aa9f1724c3f094bb91f6`, blob `eb26ad8521fec675a7e09639f2289f8cff588e94`, en `xqahthghvozeigbojhyi`; se aceptó expresamente el avance no transaccional de la secuencia.

**Preflight:** proyecto staging correcto; cinco RPC presentes; cuatro externas con EXECUTE efectivo para `service_role`, auxiliar sin ese permiso; `anon` y `authenticated` sin EXECUTE en las cinco; cero filas en clientes, credenciales, sesiones, destinatarios y direcciones.

**Ejecución:** una única llamada `execute_sql` con el contenido íntegro del fixture `BEGIN; DO ...; ROLLBACK;`. Respuesta del proveedor: `[]`, sin errores SQL. No se devolvieron los `NOTICE` de las aserciones; la ausencia de excepción y el postflight respaldan la finalización sin error, pero no se dispone de traza individual de cada aserción.

**Postflight de solo lectura:** clientes 0; credenciales 0; sesiones 0; destinatarios 0; direcciones 0. Secuencia `public.clientes_oficiales_numero_seq`: `last_value=2`, `is_called=true`. La secuencia avanzó como se advirtió y **no se reinició ni modificó manualmente**. No quedaron filas ficticias.

**Límites:** no se ejecutaron pruebas de integración de Edge ni se verificó el aislamiento API real. Sin correos, despliegues, pedidos reales ni cambios en producción, productos, departamentos o administradores.
