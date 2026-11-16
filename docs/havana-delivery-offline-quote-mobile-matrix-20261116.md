# ENLACE DIGITAL — Contrato offline de cotización y matriz móvil

**Base:** `6e809783eeb4a1fb06b008a54a8857338c066118`  
**Rama:** `plan/havana-osrm-benchmark-offline-20261114`  
**Módulo aislado:** `experiments/havana-delivery-quote/quote.js`  
**Pruebas:** `experiments/havana-delivery-quote/quote.test.js`

## Implementación funcional

Se añadió un contrato JavaScript CommonJS independiente de `index.html` y de cualquier servicio externo. Acepta orígenes, proveedores, distancias por origen/destino, revisión de contexto, tarifa CUP/km, distancia mínima (por defecto 3 km) y tarifa especial explícita. Descarta almacenes inactivos y almacenes de proveedores inactivos. Selecciona el origen con mayor distancia vial verificada (desempate determinista por ID). Calcula `Math.ceil(max(minKm, km) * rateCupPerKm)`, salvo tarifa especial explícita. **No incluye gastos de mensajería en la caja de productos.**

Si faltan distancias para cualquier origen elegible, hay duplicados, datos no verificados, revisión obsoleta, cuarentena o tarifa inválida, devuelve `PENDIENTE` con `feeCup:null`. Un resultado válido es `COTIZACION_SIMULADA`, no un precio operativo.

## Ejecución focalizada

`node --test quote.test.js`: **20/20 OK**, 0 fallos. Incluye: origen más lejano, mínimo de 3 km, desactivación de origen/proveedor, proveedor activo, ruta ausente/no verificada/obsoleta, cuarentena, tarifa inválida, ausencia y duplicación de orígenes, tarifa especial válida/inválida, empate, distancia cero, NaN, ruta duplicada, cambio de tarifa y desbordamiento numérico.

Se recuperaron ambos archivos desde GitHub en el commit `b540bc6947c0e3bdc456006668be9dee89fedbb4`. Los Git blobs remotos coinciden con los hashes locales de los archivos ejecutados:

| Archivo | Git blob GitHub/local | SHA-256 local |
|---|---|---|
| `quote.js` | `73647ec44b9f6f69b5ffd7ece88b91798aabd4a7` | `e7422238c1ec524ce3a306bf701df4414a92fcb5e7e6d4fbb9284bb6f3699c9d` |
| `quote.test.js` | `f637eddf9963c658c2c43418e7a894ce63e0fd06` | `70f6203258131d98342528fd613be8df3433bb56ac3b8c5fe4d272ad5067dc97` |

La identidad de Git blob acredita coincidencia de contenido; los SHA-256 son cálculos locales, no ejecuciones remotas de GitHub. No se ejecutó GitHub Actions.

## Matriz de pruebas móviles preparada (NO ejecutada)

| ID | Escenario móvil | Resultado esperado |
|---|---|---|
| M01 | Crear proveedor de prueba | Aparece en Administración de entregas |
| M02 | Desactivar proveedor con almacén asociado | Origen deja de ser elegible |
| M03 | Crear almacén propio | Campos obligatorios y guardado local |
| M04 | Crear almacén de proveedor activo | Asociación correcta |
| M05 | Coordenadas incompletas | Rechazo visible sin guardar |
| M06 | Coordenadas fuera de rango | Rechazo y foco en campo |
| M07 | Crear destino de referencia | Se visualiza en esquema local |
| M08 | Recargar navegador | Datos de demostración persisten en ese navegador |
| M09 | Desactivar origen asignado | Se bloquea cotización sin origen elegible |
| M10 | Dos almacenes con rutas verificadas | Cobra desde el más lejano |
| M11 | Falta una ruta vial | `PENDIENTE` sin importe |
| M12 | Cambio de almacén o asociación | Invalida revisión previa |
| M13 | Cuarentena | Bloqueo de cambios/cotización |
| M14 | Zoom 200 % y teclado | Controles visibles, accesibles y navegables |
| M15 | Pantalla móvil estrecha | Formularios sin solapamientos ni recortes |
| M16 | Tarifa especial de producto voluminoso | Se aplica solo con configuración explícita |

Las pruebas M01–M16 requieren navegador móvil/Chromium y eventualmente integración controlada; no se presentan como ejecutadas. El módulo aislado **no está conectado a checkout** ni a persistencia compartida. Falta definir cómo certificar distancias viales y asociar la revisión de cesta/dirección/origen al motor real. No se debe aceptar `status:'verified'` suministrado por un cliente como prueba de distancia auténtica: la verificación deberá proceder de un componente confiable cuando se autorice su implementación.

## Restricciones

No se modificó `index.html`, workflows, staging, producción, Supabase, inventario, pedidos ni datos reales. Sin PostgreSQL, Actions, OSRM, cartografía, servicios externos ni costos. No se repitieron las auditorías de seguridad de 259 pruebas.
