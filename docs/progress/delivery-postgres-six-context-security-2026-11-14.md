# Endurecimiento del laboratorio PostgreSQL — 14 noviembre 2026

## Verificación previa
GitHub Actions [#43631982899](https://github.com/Liuben810921/enlace-digital/actions/runs/43631982899): **success**. Pruebas transaccionales de seis dimensiones aprobadas.

## Nuevo alcance
- `tests/postgres-delivery-six-context-security-lab.sql`: roles sintéticos de dos gestores sin BYPASSRLS, propietario técnico NOLOGIN sin BYPASSRLS, RLS con FORCE ROW LEVEL SECURITY para tabla separada de cotizaciones de gestor, permisos SELECT/INSERT/UPDATE limitados y denegación de auditoría y mutaciones directas de contexto.
- `tests/postgres-delivery-six-context-security-lab.py`: aislamiento de lecturas y escritura por gestor, rechazo de privilegios indebidos, rollback de modificación y cotización, carrera real de actualización optimista con un único ganador, reintento y rechazo de cotización obsoleta.
- Workflow aislado ejecuta SQL y Python tras la batería de carreras de PostgreSQL. [CI #43632173224](https://github.com/Liuben810921/enlace-digital/actions/runs/43632173224) debe completarse antes de declarar las pruebas nuevas aprobadas.

## Limitaciones
La tabla RLS de gestor es **independiente** de las RPC del laboratorio de cotizaciones de seis versiones: se prueba la política de aislamiento, no un contrato de servicio productivo completo. El test de reintentos es optimista y controlado, no una batería de deadlocks ni caídas de red. No se debe copiar el modelo `current_user` a un backend Supabase con pooling sin rediseñar la identidad y los permisos. Ninguna ruta vial fue consultada y no hay datos comerciales reales.

No se tocó Supabase, staging, producción, pedidos, clientes, correo ni pagos.
