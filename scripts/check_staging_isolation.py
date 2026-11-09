"""Read-only static contracts for staging Edge customer isolation and sequence readiness."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
edge = (root / "supabase/functions/enlace-cliente-auth-staging/index.ts").read_text()
schema = (root / "sql/propuestas/staging_esquema_unico_v4_no_ejecutar.sql").read_text()
rpc = (root / "sql/propuestas/staging_rpc_unico_v4_no_ejecutar.sql").read_text()

assert edge.count('db.rpc("ed_cliente_sesion_privada"') >= 4
assert 'const expectedProject="xqahthghvozeigbojhyi"' in edge
assert 'ED_STAGING_CUSTOMER_AUTH_ENABLED' in edge
assert "cliente_numero:customer.numero" in edge
assert "cliente_numero:customer.numero" in edge
assert '.update(record).eq("id",id).eq("cliente_numero",customer.numero)' in edge
assert '.eq("id",found.id).eq("cliente_numero",customer.numero)' in edge
assert '.select("id").eq("cliente_numero",customer.numero)' in edge
assert '.eq("cliente_numero",data.numero).order(' in edge
assert edge.count('.eq("cliente_numero",data.numero).order(') == 2
assert edge.count('.eq("cliente_numero",customer.numero)') == 3
for table in ("clientes_destinatarios", "clientes_direcciones_entrega"):
    assert f'CREATE TABLE IF NOT EXISTS public.{table}' in schema
    assert f'ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;' in schema
    assert f'cliente_numero integer NOT NULL REFERENCES public.clientes_oficiales(numero)' in schema
    assert f'db.from("{table}")' in edge
assert rpc.count("SECURITY DEFINER SET search_path TO ''") == 5
assert rpc.count("IF p_token_hash IS NULL OR p_token_hash !~") == 2
assert "CREATE SEQUENCE IF NOT EXISTS public.clientes_oficiales_numero_seq AS integer START WITH 1;" in schema
assert "nextval('public.clientes_oficiales_numero_seq')" in rpc
# No automatic setval/seed step exists: this is a documented deployment blocker.
assert not re.search(r"\bsetval\s*\(", schema, re.I)
print("Static recipient/delivery ownership and sequence readiness checks PASS")
print("BLOCKER: sequence START WITH 1 requires an approved collision-safe initialization before migration")
