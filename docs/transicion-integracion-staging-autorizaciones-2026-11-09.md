# Transición de auditoría offline a integración staging — ENLACE DIGITAL PR #2

Fecha 2026-11-09. **No es autorización de despliegue ni ejecución de pruebas que escriban datos.**

## Estado comprobado en esta revisión

- GitHub Actions del cierre `438921a7c723c865e3872b5a6bc39ef1ca17d66f`: run `42711305619`, **success**.
- Supabase staging `xqahthghvozeigbojhyi`: proyecto ACTIVE_HEALTHY; listado de Edge Functions vacío.
- Catálogo SQL consultado en modo solo lectura: existen `ed_cliente_direccion_privada`, `ed_cliente_limite_privado`, `ed_cliente_login_privado`, `ed_cliente_registrar_privado`, `ed_cliente_registrar_residencia_privado`, `ed_cliente_sesion_privada`. Firmas coinciden con las esperadas del controlador; todas SECURITY DEFINER. `anon` y `authenticated` no tienen EXECUTE; `service_role` sí para las cinco RPC llamadas por Edge, y no para el helper `ed_cliente_registrar_privado`.
- `clientes_destinatarios` y `clientes_direcciones_entrega` existen, con RLS habilitado y sin permisos de tabla para `anon`/`authenticated`; las columnas de id son bigint y cliente_numero integer. No se realizaron operaciones de escritura ni se consultaron registros personales.
- La documentación anterior indicaba que las propuestas SQL no estaban aplicadas: **esa afirmación no debe interpretarse como ausencia de objetos en staging**. La inspección actual confirma objetos y firmas, pero no demuestra equivalencia completa del cuerpo de las funciones con la propuesta ni funcionamiento integral.

## JWT y compatibilidad web: decisión técnica pendiente

El controlador implementa tokens propios de sesión de 64 caracteres y valida cada operación mediante RPC privada. **No son JWT de Supabase Auth.** Un gateway Edge con `verify_jwt=true` puede rechazar llamadas de clientes que no presenten JWT admitido por el gateway, antes de llegar al controlador. El flujo de registro/login público requiere revisar la configuración concreta de invocación, clave pública del navegador, cabeceras, CORS y protección antiabuso; **no** se debe usar service_role/secret en navegador. Eliminar la comprobación JWT sin controles alternativos no queda autorizado por este documento.

Documentación de referencia: https://supabase.com/docs/guides/getting-started/api-keys y https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys

## Pruebas reproducibles, sin datos reales

1. **Preflight de lectura**: `sql/pruebas/staging_preflight_integracion_solo_lectura.sql` comprueba firmas, grants, RLS y columnas; ya se hicieron consultas equivalentes de solo lectura. Puede repetirse sin crear clientes ni sesiones.
2. **Integración transaccional (requiere autorización adicional de escritura en staging)**: usar exclusivamente datos ficticios, transacción con ROLLBACK, revisar `sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql` antes de ejecutarlo; comprobar que los efectos de funciones SECURITY DEFINER y límites no escapen al rollback. No ejecutar en producción.
3. **Interfaz y Edge (requieren autorización separada de despliegue)**: verificar compatibilidad JWT/CORS con navegador y roles sin exponer claves; comprobar registro Cuba/extranjero, login, sesión, cierre, destinatarios, direcciones y aislamiento de dos cuentas ficticias. Mantener pedidos y correos reales desactivados.

## Autorizaciones necesarias y orden

- **A. Integración SQL controlada en staging**: permiso explícito para operaciones de escritura con datos ficticios y rollback, tras revisión del script y del efecto de limitadores. No incluye despliegue Edge, secretos, roles ni producción.
- **B. Despliegue Edge posterior**: autorización independiente y verificación previa de permisos para **eliminar Edge Functions** (capacidad de reversión). Este requisito bloquea solo el despliegue, no A ni pruebas offline.
- **C. Configuración e invocación web**: autorización específica para cualquier cambio de secretos, JWT, CORS o configuración, y aceptación funcional antes de habilitar tráfico real. No se autoriza aquí.

## Resultado

La auditoría offline está cerrada. El siguiente paso acotado es **A**; evitar más ciclos de mocks sin hallazgo concreto. No se ejecutaron migraciones, despliegues, envíos de correo ni pedidos reales.
