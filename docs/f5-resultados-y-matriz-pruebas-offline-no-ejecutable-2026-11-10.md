# F5 — Batería offline reproducible, simulaciones y límites

Fecha 2026-11-10. Base autorizada `277e10f6ea63e7c93d6929c950f86adc0f66a981`. F4 CI #434: success. **No SQL, no conexión Supabase, no datos reales, no despliegue, no cambios de código operativo.**

## Ejecución reproducible
Desde raíz del repositorio, Python 3 estándar: `python3 scripts/check_staging_f5_offline_simulations.py`. GitHub Actions ejecuta esta prueba con el resto de validadores. Los identificadores, clientes, direcciones, tokens y destinatarios usados son **sintéticos**.

## Escenarios cubiertos por el modelo (no integración)
| Código | Simulación / aserción | Limitación |
|---|---|---|
| S01 | Unicode NFC y White_Space colapsados | Python Unicode no prueba equivalencia JS/SQL |
| S02 | Mayúsculas, tildes y apartamento distinguidos | No prueba índice/collation real |
| S03 | Controles invisibles rechazados | No prueba validación Edge |
| S04 | 20 hilos concurrentes, misma dirección/cliente → un ID | Lock en memoria, **no** ON CONFLICT real |
| S05 | 20 solicitudes, una creación y 19 reutilizaciones | Orden de ejecución no determinista |
| S06 | Reutilización no sobrescribe receptor original | Modelo sin triggers |
| S07 | Clientes diferentes obtienen IDs diferentes | Modelo no implementa RLS |
| S08 | Token incorrecto o cliente falsificado rechazado | Sesiones ficticias |
| S09 | Acceso a ID de otro cliente rechazado | Modelo de ownership |
| S10 | Snapshot de destinatario conservado | Snapshot en memoria |
| S11 | ID > 2^53 viaja como JSON string | No prueba PostgREST |
| S12 | Máximo int8, valores fuera de rango, ceros iniciales, exponentes | No prueba casting PostgreSQL |
| S13 | JSON number inseguro rechazado, number seguro admitido transitoriamente | No prueba frontend |
| S14 | Preflight detecta duplicados históricos simulados | No inspecciona filas reales |
| S15 | NO-GO para UNIQUE cuando hay colisiones | No crea índice |
| S16 | Reversión de sombra no altera fuente ni snapshots | No restaura backup real |

## Gates para futura ejecución autorizada de staging
G01 identidad staging, drift y respaldos; G02 revisar duplicados agregados sin PII y referencias; G03 normalización única NFC/White_Space y claves sin colisiones; G04 UNIQUE válido antes de RPC; G05 RPC transaccional y prueba real de 20 solicitudes concurrentes; G06 RLS, SECURITY DEFINER, search_path y EXECUTE mínimos; G07 token expirado/revocado y aislamiento entre clientes; G08 PostgREST/RPC emite id::text sin pérdida para >2^53; G09 compatibilidad Edge/frontend y clientes antiguos; G10 snapshot y rollback restaurable; G11 mantener flags OFF y pedidos reales desactivados.

**NO-GO:** no concluir que hay cero duplicados reales, ni que PostgreSQL evita carreras, ni que RLS o funciones están correctamente configuradas a partir de simulaciones. La prueba usa un candado Python, no una base transaccional. No sustituye pruebas de staging ni autoriza despliegue.

**Reversión F5:** git revert de documentación, script de prueba y ajuste CI. No hay cambios de base de datos que revertir.
