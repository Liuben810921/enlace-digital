# Plan de pruebas de integración Edge — ENLACE DIGITAL (solo propuesta)

Proyecto staging `xqahthghvozeigbojhyi`. **No desplegar, habilitar, ni ejecutar contra staging sin autorización separada.** La función `supabase/functions/enlace-cliente-auth-staging/index.ts` sigue siendo un borrador. Pedidos reales y correos desactivados.

## Auditoría estática y hallazgos

- Las rutas `register`, `login`, `session`, `logout`, `profile`, `address-save`, `recipient-save`, `delivery-location-save` están presentes. El token aleatorio se entrega solo al cliente; el servidor pasa a las RPC su SHA-256. El número del cliente se deriva de la sesión y no de campos del cuerpo. Los UPDATE de destinatarios/direcciones incluyen `cliente_numero`.
- Se detectó que confiar exclusivamente en `Content-Length` permitiría cuerpos grandes con cabecera ausente. Se añadió límite real de 4096 bytes durante lectura del flujo, cancelando al superarlo.
- El IP para rate limiting procede de cabeceras `cf-connecting-ip`/`x-forwarded-for`, cuya confiabilidad depende del proxy. Se añadió límite global de respaldo, pero **no sustituye** una política de proxy que sobrescriba las cabeceras de origen. Antes de habilitar, confirmar IP de origen confiable y política CORS.
- El rate limiting depende de la RPC `ed_cliente_limite_privado`; falla cerrado ante error. Su estado, latencia y comportamiento bajo concurrencia deben comprobarse en staging autorizado.

## Matriz de integración reproducible (pendiente de autorización)

1. Registrar dos cuentas ficticias independientes (Cuba y extranjero) con teléfonos ficticios y correos `example.invalid`; comprobar dirección obligatoria solo para Cuba, duplicados, contraseñas largas, formato E.164 y ausencia de envíos.
2. Iniciar sesión con contraseña válida e inválida; comprobar bloqueo tras intentos, rate limits IP/teléfono/global, token aleatorio y hash almacenado; comprobar que las respuestas no exponen contraseña ni hash.
3. Consultar perfil y sesión con token A/B, token inválido, caducado y revocado; cerrar sesión A y confirmar que B sigue activa.
4. Guardar destinatarios de A y B. Intentar desde token B editar ID de A: esperar 404 y ausencia de cambios. Verificar que el perfil B no enumera destinatarios ni direcciones de A.
5. Guardar dirección de entrega de A y B con misma dirección física; comprobar que el deduplicado queda aislado por cliente. Intentar reutilizar o modificar ID ajeno y comprobar aislamiento.
6. Validar límites de longitudes, caracteres, teléfonos cubanos, cuerpo JSON inválido, cuerpo de más de 4096 bytes **con y sin Content-Length**, métodos no POST, respuestas 400/401/404/405/409/413/429/503 y cabeceras CORS/cache.
7. Confirmar desactivación por defecto `ED_STAGING_CUSTOMER_AUTH_ENABLED` y rechazo cuando URL del proyecto no coincide. Probar sin correo real ni checkout.
8. Tras las pruebas, revisar registros, permisos y secuencias; limpiar datos ficticios solo mediante procedimiento autorizado y conservar evidencia.

## Requisitos previos a despliegue o escritura

CI verde, revisión de configuración de proxy/IP y CORS, decisión explícita sobre exposición de endpoint, autorización de despliegue y de datos ficticios, plan de limpieza y presupuesto gratuito. El ensayo SQL previo dejó secuencia de clientes en `last_value=2`; no reiniciar secuencias sin permiso. Las pruebas de integración no se han ejecutado.
