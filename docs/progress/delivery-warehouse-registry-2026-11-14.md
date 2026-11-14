# Entregas — avance del 14-11-2026

## Implementación en rama aislada

- `tests/delivery-warehouse-registry-isolated.cjs`: registro sintético en memoria de proveedores y almacenes propios/de proveedores; altas, ediciones versionadas, activación/desactivación, asignación de varios orígenes por producto, aislamiento de snapshots y auditoría de cambios. No usa red, base de datos ni clientes.
- `tests/delivery-warehouse-registry-isolated.test.cjs`: pruebas de esos contratos, incluyendo las coordenadas **confirmadas por el propietario** del primer almacén real (23.13024, -82.36028), sin asignar nombre comercial real.
- `.github/workflows/isolated-delivery-quote.yml`: habilita ejecución de CI aislada en esta rama y añade la nueva prueba. El workflow solo usa Node y PostgreSQL desechable, sin endpoints productivos.

## Distinción fundamental

El almacén es real, pero el **registro del laboratorio es un fixture sintético en memoria**, no un alta en la base de datos. Su nombre de prueba es editable; el nombre definitivo será proporcionado por el propietario desde la futura interfaz. La dirección privada del propietario no se incorpora a GitHub.

## Limitaciones y próximos entregables

- No es aún un panel móvil funcional integrado: falta conectar la administración de la página a un backend persistente con autorización.
- La invalidación por cambio de almacén está representada por eventos de revisión; falta enlazarla a cotizaciones persistentes.
- No hay distancias viales reales ni proveedor de rutas conectado. No calcular precios con distancias inventadas.
- Falta comprobar ejecución de CI de este commit; no afirmar éxito sin run concluido.
- Supabase, staging, producción, pedidos y datos reales permanecen fuera de alcance.

**Siguiente paquete:** interfaz de edición y alta con nombres definidos por el usuario; pruebas de edición de ubicación, aislamiento de roles, cambio de origen y cotización invalidada. Después, selección del motor de rutas y validación de trayectos reales de La Habana con autorización específica.
