#!/usr/bin/env python3
"""Static, offline checks for the ST-01..ST-12 plan; no network, SQL or credentials."""
from pathlib import Path

plan = Path("docs/st01-st12-plan-definitivo-ejecucion-controlada-2026-11-10.md").read_text()
previous = Path("docs/plan-validacion-integrada-seguridad-staging-2026-11-10.md").read_text()
edge = Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text()
workflow = Path(".github/workflows/staging-edge-draft-security.yml").read_text()
required = [
    "xqahthghvozeigbojhyi", "ubrvuplslconfxwpfzxj",
    "G0 Autorización", "G1 Entorno", "G2 Efectos externos",
    "G3 Datos", "G4 Autenticación", "G5 Aislamiento",
    "G6 Presupuesto", "G7 Evidencia",
    "ROLLBACK", "NO-GO", "BLOCKED", "NOT RUN",
    "correo", "pagos", "pedidos", "limpieza", "15 minutos",
    "2 clientes ficticios", "2 solicitudes simultáneas",
    "429", "service_role", "verify_jwt=false",
    "no se proporciona aquí ningún número telefónico",
    "0 Edge Functions desplegadas",
]
for term in required:
    assert term in plan, f"Missing plan safety requirement: {term}"
for n in range(1, 13):
    assert f"| ST-{n:02d} |" in plan, f"Missing ST-{n:02d} acceptance case"
assert "ST-01" in previous and "ST-12" in previous
assert "ED_STAGING_CUSTOMER_AUTH_ENABLED" in edge
assert 'expectedProject="xqahthghvozeigbojhyi"' in edge
assert "offline-edge-tests" in workflow
assert "staging-edge-draft-security" in workflow
assert "NO EJECUTADOS en staging" in plan
print("ST-01..ST-12 offline plan gates PASS (12 cases, 8 gates, zero network)")
