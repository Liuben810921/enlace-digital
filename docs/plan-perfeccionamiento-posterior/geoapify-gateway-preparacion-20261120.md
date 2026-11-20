# Preparación de intermediario Geoapify — 2026-11-20

## Estado confirmado por el usuario

El usuario creó la cuenta y el proyecto **ENLACE DIGITAL - Rutas La Habana**; capturas muestran una clave API creada y plan **Free: $0/mes, 3000 créditos/día, hasta 5 solicitudes/segundo**. No se conoce ni se ha solicitado el valor de la clave.

## Trabajo en rama aislada

- `geoapify-gateway-policy.js`: planificador offline sin red, credenciales ni tarifas. Acepta exclusivamente `drive`, revisión segura, destinos/orígenes con IDs distintos, máximo ocho orígenes. Rechaza contadores de uso ausentes y aplica límites internos conservadores de 2400 créditos/día y 30 solicitudes/minuto. Su salida **siempre** tiene `status:'PENDIENTE'`.
- `geoapify-gateway-policy.test.js`: doce aserciones focalizadas reproducibles para presupuestos, modo, alcance, revisión y ausencia de tarifa. **Se han escrito en GitHub; no se afirma ejecución de estas pruebas.**
- No se modificó `index.html` ni se conectó ningún proveedor real.

## Advertencias de diseño

El planificador no constituye por sí mismo un limitador seguro: sus contadores `usage` son parámetros externos, sin atomicidad ni persistencia. El intermediario real deberá disponer de contadores compartidos y atómicos, autenticación y autorización de clientes, protección de abuso, límite de concurrencia, caché controlada por versión, validación estricta de coordenadas de La Habana, expiración y trazabilidad de respuestas. No confiar en headers Origin/Referer como única autenticación. No exponer API key en GitHub Pages ni permitir solicitudes arbitrarias sin control.

Antes de cualquier solicitud real, el usuario debe autorizar explícitamente el servicio/intermediario de destino y el uso de la clave mediante un canal seguro. Confirmar que el despliegue y consumo permanecen dentro de un plan gratuito. Mantener pedidos reales desactivados.

## Estado de autorización

No se ha autorizado acceder a Supabase, staging, producción ni realizar llamadas Geoapify. Se ha respetado esta restricción. El siguiente paso requiere elegir y autorizar infraestructura segura y después probar una ruta real ficticia de La Habana bajo presupuesto limitado. La persistencia compartida insegura y atomicidad entre pestañas siguen PENDIENTES.
