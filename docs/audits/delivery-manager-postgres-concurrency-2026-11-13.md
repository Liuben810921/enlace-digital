# PostgreSQL desechable: concurrencia real e idempotencia del cotizador de gestores

**Fecha:** 13 noviembre 2026. **Rama aislada:** `audit/delivery-map-readonly-20261113`. **Ejecución aprobada:** https://github.com/Liuben810921/enlace-digital/actions/runs/43502252601

## Archivos
- `tests/postgres-delivery-quote-lab.sql`: esquema `quote_lab` en PostgreSQL 16 desechable, tabla de configuración versionada, operaciones con clave única por actor, auditoría y funciones PL/pgSQL transaccionales.
- `tests/postgres-delivery-quote-lab.sh`: batería reproducible con múltiples procesos psql simultáneos.
- `.github/workflows/isolated-delivery-quote.yml`: servicio temporal PostgreSQL 16, instalación de cliente y ejecución de pruebas junto a las baterías Node previas.

## Pruebas y resultados
1. **24 llamadas concurrentes en 12 pares**: una fila persistida por actor/clave; respuestas compatibles con commit o replay, sin duplicación.
2. **Idempotencia**: un reintento con misma clave y payload devuelve el importe originalmente almacenado, aunque el llamante cambie el importe sugerido; payload distinto provoca error y no sobrescribe.
3. **Rollback**: una operación revertida no deja registro y puede volver a ejecutarse.
4. **Commit de resultado desconocido (simulado)**: se descarta la respuesta del primer commit y el reintento recupera la fila confirmada. No se forzó una desconexión de red en el instante exacto del commit.
5. **Cambio simultáneo de tarifas**: dos conexiones intentan actualizar la misma versión; solo una confirma el cambio y se registra una fila de auditoría.
6. **Invalidación**: después de cambiar la versión, se rechazan replays y nuevas cotizaciones basadas en la versión anterior.

## Correcciones detectadas por CI
- Primera ejecución: referencia ambigua a `version` dentro de PL/pgSQL, corregida calificando la columna.
- Segunda ejecución: prueba dependía de qué conexión ganaba la carrera, corregida para aceptar ambos órdenes legítimos.
- Tercera ejecución: **success**.

## Límites y pendientes
Esta batería prueba transacciones y concurrencia real en una **base desechable**, pero no implementa la autenticación, rutas reales ni integración operativa del cotizador. El importe se pasa como dato de fixture: en staging/producción deberá calcularse en servidor desde cesta, tarifas y ruta verificada. La operación no crea pedidos, no emite cobros ni modifica clientes. El modelo no cubre todavía caídas abruptas de conexión durante el commit, deadlocks inducidos, reintentos automáticos con backoff ni cambios concurrentes de dirección y almacenes. Antes de staging se requiere una autorización separada, controles de acceso reales, protección de datos y una política de caducidad de cotizaciones.

**No se accedió ni modificó Supabase, staging, producción, clientes reales ni pedidos.**
