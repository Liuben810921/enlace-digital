# Auditoría estática de contratos — staging (sin ejecución)

Verificado tras GitHub Actions #39 (run 42668461006, SUCCESS): pglast 7.22 analizó los SQL de RPC, esquema y pruebas; deno check y guards aprobaron.

## Bloqueos para una futura habilitación

1. La Edge Function de staging invoca `ed_cliente_limite_privado(p_clave,p_max,p_ventana_seg)` para rate limiting, pero ninguna de las cinco funciones del SQL v4 define esta RPC. **No habilitar ni desplegar** hasta reconciliarla con una definición y permisos comprobados. El código de la Edge Function responde 429 si la RPC falta: registro y login quedarían bloqueados.
2. La Edge Function utiliza el rol de servicio para operaciones directas sobre `clientes_destinatarios` y `clientes_direcciones_entrega`. Los filtros por `cliente_numero` están presentes en las rutas de actualización y consulta, pero se requiere prueba funcional de aislamiento antes de habilitar.
3. La función de registro base `ed_cliente_registrar_privado` permite crear una cuenta sin residencia; la envoltura `ed_cliente_registrar_residencia_privado` impone residencia y dirección cubana. Evaluar restringir la función base para evitar invocación directa desde otros consumidores con rol de servicio.
4. El SQL v4 utiliza `CREATE OR REPLACE FUNCTION`, `SECURITY DEFINER` y grants para `service_role`; verificar propietario, search_path y privilegios efectivos antes de aprobar cualquier migración.
5. El analizador PostgreSQL valida sintaxis SQL externa, **no** ejecución ni validación semántica de cuerpos PL/pgSQL, dependencias o datos históricos.

## Restricciones

Sin migraciones, sin despliegues, sin correos reales, sin escrituras en staging ni producción y sin fusión del PR. La batería SQL de rollback no se ha ejecutado.
