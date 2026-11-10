# F6-B25 — pruebas adversariales de límites, parsers e idempotencia

Fecha: 2026-11-10. PR #3, rama aislada. Solo GitHub Actions con PostgreSQL desechable.

## Alcance
Ampliación sintética del contrato de JSON crudo F6-B24. Reutiliza su parser estricto y la función sintética ED-OP-v1 de F6-B23, sin acceder a datos ni servicios externos. El protocolo de prueba rechaza Unicode no ASCII y escapes (incluidos pares sustitutos), en lugar de normalizarlos silenciosamente.

### Matriz reproducible
- Límites de transporte: longitud máxima de 256 bytes, rechazo de 257 bytes; 15 cifras enteras permitidas, 16 rechazadas; acción de 40 caracteres permitida, 41 rechazada.
- JSON crudo: rechazo de duplicados de claves, duplicados idénticos, campos inesperados y objetos anidados; rechazo de decimales, exponentes, ceros iniciales, separadores de miles, importes negativos y cadenas con apariencia numérica.
- Unicode y escapes: rechazo de bytes UTF-8 no ASCII, secuencias Unicode, escapes de barra, saltos de línea, tabulaciones, NUL y surrogate escapes. Las claves con escapes se rechazan antes de la canonicalización.
- Estabilidad: permutaciones de claves y espacios generan los mismos bytes de JSON reconstruido y el mismo SHA-256 en Python; el backend calcula el digest contractual independiente de la representación del JSON.
- Identidad y reintentos: dos roles sintéticos pueden usar la misma clave sin cruzar datos; rollback no consume la clave; ocho solicitudes concurrentes de una misma identidad y payload esperan exactamente un NEW y siete REPLAY; payload distinto da CONFLICT; rol extraño no ejecuta función.
- La prueba F6-B24 también contrasta divergencias PostgreSQL JSONB: normalización de números y último valor ante clave duplicada.

## Riesgos y límites
No se simulan JWT reales, HTTP, proveedores de pago, TTL, efectos externos, clientes, producción ni staging. Las pruebas de concurrencia comprueban idempotencia transaccional sintética, no garantías de exactly-once de operaciones externas. Se requiere una especificación de moneda y Unicode si el contrato admite otros caracteres. Las diferencias entre parsers están representadas por Python y PostgreSQL JSONB; no se afirma cobertura universal de todos los lenguajes.

**No-go:** sin merge, despliegue, staging, Supabase, clientes, históricos, correo, pedidos ni servicios. Para modificar staging o leer históricos se requieren autorizaciones independientes.

**CI:** pendiente de resultado final F6-B25; no afirmar PASS hasta observar el job.
