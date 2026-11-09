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
# Cross-file compatibility: Edge columns must exist in proposed table definitions.
recipient_columns = ("id","cliente_numero","nombre","telefono","provincia","municipio","barrio","direccion","referencias","creado_en")
delivery_columns = ("id","cliente_numero","nombre_receptor","telefono_receptor","provincia","municipio","barrio","direccion","referencias","usado_en","distancia_km","punto_salida_id","ruta_version","calculado_en")
def table_definition(table):
    start = schema.index("CREATE TABLE IF NOT EXISTS public." + table + " (")
    end = schema.index("\n);", start)
    return schema[start:end]
for table, columns in (("clientes_destinatarios",recipient_columns),("clientes_direcciones_entrega",delivery_columns)):
    definition = table_definition(table)
    for column in columns:
        assert re.search(r"\b" + column + r"\s+(?:bigint|integer|text|timestamptz|numeric)", definition) or (column == "id" and "id bigint GENERATED ALWAYS AS IDENTITY" in definition), (table,column)
# Every SECURITY DEFINER RPC must be restricted by the proposal's privilege block.
assert rpc.count("CREATE OR REPLACE FUNCTION public.ed_cliente_") == 5
assert "FROM PUBLIC,anon,authenticated;" in rpc and "TO service_role;" in rpc
assert "REVOKE ALL ON public.clientes_destinatarios,public.clientes_direcciones_entrega FROM PUBLIC,anon,authenticated;" in schema
assert "ALTER TABLE public.clientes_destinatarios ENABLE ROW LEVEL SECURITY;" in schema
assert "ALTER TABLE public.clientes_direcciones_entrega ENABLE ROW LEVEL SECURITY;" in schema
# Migration contracts: repeated application must not blindly add CHECK.
assert "DO $guard$" in schema
assert "FROM pg_catalog.pg_constraint" in schema
assert "conname='ed_cliente_cuba_direccion_ck'" in schema
assert schema.count("ADD CONSTRAINT ed_cliente_cuba_direccion_ck") == 1
# A name-only guard is not a proof that an existing CHECK has the same
# definition or validation status. Keep this a deployment preflight requirement.
assert "conrelid='public.clientes_oficiales'::pg_catalog.regclass" in schema
assert "conname='ed_cliente_cuba_direccion_ck'" in schema
assert "NOT VALID;" in schema
assert "VALIDATE CONSTRAINT ed_cliente_cuba_direccion_ck" not in schema

assert "GRANT SELECT,INSERT,UPDATE ON public.clientes_destinatarios,public.clientes_direcciones_entrega TO service_role;" in schema
assert "GRANT USAGE,SELECT ON SEQUENCE public.clientes_destinatarios_id_seq,public.clientes_direcciones_entrega_id_seq TO service_role;" in schema
assert "REVOKE ALL ON SEQUENCE public.clientes_destinatarios_id_seq,public.clientes_direcciones_entrega_id_seq FROM PUBLIC,anon,authenticated;" in schema
# Internal registration helper must not be callable directly by service_role.
privileges = rpc[rpc.index('-- No public client role may invoke'):]
grant_block = privileges[privileges.index('GRANT EXECUTE ON FUNCTION'):privileges.index('TO service_role;')]
assert 'public.ed_cliente_registrar_privado(text,text,text,text)' not in grant_block
assert 'public.ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text)' in grant_block
# Post-install SQL test must assert effective grants for all five RPCs.
tests = Path("sql/pruebas/staging_registro_sesiones_rollback_ejecutable_tras_aprobacion.sql").read_text()
for signature in (
    "ed_cliente_registrar_privado(text,text,text,text)",
    "ed_cliente_registrar_residencia_privado(text,text,text,text,text,text,text,text,text)",
    "ed_cliente_login_privado(text,text,text)",
    "ed_cliente_sesion_privada(text,boolean)",
    "ed_cliente_direccion_privada(text,text,text,text,text)",
):
    assert signature in tests
assert "FAIL public RPC permissions" in tests
assert "FAIL service role RPC permissions" in tests
assert rpc.count("SECURITY DEFINER SET search_path TO ''") == 5
assert rpc.count("IF p_token_hash IS NULL OR p_token_hash !~") == 2
assert "CREATE SEQUENCE IF NOT EXISTS public.clientes_oficiales_numero_seq AS integer START WITH 1;" in schema
assert "nextval('public.clientes_oficiales_numero_seq')" in rpc
# Migration must stop before CREATE SEQUENCE if live staging state drifted.
assert schema.index("LOCK TABLE public.clientes_oficiales IN SHARE ROW EXCLUSIVE MODE;") < schema.index("DO $preflight$")
assert schema.index("DO $preflight$") < schema.index("CREATE SEQUENCE IF NOT EXISTS public.clientes_oficiales_numero_seq")
assert "IF EXISTS (SELECT 1 FROM public.clientes_oficiales) THEN" in schema
assert "pg_catalog.to_regclass('public.clientes_oficiales_numero_seq') IS NOT NULL" in schema
assert "Existing Cuba address constraint requires manual definition review" in schema
assert schema.count("CREATE SEQUENCE IF NOT EXISTS public.clientes_oficiales_numero_seq AS integer START WITH 1;") == 1
assert "REVOKE ALL ON SEQUENCE public.clientes_oficiales_numero_seq FROM PUBLIC,anon,authenticated;" in schema
assert "GRANT USAGE,SELECT ON SEQUENCE public.clientes_oficiales_numero_seq TO service_role;" in schema
assert not re.search(r"\bsetval\s*\(", schema, re.I)
print("Static recipient/delivery ownership and sequence readiness checks PASS")
print("PREFLIGHT REQUIRED: recheck staging empty and sequence absent immediately before approved migration")
