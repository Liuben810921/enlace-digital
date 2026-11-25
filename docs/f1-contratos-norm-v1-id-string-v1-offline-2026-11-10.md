# F1 — Contratos cerrados NORM-v1 e ID-STRING-v1 (NO EJECUTABLES)

Fecha: 2026-11-10. Base: `062db23533117534fd95d43d356da82795ae7d8a`. Solo GitHub y offline. Contratos de diseño, NO desplegados ni probados contra Supabase.

## Base F0 comprobada
- `clientes_oficiales.numero` y ambas FK `cliente_numero` son `int4`; `clientes_destinatarios.id` y `clientes_direcciones_entrega.id` son `int8`.
- Tres tablas existentes, RLS habilitado, sin permisos directos para `anon`/`authenticated`; `service_role` con DML en las dos hijas. No existe índice UNIQUE por identidad normalizada de dirección.
- `ed_cliente_cuba_direccion_ck` está `NOT VALID`. No hay inspección de filas, por lo que no se conocen duplicados históricos.
- El controlador staging actual usa `validId` basado en `Number.isSafeInteger`; `recipient-save` recibe `id` numérico; `delivery-location-save` realiza SELECT y luego UPDATE/INSERT; `profile` devuelve IDs procedentes de PostgREST sin conversión explícita. **Ninguno cumple todavía el contrato ID-STRING-v1**. No cambiar código operativo en F1.

## NORM-v1 — identidad de dirección

**Ámbito:** solo `clientes_direcciones_entrega` para deduplicación; no deduplicar `clientes_destinatarios` por dirección (distintas personas pueden vivir en la misma ubicación). La dirección habitual en `clientes_oficiales` es independiente. No confundir domicilio físico con receptor de entrega.

**Campos de identidad:** `cliente_numero` int4 + `provincia`, `municipio`, `barrio`, `direccion` como cuatro cadenas normalizadas. `cliente_numero` evita colisiones entre clientes. Los campos `nombre_receptor`, `telefono_receptor`, `referencias`, latitud, longitud y datos logísticos NO participan en la identidad.

**Función normativa `norm_v1(s)`:** entrada Unicode válida; normalizar a **NFC**; sustituir cada secuencia de espacios de Unicode White_Space (incluidos tabulaciones, CR/LF, NBSP, espacios de ancho variable) por un solo U+0020; quitar U+0020 inicial/final. **Conservar** mayúsculas/minúsculas, tildes, ñ, puntuación, signos # y /, ceros y números de apartamento. No transliterar, no quitar acentos, no aplicar `lower()`, no usar collation dependiente de locale para equivalencia. La clave compara los bytes UTF-8 de los resultados. La versión `NORM-v1` se incluye en la identidad para permitir cambios futuros sin reinterpretar claves antiguas.

**Campos vacíos:** provincia/municipio/dirección vacíos tras normalización = rechazo; barrio puede ser cadena vacía. Aplicar límites de longitud actuales del controlador (provincia y municipio 2–100; barrio 0–150; dirección 8–500) después de la normalización; el tamaño de bytes debe revisarse por separado antes de persistir. Rechazar Unicode inválido; no eliminar silenciosamente caracteres de control distintos de White_Space: rechazar C0/C1 restantes, U+200B y U+FEFF para evitar identidades invisibles. No resolver abreviaturas (Calle/C.), tildes ni variantes de escritura automáticamente.

**Implementación futura obligatoria:** elegir una sola función normativa de servidor y su versión (no confiar en dos implementaciones JS/SQL divergentes), persistir identidad versionada, definir índice UNIQUE por cliente+identidad, y una RPC transaccional con `INSERT ... ON CONFLICT` o mecanismo equivalente respaldado por UNIQUE. `SELECT` seguido de `INSERT` no es atómico. Resolver colisiones históricas antes de añadir UNIQUE, con revisión de referencias y snapshots; jamás fusionar o eliminar automáticamente. No sobrescribir receptor/teléfono de otro cliente. La RPC valida sesión, ownership y límites, no amplía `EXECUTE` a `anon` ni `authenticated`, mantiene `search_path` seguro.

**Casos de prueba estáticos:** N01 `"  La   Habana "` = `"La Habana"`; N02 `"Á"` = `"A◌́"` tras NFC; N03 `"Calle 12 #5"` != `"calle 12 #5"`; N04 `"Peña"` != `"Pena"`; N05 `"Apto 01"` != `"Apto 1"`; N06 `"C/1"` != `"C 1"`; N07 barrio vacío permitido; N08 provincia vacía rechazada; N09 U+200B rechazado; N10 claves de clientes distintos no colisionan; N11 20 solicitudes simultáneas deben devolver un ID único en pruebas futuras de staging, no demostrable offline; N12 misma ubicación con distinto receptor reutiliza ubicación sin perder identidad del receptor en el pedido.

## ID-STRING-v1 — transporte sin pérdida de int8

**Ámbito:** `clientes_destinatarios.id` y `clientes_direcciones_entrega.id` (bigint SQL positivo), en `recipient-save`, `delivery-location-save`, `profile` y cualquier selección/referencia futura. `clientes_oficiales.numero` continúa siendo int4 numérico y se valida como entero de 1 a 2147483647; no cambiar su contrato sin versión nueva.

**Formato canónico:** JSON string decimal ASCII sin signo, `^[1-9][0-9]*$`, sin ceros iniciales, espacios, fracciones, exponente, signo +, - ni notación científica. Máximo `9223372036854775807` (int8 firmado). Parsear/validar con `BigInt` después de regex y límite de 19 dígitos, sin pasar por `Number` para IDs int8. Comparar como cadenas canónicas o `BigInt`. No serializar valores `BigInt` nativos mediante `JSON.stringify` sin convertirlos previamente a string.

**Frontera de lectura:** la capa de acceso a datos debe obtener representación decimal exacta de la base de datos **antes** de cualquier conversión a número JavaScript; si PostgREST entrega JSON numérico que ya ha perdido precisión, no se puede reparar con `String(...)`. Requiere una respuesta RPC con `id::text` o equivalente explícito, y pruebas de contrato. En el controlador, `profile` debe mapear IDs como strings; respuestas `recipient-save` y `delivery-location-save` deben usar `id` string. Para escritura, enviar `id` string validado, comparar junto con `cliente_numero` y comprobar ownership.

**Compatibilidad temporal:** aceptar números JSON solo si `Number.isSafeInteger(value)` y `value>0`, convirtiéndolos a string en el límite de entrada. Rechazar números mayores que `9007199254740991` incluso si parecen enteros, por posible redondeo previo. Para clientes antiguos que exigen respuesta numérica, ofrecer contrato versionado explícito solo para IDs seguros; nunca devolver silenciosamente un número redondeado. Versionar el contrato y documentar cambios en el adaptador del frontend antes de habilitarlo. Mantener desactivado el checkout real.

**Casos de prueba estáticos:** I01 `"1"` válido; I02 `"9007199254740991"` válido; I03 `"9007199254740992"` válido como string; I04 `"9223372036854775807"` válido; I05 `"9223372036854775808"` rechazado; I06 `"01"` rechazado; I07 `"1e3"` rechazado; I08 `"-1"` rechazado; I09 `1` numérico aceptado transitoriamente; I10 número inseguro rechazado; I11 `null` no es ID (solo ausencia explícita al crear); I12 destinatario de otro cliente no editable; I13 perfil no devuelve ID numérico inseguro; I14 `cliente_numero` int4 permanece numérico.

## Matriz de compatibilidad y reversión

| Consumidor | Estado observado | Cambio futuro requerido | Reversión |
|---|---|---|---|
| `recipient-save` | ID numérico seguro y validId | ID-STRING-v1 de entrada/salida; ownership | Adaptador anterior solo para IDs seguros |
| `delivery-location-save` | SELECT/UPDATE/INSERT, riesgo carrera | NORM-v1 + índice UNIQUE + RPC atómica; ID string | Feature flag off; preservar registros, no eliminar |
| `profile` | IDs directos de PostgREST | Selección exacta en texto decimal y JSON strings | Versión anterior solo bajo umbral seguro |
| `clientes_oficiales.numero` | int4 Number.isSafeInteger | Conservar int4, límite 2147483647 | Sin cambio |
| Frontend y adaptador web | Compatibilidad de strings no probada | Auditoría y pruebas antes de modificar UI | Feature flag / versión anterior |

**Riesgos y NO-GO:** divergencia Unicode entre entornos; colisiones históricas; overwrite de receptor; ausencia de UNIQUE; ID int8 redondeado antes del controlador; cliente antiguo que espera number; fuga entre clientes; ampliación indebida de permisos. No declarar pruebas de concurrencia aprobadas, ni serialización real de PostgREST, ni migración viable hasta ensayos F2–F6 autorizados. La restricción `NOT VALID` debe verificarse por separado.

**Reversión de F1:** `git revert` de documentos y validadores estáticos. No hay DDL, DML, cambios de controlador, despliegue ni datos que revertir.
