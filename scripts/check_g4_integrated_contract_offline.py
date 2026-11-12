#!/usr/bin/env python3
"""G4 offline contract gate: read only repository source, never connect to staging."""
from pathlib import Path
import re
src=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text()
tests=Path("tests/edge_auth_mock_test.ts").read_text()
checks={
 "staging project pin":'const expectedProject="xqahthghvozeigbojhyi"' in src,
 "disabled unless explicitly enabled":'ED_STAGING_CUSTOMER_AUTH_ENABLED' in src and '=== "true"' in src.replace('==="true"','=== "true"'),
 "service key server only":'SUPABASE_SERVICE_ROLE_KEY' in src,
 "public key is not identity":'sameKey(req.headers.get("apikey")' in src,
 "token validated by hash":'ed_cliente_sesion_privada' in src and 'p_token_hash:await sha(token)' in src,
 "recipient edit owner filter":bool(re.search(r'from\("clientes_destinatarios"\)\.update\(record\)\.eq\("id",id\)\.eq\("cliente_numero",customer.numero\)',src)),
 "recipient create owner assigned":'insert({...record,cliente_numero:customer.numero})' in src,
 "recipient list owner filter":bool(re.search(r'from\("clientes_destinatarios"\)\.select\([\s\S]*?\.eq\("cliente_numero",data.numero\)',src)),
 "delivery update owner filter":'.eq("id",found.id).eq("cliente_numero",customer.numero)' in src,
 "delivery dedup owner filter":'.eq("cliente_numero",customer.numero).eq("provincia",province)' in src,
 "delivery insert owner assigned":'insert({cliente_numero:customer.numero' in src,
 "delivery list owner filter":bool(re.search(r'from\("clientes_direcciones_entrega"\)\.select\([\s\S]*?\.eq\("cliente_numero",data.numero\)',src)),
 "Cuba residence address enforced":'residence==="cuba"' in src and 'street.length<8' in src,
 "registration through residence wrapper":'ed_cliente_registrar_residencia_privado' in src,
 "login via privileged RPC":'ed_cliente_login_privado' in src,
 "logout revocation requested":'p_revocar:action==="logout"' in src,
 "body size cap":'total>4096' in src,
 "duplicate JSON keys blocked":'if(keys.has(k))throw Error("duplicate key")' in src,
 "negative cross-owner mocked test":'recipient ownership: successful update remains scoped' in tests,
 "expired/revoked mocked test":'expired and revoked sessions deny protected operations' in tests,
}
for name,ok in checks.items(): print(("PASS" if ok else "FAIL")+" "+name)
if not all(checks.values()): raise SystemExit(1)
print(f"G4 OFFLINE PASS {len(checks)} static gates; not staging integration proof")
