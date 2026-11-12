# Cierre de CI de pruebas sintéticas — 2026-11-12

Evidencia consultada directamente desde la API de GitHub Actions:

| Workflow | Run | Commit | Conclusión |
| --- | --- | --- | --- |
| synthetic-email-token-attempt-guard | [#2](https://github.com/Liuben810921/enlace-digital/actions/runs/43296949687) | 73fb551f | success |
| synthetic-email-controller-validation | [#1](https://github.com/Liuben810921/enlace-digital/actions/runs/43327019135) | a61a3501 | success |

Ambas ejecuciones figuran `completed` y `success`. Se trata de pruebas sintéticas aisladas; no demuestra que el contador de intentos esté implementado en staging.

**Decisión técnica:** no activar correo ni introducir cambios en la función real de tokens sin autorización específica. El guard de 72 bytes ya aplicado a staging permanece vigente. Las próximas tareas de interfaz comercial pueden avanzar en una rama separada sin depender de la activación del correo.
