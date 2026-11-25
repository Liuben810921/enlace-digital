#!/usr/bin/env python3
"""Synthetic-only PostgreSQL NORM-v1 check; requires a disposable local Docker container.
Never reads external databases, credentials, tables, or Supabase.
"""
import json,subprocess,sys
from pathlib import Path
data=json.loads(Path("tests/fixtures/norm_v1_utf8_vectors.json").read_text(encoding="utf-8"))
ws=sorted(int(x,16) for x in data["unicode_whitespace_hex"])
assert len(data["cases"])==30 and len(ws)==25
sql=r"""
CREATE OR REPLACE FUNCTION pg_temp.norm_v1(s text) RETURNS text
LANGUAGE plpgsql AS $fn$
DECLARE t text; c text; n int; o text := ''; pending boolean := false; i integer;
BEGIN
 t := normalize(s,NFC);
 FOR i IN 1..char_length(t) LOOP
  c := substr(t,i,1); n := ascii(c);
  IF n = ANY(ARRAY[9,10,11,12,13,32,133,160,5760,8192,8193,8194,8195,8196,8197,8198,8199,8200,8201,8202,8232,8233,8239,8287,12288]) THEN
    pending := char_length(o)>0;
  ELSIF n=8203 OR n=65279 OR (n<32) OR (n>=127 AND n<=159) THEN
    RAISE EXCEPTION 'invalid codepoint';
  ELSE
    IF pending THEN o:=o||' '; END IF;
    o:=o||c; pending:=false;
  END IF;
 END LOOP;
 RETURN o;
END $fn$;
CREATE TEMP TABLE synthetic_results(case_id text, result text);
"""
# SQL contains only synthetic hex literals, never names, addresses, IDs or credentials.
for case in data["cases"]:
    raw=case["input"]
    if any(0xD800<=ord(c)<=0xDFFF for c in raw):
        # Invalid Unicode scalar values cannot be encoded as UTF-8 and cannot be sent to PostgreSQL.
        # Record transport-layer rejection; do not silently replace them.
        assert case.get("reject"),case["id"]
        continue
    h=raw.encode("utf-8").hex()
    ident=case["id"]
    sql+=f"""DO $case$ BEGIN
  BEGIN
    INSERT INTO synthetic_results VALUES ('{ident}',encode(convert_to(pg_temp.norm_v1(convert_from(decode('{h}','hex'),'UTF8')),'UTF8'),'hex'));
  EXCEPTION WHEN others THEN
    INSERT INTO synthetic_results VALUES ('{ident}','REJECT');
  END;
END $case$;
"""
sql+="SELECT case_id||'|'||result FROM synthetic_results ORDER BY case_id;\n"
cmd=["docker","exec","-i","ed-norm-v1-pg","psql","-X","-q","-t","-A","-v","ON_ERROR_STOP=1","-U","postgres","-d","postgres"]
p=subprocess.run(cmd,input=sql,text=True,capture_output=True,timeout=90)
if p.returncode:
    print("FAIL: isolated PostgreSQL execution:",p.stderr[-1000:],file=sys.stderr)
    sys.exit(1)
results=dict(line.strip().split("|",1) for line in p.stdout.splitlines() if "|" in line)
for case in data["cases"]:
    if any(0xD800<=ord(c)<=0xDFFF for c in case["input"]):
        continue
    expected="REJECT" if case.get("reject") else case["output_hex"]
    assert results.get(case["id"])==expected,(case["id"],results.get(case["id"]),expected)
assert len(results)==28,len(results)
print("PASS: PostgreSQL synthetic-only 28 transportable fixtures; 2 invalid surrogates rejected at UTF-8 boundary")
print("LIMIT: test only on isolated disposable PostgreSQL; not Supabase or production")
