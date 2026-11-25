# Auditoría adicional PR #1 — 2026-11-09

## Estado observado de GitHub
- Comparación con main: 3 commits ahead, 0 behind; 3 archivos nuevos, sin cambios a archivos existentes.
- `get_commit_combined_status` del commit `c5e327db662703fa07376396ba44cce1b5ae3b39`: lista de estados vacía.
- `fetch_commit_workflow_runs` para ese commit: lista vacía (consulta limitada por conector a ejecuciones disparadas por pull request y primera página).
- Revisiones de PR: ninguna.
- No se afirma que GitHub Actions esté globalmente deshabilitado ni que el PR sea fusionable.

## Comprobaciones estáticas del archivo SQL propuesto
- PASS: La función propuesta existe.
- PASS: SECURITY DEFINER preservado.
- PASS: Bloqueo conserva cliente y propósito.
- PASS: Cooldown sin condición de consumo.
- PASS: Invalidación solo de pendientes.
- PASS: Caducidad 20 min y 24 h.
- PASS: Sin COMMIT ni conexión SMTP.
- PASS: Un único CREATE OR REPLACE FUNCTION.

**Alcance:** aserciones textuales contra el contenido recuperado de GitHub. No equivalen a compilar SQL, pruebas unitarias de PostgreSQL ni análisis de concurrencia.

## Riesgos y bloqueos
1. No hay verificación CI observada para este commit. No se puede afirmar validación automática.
2. Las 18 aserciones transaccionales permanecen sin ejecutar por la vía autorizada.
3. La propuesta contiene `CREATE OR REPLACE FUNCTION`: aunque está almacenada en `sql/propuestas`, no debe aplicarse automáticamente.
4. El resultado de mergeability requiere confirmación independiente; ausencia de divergencia no demuestra mergeability.
5. No fusionar, desplegar, conectar correo ni activar pedidos reales.

## Próximo paso
Solicitar revisión del SQL por un responsable autorizado y ejecutar las pruebas en staging únicamente por un canal permitido, con reversión y evidencia PASS/FAIL. Mantener este PR en borrador.
