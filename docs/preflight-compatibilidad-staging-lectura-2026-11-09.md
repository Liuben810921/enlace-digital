# Preflight de compatibilidad staging — lectura únicamente — 2026-11-09

## Alcance y evidencias
Proyecto: `xqahthghvozeigbojhyi`. Rama: `audit/registro-staging-aislado-20261109`. PR #2: el endpoint de archivos del PR responde, pero la búsqueda de PR no devolvió entradas; **estado abierto/cerrado no confirmado**. No fusionar ni crear PR por inferencia.

- GitHub Actions #288 para commit `a702c258164fb10af68d81d9348d75ed19443c23`: completed/success.
- Controlador `supabase/functions/enlace-cliente-auth-staging/index.ts` revisado en lectura: consume `SUPABASE_PUBLISHABLE_KEYS.default`, exige apikey igual, origen exacto, host staging y `ED_STAGING_CUSTOMER_AUTH_ENABLED === "true"`.
- Consulta actual SELECT a `pg_proc` (sin ejecutar funciones): existen `ed_cliente_limite_privado`, `ed_cliente_registrar_privado`, `ed_cliente_registrar_residencia_privado`, `ed_cliente_login_privado`, `ed_cliente_sesion_privada` y `ed_cliente_direccion_privada`. Todas `SECURITY DEFINER`; `service_role` tiene EXECUTE en las cinco necesarias y no en la auxiliar de registro base.
- Consulta `list_tables`: `public.clientes_oficiales`, `public.clientes_destinatarios`, `public.clientes_direcciones_entrega` existen con RLS y recuento reportado de 0.
- La documentación histórica `docs/auditoria-contratos-rpc-staging-2026-11-09.md` contiene una fotografía anterior a la instalación de las cinco RPC; no describe el estado actual.
- Captura del Owner: dos nombres de custom secrets presentes; valores ocultos y no verificados por lectura.
- Listado anterior de Edge Functions vacío. Ninguna función desplegada durante esta revisión.

## Bloqueos pendientes antes de solicitar autorización de despliegue
1. Verificar por una vía autorizada los valores efectivos del interruptor y origen sin exponer secretos. Captura de nombres no prueba valores.
2. Verificar equivalencia de definiciones RPC reales con v4, privilegios efectivos, columnas y políticas RLS; existencia y firmas no bastan.
3. Ensayar aislamiento y reversión por vía autorizada, con aprobación independiente para cualquier prueba que escriba o despliegue.
4. Documentar mecanismo de eliminación de una futura Edge Function y el efecto de `verify_jwt=false`; CORS no es autenticación.
5. Mantener el interruptor en `false` y prohibir despliegue, activación, correos y pedidos reales sin nueva autorización.

## Resultado
Compatibilidad de **nombres, firmas y privilegios de ejecución del rol de servicio** comprobada por SELECT; pruebas offline de GitHub aprobadas. Integración funcional, valores efectivos de secrets y reversión operativa **no comprobadas**. Sin cambios en SQL, Edge, roles, claves ni producción.
