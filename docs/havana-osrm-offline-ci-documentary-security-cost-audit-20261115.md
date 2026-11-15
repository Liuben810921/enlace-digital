# Auditoría documental de CI sintético offline — 2026-11-15

**Repositorio:** Liuben810921/enlace-digital  
**Rama:** plan/havana-osrm-benchmark-offline-20261114  
**Base verificada:** 11ea1d27d7441e846f5039c173ca4acae76f78b5  
**Estado:** exclusivamente documental; no se creó ni activó workflow.

## Evidencia del repositorio

Se recuperó la propuesta previa `docs/havana-osrm-120-tests-clean-linux-reproducibility-ci-proposal-20261115.md` (Git blob `f1571ad066146bdb8957d22c18ac723729f0f21e`), `synthetic_gate.py` (blob `04d3e7261f01ce9c0b82b8fae1cd9f5507b8fa5e`) y `test_process_limits.py` (blob `8ef2a6aa15ddf96de5ec23fe118e32b2f83df369`). No se modificaron. La regresión previa de 120/120 normal y 120/120 optimizada está documentada, pero **no se volvió a ejecutar en esta auditoría documental**.

## Hallazgos y decisiones

1. **Acciones de terceros.** La propuesta usa `actions/checkout@v4` y `actions/setup-python@v5`, referencias por etiquetas móviles. Para una implementación futura, evaluar el nuevo mecanismo oficial de *workflow dependency lockfiles* (incluye identidad del repositorio y dependencias transitivas); si no se adopta, fijar cada acción a un SHA completo comprobado directamente en el repositorio oficial. No inventar SHA ni trasladar etiquetas sin revisión. GitHub ya documenta checkout y setup-python v7; las versiones de la propuesta no deben darse por actuales.
2. **Permisos.** Mantener `permissions: {contents: read}` a nivel de workflow, sin `id-token: write`, `actions: write`, secretos, despliegues ni token personal. Para checkout, usar `persist-credentials: false` cuando no se requiera Git autenticado posteriormente. No usar `pull_request_target` ni `workflow_run` con código no confiable.
3. **Disparadores.** `workflow_dispatch` en la propuesta permitiría activación manual si se instalara. Como esta fase prohíbe activar workflows, **no instalar ninguno**. En una etapa autorizada, elegir disparadores explícitos restringidos a rama y rutas de pruebas, con revisión independiente del efecto sobre otros workflows.
4. **Concurrency.** Definir grupo exclusivo, p. ej. `ed-havana-osrm-offline-${{ github.ref }}`, con `cancel-in-progress: false`. No reutilizar grupos de CI existentes. La semántica de cola puede reemplazar ejecuciones pendientes; verificar política antes de instalar.
5. **Tiempo y sistema.** `runs-on: ubuntu-24.04`, `timeout-minutes: 5`, `python-version: '3.13'` explícito. Los cinco ensayos de `RLIMIT_AS` requieren Linux; fallar si se omiten en lugar de contabilizar como éxito. La versión local probada fue Python 3.13.5; el parche del runner puede diferir. No se ha verificado un runner nuevo.
6. **Costos.** GitHub indica que runners estándar GitHub-hosted son gratuitos en repositorios públicos; los privados utilizan cuota incluida y pueden generar cargos si se excede. La documentación vigente expresa GitHub Free como **USD 12 de cómputo incluido por mes** (no un número fijo de minutos), con tarifas según tipo de runner. No se ha confirmado visibilidad, plan, método de pago, consumo ni presupuesto de esta cuenta. Por tanto, **costo cero no está certificado**. No usar larger runners, artefactos, caches ni matrices innecesarias.
7. **Seguridad de la propuesta.** El ejemplo anterior de YAML no está listo para instalar: etiquetas móviles, disparador manual y ausencia de grupo de concurrencia. Se recomienda no modificar `.github/workflows/` en esta etapa.

## Diseño objetivo futuro (texto, NO archivo ejecutable)

- Trigger restringido a rama aislada y cambios en `experiments/havana-osrm-portable/**`, solo tras autorización.
- Permisos globales `contents: read`.
- Concurrency exclusiva para este experimento; evitar `cancel-in-progress: true` sin necesidad.
- Runner estándar `ubuntu-24.04`; un solo job con timeout de cinco minutos.
- Checkout con credenciales no persistentes; acciones fijadas mediante lockfile oficial o SHA completo auditado.
- Python 3.13 explícito, sin pip install ni dependencias externas.
- `python -I -m unittest discover -s . -p 'test_*.py' -q` y variante `python -I -O ...`.
- Comprobación del número esperado de pruebas y de ausencia de omisiones (un resultado OK con skips no equivale a 120/120).
- Sin secretos, artefactos, cachés, despliegues, OSRM, cartografía ni habilitación comercial.

## Fuentes oficiales consultadas

- https://docs.github.com/en/actions/concepts/security/workflow-dependency-lockfiles
- https://docs.github.com/en/enterprise-cloud@latest/actions/reference/security/secure-use
- https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax
- https://docs.github.com/en/actions/reference/limits
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
- https://github.com/actions/checkout/blob/main/README.md
- https://github.com/actions/setup-python/blob/main/README.md

## Límites y bloqueantes

No se ha consultado la facturación privada del propietario, ni verificado visibilidad real del repositorio o saldo disponible. No se ha instalado, activado ni ejecutado GitHub Actions; no hay resultados nuevos de CI. La autenticidad de datos y cobertura geográfica permanecen sin verificar. `commercial_approval=false` y `commercial_quote_enabled=false` siguen siendo condiciones obligatorias. Se mantiene la prohibición de cartografía, OSRM, cuentas, costos y acceso a Supabase, staging y producción.
