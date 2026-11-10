# Cierre de coherencia documental y estática — 2026-11-10

Base autorizada: `0557069ccd421cdac02f6c85e1d0166b00785eb4`. Revisión GitHub offline exclusivamente. Fuentes: especificación incremental, plan de remediación, controlador staging y validadores existentes. Sin SQL ejecutado, sin Supabase consultado, sin cambios operativos ni producción.

## Matriz de revisión
| ID | Contrato | Evidencia | Estado |
|---|---|---|---|
| CO01 | Migración incremental | v4 aborta ante tablas existentes; especificación INC-P01–P06 y INC-A01–A05 prohíbe reutilización | DOCUMENTADO, no aplicado |
| CO02 | Integridad de cliente | `clientes_oficiales.numero int4` distinto de IDs de destinatarios `int8`; FK cliente_numero int4 | CONSISTENTE |
| CO03 | NOT VALID | `ed_cliente_cuba_direccion_ck` requiere validación futura separada | BLOQUEO NO-GO |
| CO04 | Normalización | NORM-v1: NFC + trim + colapso de espacios; conserva tildes, puntuación, mayúsculas, apartamentos y números | PROPUESTA precisa, aprobación pendiente |
| CO05 | Identidad dirección | cliente_numero + provincia + municipio + barrio + direccion normalizados; excluir referencias/receptor/teléfono | DOCUMENTADO |
| CO06 | Concurrencia | controlador SELECT seguido de INSERT/UPDATE; UNIQUE y UPSERT transaccional futuros | NO IMPLEMENTADO |
| CO07 | Serialización bigint | salida textual en origen; no convertir números JSON inseguros después | DOCUMENTADO |
| CO08 | Compatibilidad API | números legacy seguros -> string, nuevos IDs string, versión API y consumidores | PENDIENTE implementación |
| CO09 | Permisos | RPC con sesión/ownership, EXECUTE restringido, search_path fijo, sin grants nuevos | NO-GO cambios |
| CO10 | Pruebas | checker estático verifica requisitos, no demuestra atomicidad, RLS, ni integridad real | ALCANCE limitado |
| CO11 | Reversión | Git revert de documentación y tests; futuro backup/rollback independiente | DOCUMENTADO |
| CO12 | GitHub Actions | solo PASS con run y jobs concluidos; consulta vacía no equivale a PASS | VERIFICAR ejecución |

## Observaciones finales
- **NO-GO** para ejecutar el borrador v4 antiguo: no coincide con el staging históricamente observado.
- **NO-GO** para declarar direcciones únicas: la secuencia del controlador actual no es atómica.
- **NO-GO** para afirmar compatibilidad bigint extremo a extremo: `Number.isSafeInteger` todavía gobierna IDs del controlador.
- Los validadores estáticos previos comprueban principalmente cadenas de texto y presencia de contratos; son útiles contra omisiones, pero no prueban lógica de negocio. Se añadió cobertura de NORM-v1, precisión JSON y versionado sin tocar runtime.
- La normalización NORM-v1 conserva mayúsculas y tildes deliberadamente; puede dejar duplicados semánticos, pero evita fusiones destructivas sin reglas aprobadas.
- Las pruebas funcionales futuras requieren autorización separada, staging aislado y datos ficticios.

**Reversión:** revertir los commits de documentación y validadores de esta etapa; ninguna reversión de Supabase es necesaria.
