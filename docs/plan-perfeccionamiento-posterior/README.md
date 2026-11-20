# ENLACE DIGITAL — Plan de perfeccionamiento posterior

Fecha de decisión: 2026-11-20. Propósito: **lanzar primero una web funcional, segura y comprobada**, y continuar perfeccionándola después de su puesta en funcionamiento. Este plan es el registro central de ideas, mejoras no bloqueantes y operaciones administrativas complejas. No autoriza activación, despliegues ni gastos.

## Regla de priorización

**IMPRESCINDIBLE PARA LANZAMIENTO (P0):** sin ello no se puede completar de forma segura un flujo esencial de venta, inventario, registro, pago o entrega. Incluye las pruebas de aceptación de esos flujos y sus controles de seguridad.

**PERFECCIONAMIENTO POSTERIOR (P1/P2):** automatizaciones, operaciones masivas, comodidad administrativa, optimizaciones y casos excepcionales que tengan una alternativa manual segura. No retrasan el lanzamiento. No se eliminan funciones ya desarrolladas ni se consideran terminadas sin pruebas.

**BLOQUEADO / REQUIERE DECISIÓN:** capacidades que dependan de persistencia compartida segura, atomicidad entre pestañas, proveedores externos, costos o autorizaciones. Se documentan; no se improvisa una solución insegura.

## Mínimo funcional de Administración de entregas (P0)

- Registrar y editar proveedor con dirección y ubicación de salida; registrar almacén propio.
- Asociar cada producto con su proveedor o almacén de salida y permitir cambiar esa asociación individualmente.
- Capturar dirección de entrega y calcular distancia vial verificable en La Habana; definir tarifa de mensajería con reglas aprobadas, incluyendo mínimo y tarifas especiales.
- Evitar cotizaciones definitivas si la distancia vial no ha sido verificada.
- Validar en pruebas integradas aisladas el recorrido producto → salida → destinatario → distancia → tarifa, incluidos errores y recuperación.
- No activar pedidos reales, pagos ni servicios sin las autorizaciones correspondientes.

## Cartera de mejoras posteriores

| ID | Mejora | Prioridad | Condición |
| --- | --- | --- | --- |
| PP-001 | Transferencias masivas de almacenes entre proveedores | P2 | Ya hay implementación limitada a almacenes sin productos; conservar y perfeccionar solo si aporta valor |
| PP-002 | Reasignación masiva entre proveedores con productos asociados | Bloqueado | Requiere preservar invariantes y resolver persistencia compartida / atomicidad |
| PP-003 | Eliminaciones y activaciones/desactivaciones masivas de proveedores y almacenes | P2 | Existen implementaciones parciales; revisión de UX y casos extremos después del lanzamiento |
| PP-004 | Gestión automática de dependencias al eliminar un proveedor con almacenes y productos | Bloqueado | No borrar en cascada sin mecanismo transaccional y aprobación |
| PP-005 | Resolución de conflictos entre pestañas o dispositivos y persistencia compartida segura | Bloqueado | Requiere diseño transaccional; controles locales actuales no garantizan atomicidad |
| PP-006 | Herramientas avanzadas de selección múltiple y administración de grandes catálogos | P2 | Solo si volumen operativo lo justifica |
| PP-007 | Simplificar alta de proveedor + dirección de salida en un mismo flujo | P0 si evita bloquear uso; de lo contrario P1 | Comprobar primero flujo actual con uno o dos proveedores |
| PP-008 | Optimización futura de rutas, múltiples orígenes y automatización logística | P1/P2 | Después de comprobar cálculo básico y costo real de servicios |
| PP-009 | Mejoras de informes y productividad administrativa | P2 | Después del lanzamiento |

## Registro de nuevas ideas

Cada propuesta nueva se anota aquí o en un archivo específico bajo esta carpeta con: ID, problema operativo, valor, prioridad, dependencias, riesgos, estado, pruebas necesarias y decisión de inclusión. **No implementar una mejora P1/P2 antes de completar P0 salvo autorización expresa.**

## Estado y restricciones

La rama aislada contiene prototipos y pruebas focalizadas; eso **no equivale** a aceptación integral ni a funcionamiento listo para producción. La distancia vial y la cotización definitiva están pendientes de verificación. La persistencia compartida insegura y la atomicidad entre pestañas permanecen **PENDIENTES**.

No ejecutar GitHub Actions, Supabase, staging, producción, pedidos reales, descargas, despliegues, gastos ni batería integral sin autorización específica.
