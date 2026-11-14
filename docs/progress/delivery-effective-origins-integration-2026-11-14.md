# Integración móvil: asociaciones y almacenes efectivos — 14-11-2026

## Evidencia previa
- [CI #43632385329](https://github.com/Liuben810921/enlace-digital/actions/runs/43632385329) **success** tras corregir la aserción heredada del filtro de proveedores.
- RLS, privilegios mínimos, aislamiento entre gestores y carreras transaccionales en PostgreSQL desechable pasaron en [CI #43632173224](https://github.com/Liuben810921/enlace-digital/actions/runs/43632173224).

## Cambios en la rama aislada
- `index.html`: evita la selección implícita del único almacén disponible, tanto en el selector del producto como al cambiar proveedor.
- La selección del proveedor asociado a un producto ahora omite proveedores desactivados al escoger la opción inicial.
- `edProductOriginsSave` rechaza asociaciones con IDs repetidos, almacenes inactivos, proveedores inactivos o IDs inexistentes, evitando persistir asociaciones obsoletas desde un formulario abierto.
- `tests/delivery-effective-origins-integration.test.cjs`: prueba sintética integrada de asociación, filtrado por proveedor y almacén activo, invalidación de snapshot de cotización tras asociación y cambios de estado, y ausencia de selección automática.
- Workflow `isolated-delivery-quote.yml` actualizado para ejecutar la regresión. [CI #43632645618](https://github.com/Liuben810921/enlace-digital/actions/runs/43632645618) debe verificarse antes de declarar esta ampliación aprobada.

## Alcance de seguridad
Las asociaciones y el contador de invalidación son **localStorage de demostración**, no un backend transaccional. Los tests no validan experiencia visual en un dispositivo móvil real. La selección de almacenes y tarifas reales deben validarse de nuevo del lado servidor antes de permitir pedidos. No se consultaron rutas reales ni se inventaron distancias. Ningún cambio en Supabase, staging, producción, clientes reales, pedidos, correos o servicios.
