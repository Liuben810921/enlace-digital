# Variantes por color — plan de implementación

Estado: en desarrollo; NO fusionar con main hasta completar pruebas y aprobación.

## Contrato funcional
- Opcional para productos propios. Productos de proveedores y productos sin variantes conservan el comportamiento actual.
- Las tarjetas del catálogo no muestran selectores ni cambian su diseño.
- La ficha muestra selectores accesibles de color, con nombre y muestra visual. Al cambiar el color, la galería usa las fotos específicas (máximo cinco por variante).
- Existencias por variante, no visibles para clientes. No se puede pedir una variante sin existencias.
- Carrito, carrito flotante, checkout y pedidos identifican la variante elegida; dos colores del mismo producto son líneas separadas.
- Administración puede agregar, editar, retirar colores, ajustar existencias y fotografías; no eliminar referencias históricas de pedidos.

## Revisión del código actual
- `index.html` implementa `openProduct`, `addCart`, `canOrder`, `validateCart`, `renderFloatingCart`, `edFromRow` y `edToRow`.
- El carrito actual identifica líneas por `id` de producto; debe evolucionar a clave compuesta producto + variante.
- La tabla `public.productos` tiene `cantidad` e `imagenes` y actualmente no tiene columna de variantes.

## Secuencia segura
1. Conservar `main` sin cambios y documentar el estado de la base de datos y las políticas RLS.
2. Implementar y probar UI/lógica en esta rama con datos simulados, manteniendo compatibilidad con productos sin variantes.
3. Preparar migración aditiva de Supabase (preferiblemente columna JSONB `variantes_color` con esquema validado, o tabla normalizada si las necesidades transaccionales lo exigen). No aplicarla antes de tener código y rollback listos.
4. Verificar permisos, persistencia, fotos, stock, cantidades, carrito, checkout y pedidos. Las ventas simultáneas requieren reserva o decremento atómico de inventario antes de activar pedidos reales.
5. Respaldar los datos y aplicar migración compatible, verificar la API, probar la rama y solicitar aprobación para fusionar/publicar.

## Criterios de reversión
- Revertir GitHub al commit estable anterior.
- No eliminar columnas ni datos durante rollback; cualquier reversión de esquema debe preservar variantes y pedidos ya registrados.
