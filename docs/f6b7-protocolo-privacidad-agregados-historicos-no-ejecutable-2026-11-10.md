# F6-B7 — Protocolo de evaluación histórica de colisiones NORM-v1, SOLO OFFLINE / NO EJECUTABLE

Fecha: 2026-11-10. Base `7b43fff8424ac127ceea1a7b2c918ce35a57e3e9`. GitHub Actions #503, ID `42881118304`, SUCCESS. **No se ejecutó SQL ni se consultaron datos reales de Supabase en F6-B7.** Este documento no es una autorización para leer registros.

## 1. Alcance y definición exacta de colisión

**Única tabla candidata:** `public.clientes_direcciones_entrega`. No incluir `clientes_destinatarios`, `clientes_oficiales` ni direcciones habituales de la ficha de cliente. No unir a otras tablas.

**Identidad versionada:** `(NORM-v1, cliente_numero::int4, provincia_norm, municipio_norm, barrio_norm, direccion_norm)`. Los cuatro campos de texto se normalizan independientemente con NFC, los **25 puntos de código Unicode White_Space** exactos, colapso a U+0020, recorte de espacios U+0020 al inicio/final, y rechazo de controles C0/C1 restantes, U+200B, U+FEFF y Unicode inválido. No se cambian case, tildes, puntuación ni ceros; no usar `lower`, `unaccent`, regex dependiente de locale ni comparación lingüística. `barrio` vacío permitido; provincia, municipio y dirección vacías prohibidas. Límites posteriores a normalización: provincia/municipio 2–100, barrio 0–150, dirección 8–500. La comparación de cada cadena se basa en **bytes UTF-8** (representación canónica), nunca en collation ICU/libc. No concatenar campos sin delimitación no ambigua ni usar hash no criptográfico como identidad definitiva.

**Colisión histórica:** dos o más filas de `clientes_direcciones_entrega` para el **mismo** `cliente_numero` y exactamente las mismas cuatro cadenas NORM-v1. El grupo de identidad se calcula solo dentro de la ejecución y **no sale** como resultado ni log. La presencia de direcciones iguales en clientes distintos NO es duplicado. Un mismo domicilio para receptores distintos NO permite fusionar receptores. La ausencia de UNIQUE histórica se constató en F6-A, pero **no se conoce** el número de duplicados.

## 2. Preflight y gates de seguridad

- **P0:** aprobación explícita posterior, exclusiva de staging y de **una única** lectura agregada con forma y política de salida revisadas; no autorización para SELECT de filas ni escritura.
- **P1:** GitHub Actions de F6-B7 en SUCCESS, informe F6-B6 27/27 sintéticos, y revisión independiente de riesgos de privacidad y de inferencia.
- **P2:** identidad de proyecto staging comprobada por vía administrativa; estado saludable, PostgreSQL 17.11, UTF8, collation ICU `en_US.UTF-8` versión `153.121`; verificar cambios antes de ejecutar. No usar credenciales de producción.
- **P3:** permisos mínimos: rol técnico autorizado de solo lectura, sin DDL/DML, sin SECURITY DEFINER, sin escalada, sin crear funciones ni extensiones; si el único camino requiere rol administrativo `postgres`, documentar y obtener aprobación específica para ese riesgo antes de continuar.
- **P4:** ejecución con `statement_timeout` y `lock_timeout` limitados, transacción read-only cuando sea posible, sin exportar filas, sin temporales persistentes, sin `EXPLAIN ANALYZE` que exponga valores, sin consultas repetidas ni variantes por filtros.
- **P5:** validar campos potencialmente NULL, longitudes y caracteres prohibidos antes de aplicar la identidad; **no** tratar NULL como cadena vacía sin decisión contractual. Si existe dato histórico inválido o no representable, bloquear informe de colisiones y registrar solo estado general de error no identificable.
- **P6:** revisar plan de ejecución y costo de CPU/memoria sin ejecutar una lectura de datos reales; si no se puede estimar de forma segura, **NO-GO**.
- **P7:** auditar destinos de resultados, logs, historial SQL, telemetría y retención; nunca registrar claves, direcciones, IDs, nombres, teléfonos, ejemplos, valores de entrada o resultados por grupo.

## 3. Política de minimización de salida: NO-GO ante grupos pequeños

**Advertencia fundamental:** una sola cifra global, un booleano, incluso `0`, pueden revelar información si el universo es pequeño o conocido. No basta con omitir filas. No se deben devolver `COUNT(*)`, número de grupos, máximo de repetición, claves de grupo, muestras, histogramas, listas de IDs, desglose por cliente/municipio/fecha ni valores de hash. Tampoco realizar consultas de prueba con distintos filtros para deducir diferencias.

**Política conservadora propuesta (no habilitada):**
1. El cálculo interno, si se autoriza, solo produce un **estado global no cuantitativo**: `REVIEW_REQUIRED`, `NO_SIGNAL` o `SUPPRESSED`. Los dos primeros se entregan **únicamente si** una revisión independiente confirma que el universo agregado tiene tamaño suficiente, que la pertenencia de un cliente no es deducible y que existe base jurídica/operativa para esa divulgación. Si no se puede demostrar, devolver exclusivamente `SUPPRESSED` o no ejecutar.
2. Un umbral `k` de privacidad debe definirse y justificarse **antes** de ejecutar, con evaluación de amenazas y cardinalidad independiente; **no se fija arbitrariamente aquí**. No revelar si el umbral se cumplió en conjuntos pequeños; no devolver conteos ni valores por debajo de `k`. No suponer que k-anonimato por sí solo impide inferencia por conocimiento externo.
3. Una sola ejecución autorizada, sin filtros controlados por solicitante ni ventanas temporales comparables; registrar únicamente identificador de aprobación, fecha, versión de contrato y estado permitido. Si hay riesgo de diferencia entre ejecuciones, no repetir.
4. La salida `NO_SIGNAL` no demuestra ausencia de duplicados si existen filas inválidas, divergencias Unicode o errores; debe prevalecer `SUPPRESSED`/NO-GO.
5. **Si la evaluación de privacidad no puede demostrar que un estado global es seguro, no se ejecuta ninguna consulta histórica.** Alternativa: auditoría dentro de entorno protegido con revisión humana y sin extracción de resultados.

## 4. Forma lógica de cálculo (pseudocódigo, NO SQL ejecutable)

```text
EXIGIR autorización P0 + P1..P7
EXIGIR política de divulgación aprobada y presupuesto de consultas = 1
PARA cada fila de clientes_direcciones_entrega, solo dentro de un entorno protegido:
  validar cliente_numero y los cuatro campos; si inválidos => NO-GO
  calcular NORM-v1 para cada campo, incluyendo NFC + White_Space + rechazos
  codificar cada componente normalizado como UTF-8 con límites inequívocos
  formar identidad (versión, cliente_numero, provincia, municipio, barrio, direccion)
  contar ocurrencias por identidad, únicamente dentro del motor
DETECTAR grupos con frecuencia >= 2, sin exportar grupos ni claves
APLICAR política de supresión antes de liberar cualquier señal
DEVOLVER solo estado global permitido; ante cualquier duda, SUPPRESSED
```

**No desplegar** el pseudocódigo como función RPC, índice UNIQUE ni migración. No implementar deduplicación automática ni eliminar/fusionar direcciones. F6-C (UNIQUE) y F6-D (RPC/escrituras) permanecen bloqueadas; requieren backups restaurables, plan de resolución manual, permisos y autorización aparte.

## 5. Matriz de decisión

| Gate | Condición | Estado F6-B7 |
|---|---|---|
| B7-01 | CI documental aprobado | PENDIENTE |
| B7-02 | Equivalencia sintética staging 27/27, tres rechazos en frontera | VERIFICADO F6-B6, limitado |
| B7-03 | Autorización de lectura histórica | **NO AUTORIZADA** |
| B7-04 | Privacidad de estado global y tamaño del universo | **NO DEMOSTRADA** |
| B7-05 | Umbral k y defensa frente a inferencia | **NO DEFINIDO** |
| B7-06 | Rol de mínimo privilegio para la lectura | PENDIENTE |
| B7-07 | Gestión de NULL/filas inválidas | PENDIENTE |
| B7-08 | Coste, timeouts, logging, retención y una sola ejecución | PENDIENTE |
| B7-09 | Sin exportación de filas/grupos/IDs/conteos | REQUISITO |
| B7-10 | Sin DDL/DML, producción ni pedidos reales | REQUISITO |

## 6. Reversión y próximos permisos

F6-B7 modifica **solo** documentación, validador y workflow en GitHub; reversión mediante `git revert`. Sin consultas a datos reales, sin Supabase, producción, despliegues, correos o pedidos.

**Próxima autorización, independiente:** exclusivamente revisar/aprobar el diseño de salida y, solo si todos los gates de privacidad se satisfacen, autorizar una consulta histórica agregada de una sola ejecución en staging. **La presente etapa no solicita ni concede permiso para ejecutar esa consulta.**
