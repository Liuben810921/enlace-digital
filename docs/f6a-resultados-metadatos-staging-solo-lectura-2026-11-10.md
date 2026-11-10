# F6-A — Verificación administrativa de metadatos staging (solo lectura)

Fecha 2026-11-10. Base `b3c220d69ab6c66d8e6640ef5664c1c4a91fc9b7`. GitHub Actions #443: success. Consultas SELECT exclusivamente sobre catálogos PostgreSQL e information_schema en `xqahthghvozeigbojhyi`; no filas de clientes, no PII, no agregados de duplicados, no DDL/DML, no producción.

## Evidencia
| Control | Resultado observado | Comparación F0 |
|---|---|---|
| Identidad | `enlace-digital-staging`, us-east-1, ACTIVE_HEALTHY, PostgreSQL 17.11 | Igual |
| Tablas | `clientes_oficiales`, `clientes_destinatarios`, `clientes_direcciones_entrega` presentes, owner postgres | Igual |
| Columnas/tipos | `clientes_oficiales.numero int4`; hijas `id int8` y `cliente_numero int4` | Igual |
| Logística | Direcciones conserva latitud, longitud, distancia_km, punto_salida_id, ruta_version, calculado_en, usado_en | Igual |
| PK/FK | PK en numero/id; ambas hijas FK cliente_numero → clientes_oficiales(numero) ON DELETE CASCADE | Igual |
| Restricciones | `ed_cliente_cuba_direccion_ck` sigue `NOT VALID`; otras constraints listadas válidas | Igual |
| Índices | PK únicas, índices no únicos por cliente_numero en ambas hijas; sin UNIQUE de identidad NORM-v1 | Igual |
| RLS | Habilitado en tres tablas, FORCE RLS false, cero policies | Igual |
| Grants | anon/authenticated sin SELECT/INSERT/UPDATE/DELETE; service_role DML en hijas, ninguno en clientes_oficiales | Igual |
| Funciones | 8 funciones con prefijo ed_cliente_/ed_correo_: 6 SECURITY DEFINER, 2 SECURITY INVOKER; owner postgres, search_path vacío | Compatible con subconjunto F0; F0 registró 10 funciones relevantes bajo alcance más amplio |
| EXECUTE | anon/authenticated sin EXECUTE en esas 8; service_role EXECUTE en 7/8, excepto ed_cliente_registrar_privado | Igual |
| Secuencias | 3; id_seq hijas dependencia interna; clientes_oficiales_numero_seq sin enlace de ownership; service_role USAGE, anon no | Igual |

## Diferencia de cobertura de funciones
La consulta F6-A buscó nombres `ed_%`, `%cliente%`, `%destinatario%`, `%direccion%`; devolvió 8 funciones (6 DEFINER, 2 INVOKER). El inventario F0 anotó 10 funciones relevantes (8 DEFINER, 2 INVOKER) usando un alcance distinto. **No declarar igualdad del total de funciones ni desaparición de dos funciones** sin reconciliar los criterios exactos de selección; tampoco concluir cambio de permisos. Este es un **pendiente de cobertura documental**, no una diferencia de esquema comprobada.

## Conclusión y bloqueos
- Los objetos inspeccionados conservan las propiedades estructurales F0 observadas. No se ha comprobado la existencia o ausencia de duplicados reales.
- **NO-GO** para F6-C: falta UNIQUE por identidad de dirección y no hay evidencia de RPC transaccional F3 instalada, backfill, backup restaurable ni aislamiento ensayado.
- La restricción cubana NOT VALID requiere evaluación histórica autorizada aparte; no validar ni alterar.
- No interpretar SECURITY DEFINER como seguridad suficiente: el diseño exige auditoría de cuerpo, owner, search_path y autorización de sesión antes de cualquier activación.
- Reversión de esta fase: `git revert` del informe y su comprobador; **Supabase no sufrió cambios**.

## Siguiente autorización independiente
F6-B podría revisar **únicamente conteos agregados** de colisiones NORM-v1 con controles de privacidad y un algoritmo de normalización previamente validado. No debe consultar ni devolver filas, direcciones, teléfonos, nombres, tokens ni IDs individuales. Si no puede asegurarse que el agregado respeta NORM-v1, detenerse y solicitar autorización de diseño; no improvisar.
