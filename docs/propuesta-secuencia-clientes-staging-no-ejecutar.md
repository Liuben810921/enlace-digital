# Propuesta NO EJECUTAR — secuencia de clientes staging

**Estado:** revisión de diseño; no es migración autorizada. Solo staging. No ejecutar SQL de este documento ni en SQL Editor ni en producción.

## Riesgo comprobado

La propuesta de esquema crea `public.clientes_oficiales_numero_seq AS integer START WITH 1`, mientras la tabla `public.clientes_oficiales` ya existe y su `numero` es clave primaria. Si hay registros con identificadores positivos, el primer `nextval` podría reutilizar un número. La existencia de un índice UNIQUE no evita el fallo de registro; solamente impide la colisión silenciosa. `CREATE SEQUENCE IF NOT EXISTS` por sí solo tampoco sincroniza el contador.

## Procedimiento de futura instalación, sujeto a aprobación

1. Deshabilitar nuevas altas y cualquier otro escritor que asigne `numero`; confirmar que el bloqueo de escritura se mantiene hasta terminar la inicialización. No confiar únicamente en una lectura previa de MAX.
2. Abrir una ventana de mantenimiento y verificar en catálogo la secuencia, su propietario, dependencias, incremento, mínimo/máximo y valor de estado, además de `MAX(numero)` y la posibilidad de números asignados fuera del contador.
3. Bajo exclusión de escrituras concurrentes, crear o inspeccionar la secuencia. Calcular un siguiente número seguro **mayor que el máximo de la tabla y que cualquier valor ya reservado por la secuencia**. Si está vacía, respetar el mínimo y comenzar por 1. Si existe, no retrocederla. Confirmar capacidad del tipo `integer`.
4. Ajustar la secuencia únicamente mediante una operación autorizada, teniendo en cuenta que `setval` y `nextval` no se revierten con ROLLBACK. Una migración SQL idempotente debe comparar el estado real cada vez y jamás reiniciar el contador a 1 en una repetición.
5. Validar los permisos de USAGE/SELECT y propietario, que `nextval` sea invocable por el propietario efectivo de la RPC SECURITY DEFINER, y que las tablas mantengan RLS y restricciones. Rehabilitar altas solo después de pruebas controladas y aprobación.

**No se incluye aquí un bloque `setval` ejecutable**: la implementación concreta requiere confirmar la estrategia de exclusión de concurrencia y el estado real de la secuencia en la ventana de migración. Se evita una receta que pudiera bajar el contador o colisionar.

## Aislamiento y verificación

El script `scripts/check_staging_isolation.py` y GitHub Actions inspeccionan las rutas de destinatarios y direcciones sin conectarse a una base de datos. Las pruebas de integración negativas futuras deben incluir: token de A con ID de destinatario de B (404 y ninguna modificación), perfil de A sin registros de B, token revocado o caducado (401 y ninguna escritura), dirección ocasional de B no reutilizada ni actualizada por A, y registro con teléfono duplicado. Las comprobaciones de código no sustituyen esas pruebas.

No se ha ejecutado ningún SQL de efectos, migración ni despliegue.

## Evidencia de staging vacío (2026-11-09; lectura solamente)

- Consulta directa a `public.clientes_oficiales`: `COUNT(*) = 0`, `MAX(numero) = NULL`.
- Consulta de catálogo `to_regclass('public.clientes_oficiales_numero_seq')`: `NULL` (no instalada).
- El borrado de clientes ficticios ocurrió **solo en la base anterior**, no en staging; no se transfirieron datos.
- En este estado observado, `CREATE SEQUENCE ... START WITH 1` es compatible con la tabla vacía. **No autoriza ejecutarlo aún**: la ausencia de datos y secuencia debe volver a comprobarse en la misma ventana de instalación, bajo exclusión de escritores. Si cambia cualquiera de esas condiciones, detener y aplicar el procedimiento conservador anterior.
- El control estático de CI rechaza reinicios destructivos de la secuencia en la propuesta y exige sus privilegios explícitos; **no demuestra** ausencia de concurrencia ni compila los cuerpos PL/pgSQL.

**Puerta de aprobación:** migración y despliegue continúan prohibidos hasta autorización explícita y verificación de prerrequisitos. No activar pedidos ni correo reales.
