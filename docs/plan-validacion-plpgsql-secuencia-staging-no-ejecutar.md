# Plan de validación semántica — staging, NO EJECUTAR

Estado: diseño para futura aprobación. No ejecutar funciones, DDL, migraciones ni pruebas de escritura sin autorización expresa. El PR #2 permanece aislado.

## Limitaciones comprobadas del CI actual

- `pglast` analiza sintaxis SQL exterior, pero no compila ni resuelve referencias de los cinco cuerpos PL/pgSQL.
- Las coincidencias estáticas y pruebas de mutación de código detectan pérdidas concretas de filtros de propiedad, pero no garantizan autorización completa ni evitan todos los cambios semánticos posibles.
- `BEGIN ... ROLLBACK` no revierte incrementos de secuencias; los fixtures SQL que registran clientes no son completamente reversibles respecto del contador.
- `service_role` omite RLS: hay que verificar filtros de propietario en cada ruta y con solicitudes reales aisladas, sin usar datos de clientes existentes.

## Validación futura de PL/pgSQL (requiere aprobación)

1. Clonar el esquema mínimo a una base efímera y aislada, sin datos reales ni conexión a producción, y con credenciales distintas.
2. Instalar únicamente extensiones, tablas y secuencias requeridas; confirmar tipos, columnas, funciones `extensions.crypt`/`gen_salt`, permisos de propietario y dependencias.
3. Compilar las cinco funciones con `check_function_bodies` habilitado y, si está disponible, ejecutar `plpgsql_check` en el clon; inspeccionar referencias, tipos, retorno, rutas de excepción y permisos.
4. Crear dos clientes ficticios en el clon y ejecutar pruebas de login, token NULL, caducidad, revocación, bloqueo, registro de Cuba/extranjero, duplicado de teléfono y aislamiento A/B para destinatarios y direcciones. Verificar que ID de B con token de A no modifica ni revela B.
5. Comprobar acceso denegado de `anon`/`authenticated` a las RPC privilegiadas, y permiso limitado de `service_role`. Registrar logs y limpiar por destrucción del entorno efímero, no confiando solo en ROLLBACK.

## Secuencia: condiciones de aceptación

- Inspección en ventana autorizada del estado real de `clientes_oficiales_numero_seq` y `MAX(numero)`, con exclusión de escritores concurrentes.
- Si la secuencia no existe, inicializarla de modo que el próximo valor sea mayor que todos los números ya asignados; si existe, nunca reducir su siguiente valor ni repetir uno reservado.
- Revisar desbordamiento de `integer`, titularidad y privilegios `USAGE` de la función `SECURITY DEFINER`.
- Repetir la migración en el clon y comprobar idempotencia sin reinicio a 1; ensayar también tabla vacía, IDs discontinuos y secuencia adelantada.
- Mantener altas reales desactivadas hasta aprobación posterior.

No se ha ejecutado este plan. Documento y controles son exclusivamente preventivos.
