#!/usr/bin/env python3
"""Offline structural guard for staging GitHub Actions trigger coverage and CI evidence."""
from pathlib import Path
s=Path(".github/workflows/staging-auth-static-check.yml").read_text(encoding="utf-8")
d=Path("docs/diagnostico-visibilidad-github-actions-2026-11-10.md").read_text(encoding="utf-8")
assert "  push:" in s and "  pull_request:" in s and "  workflow_dispatch:" in s
assert "branches: [audit/registro-staging-aislado-20261109]" in s
assert "branches: [main]" in s
assert s.count("      - '.github/workflows/staging-auth-static-check.yml'")==2
assert s.count("      - 'docs/diagnostico-visibilidad-github-actions-2026-11-10.md'")==2
assert "runs-on: ubuntu-latest" in s
assert "python3 scripts/check_staging_incremental_dedup_bigint_spec.py" in s
for n in range(1,11):
    assert f"GHA{n:02d}" in d, f"Missing GHA{n:02d}"
for marker in ("pull_request", "primera página", "push", "workflow_dispatch",
               "NO VERIFICADO", "NO-GO", "Reversión", "run_id", "head_sha"):
    assert marker in d, f"Missing CI diagnostic safeguard: {marker}"
print("PASS: GitHub Actions triggers, path filters, job and 10 CI diagnostic gates")
print("NOTE: no claim of run success; no network, Supabase, SQL or deployment")
