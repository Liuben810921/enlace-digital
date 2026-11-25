#!/usr/bin/env python3
"""F6-B8 offline-only privacy specification checks. No SQL, no network."""
from pathlib import Path
s=Path("docs/f6b8-evaluacion-privacidad-especificacion-historica-no-ejecutable-2026-11-10.md").read_text(encoding="utf-8").lower()
for i in range(1,11):
    assert f"b8-{i:02d}" in s,f"missing B8-{i:02d}"
for t in ("no se consultó supabase","no se ejecutó sql","no se leyeron datos de clientes",
          "supressed","suppressed","norm-v1","cliente_numero","provincia","municipio",
          "barrio","direccion","nfc","white_space","utf-8","null","no-go",
          "sin definir","statement_timeout","lock_timeout","read only",
          "mínimo privilegio","no autorizada","git revert","una única consulta"):
    if t=="supressed":continue
    assert t in s,t
assert "no retornar `count(*)`" in s
assert "no se convierte automáticamente" in s
print("PASS F6-B8: 10 privacy gates, fail-closed suppression, NULL/invalid, least privilege, no historical query")
