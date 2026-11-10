# Plan offline de transacciones, concurrencia y reversión de pedidos — 2026-11-09

**NO EJECUTADO.** Basado en `2c0ef99c612b231b62e9d08bd41103ffa3ca1061`. Pseudocódigo inerte en `sql/propuestas/staging_pedidos_transacciones_concurrencia_no_ejecutar.sql`. No constituye una migración ni una función ejecutable. No se han realizado llamadas SQL ni cambios en Supabase.

## Diseño de funciones
- `ed_pedido_crear_privado`: autentica sesión oficial de cliente, deriva `cliente_numero` del servidor, valida destinatario/dirección propios, limita líneas y cantidades, reclama `(cliente_numero,idempotency_key)` con hash canónico del payload, bloquea productos por ID ascendente, relee precio/stock/colores, inserta pedido, snapshots, líneas y evento inicial en **una transacción**. Repetición idéntica devuelve mismo pedido; diferente payload rechaza con conflicto. No hay efectos externos antes del commit.
- `ed_pedido_transicionar_privado`: valida identidad y capacidad administrativa, bloquea pedido, comprueba `expected_version` y transición permitida, añade evento inmutable y actualiza estado proyectado. Supervisor solo lectura. Estados terminales sin transición inversa; cancelar con devolución de stock exige política y reserva previa demostrable.
- `ed_pedido_verificar_pago_privado`: permisos específicos, bitácora separada y versión de pago; no inferir pago por estado de entrega.

## Garantías y decisiones pendientes
- Stock propio: bloqueo determinista, comprobación global o por variante y decremento/reserva único. La estructura definitiva de cantidades por color requiere inspección y diseño detallado antes de implementar.
- Proveedor: `cantidad=0` no representa falta de stock ni disponibilidad ilimitada. Verificar `disponible`, variante y confirmación del proveedor antes de prometer entrega; nunca descontar stock ficticio.
- Precios: resolver `precio_usd` en base de datos y operar con `NUMERIC`; el navegador no fija importes. USD de productos y mensajería CUP independientes; congelar tasa cuando aplique.
- Idempotencia: clave única por cliente, huella del contenido, reintento tras timeout seguro; una transacción abortada no conserva reclamo. Evitar operaciones externas (cobros, emails) dentro de reintentos.
- Integridad: inmutabilidad de snapshots y eventos, `status_version`, privilegios mínimos, RLS y validación de actor por backend. La función SECURITY DEFINER necesitará `search_path` fijo y revisión de grants antes de cualquier uso.
- Reversión: un error aborta pedido, ítems, eventos y movimientos de stock en la misma transacción; secuencias pueden avanzar. Una vez confirmado un pedido, no eliminar historia: cancelar mediante evento y compensación auditada. Desactivar flag/revertir código no implica borrar datos.
- Bloqueos: esquema real de variantes, política de reservas/cancelaciones, matriz de permisos en servidor, API/Edge de pedidos y aprobación de reglas de proveedor aún no implementados.

## Matriz de pruebas de concurrencia futuras (no ejecutadas)
| Caso | Simulación controlada | Resultado exigido |
|---|---|---|
| C01 | Dos clientes compiten por última unidad propia | Uno crea pedido, otro OUT_OF_STOCK; stock nunca negativo |
| C02 | Dos solicitudes idénticas con misma clave | Un pedido, un descuento, mismo ID |
| C03 | Misma clave con distinto contenido | IDEMPOTENCY_CONFLICT, sin segundo pedido |
| C04 | Dos carritos con productos en orden inverso | Bloqueos ordenados, sin deadlock |
| C05 | Dos cambios de estado con igual versión | Uno aplica, otro VERSION_CONFLICT |
| C06 | Falla el segundo producto | Rollback total de datos/stock; secuencias pueden avanzar |
| C07 | Pedido de proveedor | Sin descuento ficticio; confirmación condicionada |
| C08 | Reintento tras cancelación | Devuelve pedido original, sin nueva reserva |
| C09 | Cliente ajeno o supervisor intentando mutación | FORBIDDEN |
| C10 | Timeout después del commit | Reintento retorna mismo ID y no duplica pedido |

## Protocolo futuro, condicionado a nueva autorización
1. Validar en modo lectura el esquema real de `productos`, `variantes_color`, clientes, roles y ACL.
2. Aprobar política de reserva, proveedor, pago y cancelación. Revisar propuesta SQL y su seguridad.
3. Crear fixture ficticia en staging aislado solo tras autorización específica; registrar stock inicial y snapshots de ACL.
4. Ejecutar escenarios con dos conexiones transaccionales controladas y barreras de sincronización, sin correos ni cobros.
5. Verificar aserciones, rollback, eventos, stock y ausencia de efectos en clientes existentes; registrar gaps de secuencia si aparecen.
6. No habilitar checkout ni producción. Reversión de código/flags por separado; datos históricos nunca borrados automáticamente.

**Resultado de esta etapa: diseño offline y criterios de prueba, NO-GO para ejecución o despliegue.**
