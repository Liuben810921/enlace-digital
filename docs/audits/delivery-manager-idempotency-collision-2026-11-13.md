# Auditoría de colisión de claves de idempotencia entre cestas — 13 noviembre 2026

## Ámbito
Rama aislada `audit/delivery-map-readonly-20261113`; PostgreSQL 16 desechable de GitHub Actions. Ninguna conexión a Supabase, staging, producción, clientes ni pedidos.

## Riesgo y corrección
En `quote_preview`, tras `INSERT ... ON CONFLICT DO NOTHING`, el código recuperaba la fila ganadora por `(actor_role, operation_key)`, verificaba solamente `payload_hash` y devolvía `committed`. Este camino era menos estricto que el de replay. Se ha endurecido con una segunda validación de identidad de cesta y de las cinco versiones del contexto (cesta, tarifas, ruta, dirección, almacenes), antes de devolver un importe.

**Importante:** el digest estructurado existente ya separa los identificadores de cestas diferentes, por lo que una carrera ordinaria de cestas distintas termina en conflicto `23505`. La nueva comprobación es defensa en profundidad frente a un resultado concurrente o inconsistente; no se afirma que se haya demostrado una explotación de la versión anterior.

## Pruebas
`tests/postgres-delivery-rpc-rls-lab.py` añade dos sesiones concurrentes de administrador con una misma clave de operación para `cart-a` y `cart-b`. Esperado: una cotización confirmada, una denegación `UniqueViolation`, exactamente una fila persistida. Las demás pruebas cubren RLS, permisos, aislamiento y carreras de cambios de contexto.

## Evidencia
- Corrección SQL: `67a994d7fb93e36c344c963ee2f98edd54af6e62`.
- Prueba concurrente: `00f0a02ec3a11ba32b31b9eabbdea66bb613059b`.
- GitHub Actions `43510623945` (corrección): en ejecución al consultar.
- GitHub Actions `43510643746` (regresión): en cola al consultar.
- **No declarar aprobado** hasta comprobar conclusión de la ejecución más reciente.

## Límites
Este prototipo no garantiza seguridad frente a escritores privilegiados que eludan el protocolo ni es integración productiva. El bloqueo por cesta usa `hashtext`, que puede generar colisiones conservadoras de bloqueo, no autorización cruzada. Se mantiene el propietario `NOLOGIN NOBYPASSRLS` y FORCE RLS.

## Cierre verificado de GitHub Actions — 13 noviembre 2026

Se consultaron directamente las ejecuciones y sus jobs mediante el conector de GitHub:

| Run | Commit probado | Estado y conclusión | Job |
| --- | --- | --- | --- |
| [43510623945](https://github.com/Liuben810921/enlace-digital/actions/runs/43510623945) | `67a994d7fb93e36c344c963ee2f98edd54af6e62` | `completed / success` | `test`, ID `132179607991`, `completed / success` |
| [43510643746](https://github.com/Liuben810921/enlace-digital/actions/runs/43510643746) | `00f0a02ec3a11ba32b31b9eabbdea66bb613059b` | `completed / success` | `test`, ID `132179675171`, `completed / success` |

**Dictamen:** la ejecución más reciente que incluye el test concurrente está aprobada. No se detectaron fallos de CI que justifiquen cambios adicionales. Este commit modifica únicamente documentación y no requiere repetir pruebas del código.

**Restricción mantenida:** solo rama aislada; sin acceso ni modificación a Supabase, staging, producción, clientes reales ni pedidos.
