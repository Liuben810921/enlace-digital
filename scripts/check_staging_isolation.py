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
# Each contract is checked in the relevant route, not elsewhere in the file.
def route(source, action, following):
    begin = source.index('if(action==="' + action + '")')
    finish = source.index(following, begin)
    return source[begin:finish]

def assert_owner_contract(source):
    recipient = route(source, "recipient-save", 'if(action==="session"')
    location = route(source, "delivery-location-save", 'if(action==="recipient-save"')
    profile = source[source.index('if(action==="session"||action==="logout"||action==="profile")'):source.index('return reply(400,{error:"Operacion no disponible"})')]
    assert '.update(record).eq("id",id).eq("cliente_numero",customer.numero)' in recipient
    assert '.insert({...record,cliente_numero:customer.numero})' in recipient
    assert '.eq("id",found.id).eq("cliente_numero",customer.numero)' in location
    assert '.select("id").eq("cliente_numero",customer.numero)' in location
    assert '.insert({cliente_numero:customer.numero,' in location
    assert profile.count('.eq("cliente_numero",data.numero).order(') == 2

assert_owner_contract(edge)
# Mutation testing: the very same contract must fail on each unsafe variant.
mutations = (
    ('.update(record).eq("id",id).eq("cliente_numero",customer.numero)',
     '.update(record).eq("id",id)'),
    ('.insert({...record,cliente_numero:customer.numero})',
     '.insert({...record,cliente_numero:Number(body.cliente_numero)})'),
    ('.eq("id",found.id).eq("cliente_numero",customer.numero)',
     '.eq("id",found.id)'),
    ('.select("id").eq("cliente_numero",customer.numero)',
     '.select("id")'),
    ('.insert({cliente_numero:customer.numero,',
     '.insert({cliente_numero:Number(body.cliente_numero),'),
    ('.eq("cliente_numero",data.numero).order(',
     '.order('),
)
for safe, unsafe in mutations:
    assert safe in edge, "Mutation target missing"
    mutated = edge.replace(safe, unsafe, 1)
    assert mutated != edge
    try:
        assert_owner_contract(mutated)
    except AssertionError:
        pass
    else:
        raise AssertionError("Unsafe mutation escaped owner checks: " + safe)

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
