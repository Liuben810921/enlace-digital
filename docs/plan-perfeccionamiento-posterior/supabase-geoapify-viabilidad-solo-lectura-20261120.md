# Viabilidad Supabase para intermediario Geoapify — 2026-11-20

## Alcance y método

Autorización del propietario: **solo lectura** de configuración y límites; no secretos, clientes, pedidos, escrituras, despliegues, llamadas Geoapify ni costos. Se consultaron mediante conector Supabase las listas de proyectos, metadatos de proyecto y nombres/estados de Edge Functions; no se leyeron códigos de funciones ni valores de secretos ni bases de datos. Se consultaron documentos públicos oficiales de Supabase.

## Observaciones verificadas de la cuenta

| Proyecto | Ref | Región | Estado | Funciones visibles |
| --- | --- | --- | --- | --- |
| enlace-digital-db | ubrvuplslconfxwpfzxj | us-west-2 | ACTIVE_HEALTHY | 4 |
| enlace-digital-staging | xqahthghvozeigbojhyi | us-east-1 | INACTIVE | 0 |

Las cuatro funciones del proyecto activo son `enlace-correo-flujos` (verify_jwt=false), `enlace-correo-https-preparacion` (true), `enlace-cliente-auth` (false) y `enlace-correo-staging` (true). Estos flags son **metadatos**, no un diagnóstico de vulnerabilidad. No se inspeccionó código ni tráfico.

**No se verificó el plan de facturación de la organización ni su consumo actual**: no están expuestos en las lecturas disponibles. El proyecto staging está inactivo; **no reactivarlo sin permiso**. La existencia de dos proyectos no implica necesariamente que ambos consuman cuota activa.

## Límites públicos oficiales (consultados 2026-11-20)

- Plan Free $0/mes; máximo 2 proyectos activos, pausa por inactividad después de una semana.
- Edge Functions: 500.000 invocaciones incluidas en Free; 100 funciones por proyecto, 256 MB de memoria, 150 s de duración máxima de worker en Free, 2 s de CPU por solicitud, 150 s de timeout sin respuesta.
- Secretos de funciones: hasta 100 por proyecto; los nombres no pueden empezar con `SUPABASE_`. Se pueden definir en Dashboard o CLI y leer con `Deno.env.get`.
- En Free, exceder cuotas puede activar restricciones/gracia; no se puede garantizar disponibilidad ilimitada ni costo cero sin comprobar estado de facturación/consumo.

Referencias oficiales:
- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/manage-your-usage/edge-function-invocations
- https://supabase.com/docs/guides/functions/limits
- https://supabase.com/docs/guides/functions/secrets
- https://supabase.com/changelog.md

## Arquitectura propuesta — no implementada

`GitHub Pages (vista previa)` → `Edge Function dedicada geoapify-routing-staging` → `Geoapify Routing API`.

- Una función nueva y separada de las existentes; nunca reutilizar las funciones de correo/autenticación ni poner la clave en HTML o JavaScript del navegador.
- Guardar `ED_GEOAPIFY_API_KEY` exclusivamente como secreto de **un entorno autorizado**. No enviarlo por chat ni guardar en GitHub. Evitar exponer en respuestas/logs.
- Exigir identidad y autorización verificables en servidor; los headers `Origin`/`Referer` solo sirven como defensa adicional, no como autenticación. Limitar usuarios y destinos permitidos, geocercar La Habana y controlar abuso.
- Cuota compartida y atómica (no localStorage ni contadores en memoria), reserva por solicitud antes de invocar Geoapify, techo interno inferior a 3000 créditos/día, protección de ráfagas, sin reintentos automáticos indiscriminados. No permitir que el frontend defina arbitrariamente rutas, distancias o tarifas.
- Validar revisión de asociaciones de productos/almacenes/destinos, origen de datos y caducidad de rutas. Firmar o verificar procedencia de respuestas en backend; el frontend no puede marcar `verified` por sí mismo.
- Falla cerrada: cualquier error, dato desactualizado, cuota agotada, autenticación inválida o geocodificación dudosa → `PENDIENTE`, sin tarifa ni pedido.
- Probar primero con coordenadas ficticias pero geográficamente plausibles en La Habana; registrar solo distancia, tiempo, identificadores sintéticos, respuesta y créditos consumidos, sin datos personales.

## Procedimiento de activación futura (requiere autorizaciones nuevas)

1. Propietario comprueba en Dashboard **Organization → Billing/Usage** el plan Free, número de proyectos activos, invocaciones y consumo. Sin afirmar que el plan actual esté verificado.
2. Autorizar expresamente **reactivar staging** o seleccionar un entorno aislado alternativo; evaluar impacto de cuota de 2 proyectos y pausar otros únicamente con autorización.
3. Preparar código offline de Edge Function y tests adversariales, sin deploy ni clave. Revisar el mecanismo de identidad de la aplicación, que no necesariamente usa JWT nativo de Supabase.
4. Con aprobación específica, desplegar función **solo en entorno aislado**, con bandera deshabilitada por defecto, autenticación, cuota atómica, CORS restringido, registro sin secretos.
5. Propietario configura `ED_GEOAPIFY_API_KEY` directamente en el gestor de secretos del proyecto elegido. Nunca en conversación.
6. Autorizar **una sola consulta de prueba** con origen y destino ficticios en La Habana, revisar consumo Geoapify/Supabase y resultado; ampliar pruebas por lotes solo con aprobación.
7. Mantener `PENDIENTE` y pedidos reales desactivados hasta aprobación de seguridad, precisión y presupuesto.

## Conclusión

**Viabilidad técnica documental: favorable. Viabilidad específica de cuenta/costo: PENDIENTE**, porque staging está inactivo y no se ha verificado facturación/uso de la organización. No se realizaron cambios en Supabase ni llamadas externas a Geoapify. Persistencia compartida insegura y atomicidad entre pestañas permanecen PENDIENTES.
