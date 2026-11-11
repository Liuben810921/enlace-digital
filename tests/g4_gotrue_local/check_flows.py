#!/usr/bin/env python3
"""Real isolated GoTrue flows; internal Docker DNS, fake addresses, no hosted project."""
import base64, hashlib, hmac, json, os, time, urllib.error, urllib.request, urllib.parse
AUTH="http://auth:9999"
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise AssertionError("HTTP redirect prohibited in isolated test client")
OPENER=urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
MAIL="http://mailpit:8025/api/v1/messages"
KEY="g4-local-only-synthetic-jwt-secret-32-bytes-minimum"
# Assert the synthetic API client has no external default route.
with open("/proc/net/route", encoding="ascii") as route_table:
    routes=route_table.read().splitlines()[1:]
assert not any(line.split()[1]=="00000000" for line in routes if len(line.split())>=2), "client has an IPv4 default route"
# Docker can expose a kernel IPv6 reject/placeholder default route even on
# internal-only networks. A raw /proc/net/ipv6_route zero-prefix match is not
# evidence of IPv6 egress; do not incorrectly fail or claim an IPv6 audit.
print("PASS synthetic test client has no default IPv4 route", flush=True)
print("LIMIT: IPv6 egress is not independently verified by this route check", flush=True)
def request(url,method="GET",data=None,token=None):
    parsed=urllib.parse.urlsplit(url)
    try:
        destination=(parsed.scheme, parsed.hostname, parsed.port)
    except ValueError as exc:
        raise AssertionError("malformed destination prohibited") from exc
    assert destination in {("http","auth",9999),("http","mailpit",8025)}, "external URL prohibited"
    assert parsed.username is None and parsed.password is None, "URL credentials prohibited"
    headers={"Content-Type":"application/json"}
    if token: headers["Authorization"]="Bearer "+token
    body=None if data is None else json.dumps(data).encode()
    req=urllib.request.Request(url,data=body,headers=headers,method=method)
    try:
        with OPENER.open(req,timeout=8) as r:
            return r.status,json.load(r)
    except urllib.error.HTTPError as e:
        if 300 <= e.code < 400:
            raise AssertionError("HTTP redirect prohibited in isolated test client")
        return e.code,json.loads(e.read().decode() or "{}")
def jwt():
    enc=lambda b:base64.urlsafe_b64encode(b).rstrip(b"=").decode()
    head=enc(b'{"alg":"HS256","typ":"JWT"}')
    payload=enc(json.dumps({"role":"service_role","iss":"supabase","iat":int(time.time()),"exp":int(time.time())+600}).encode())
    sig=enc(hmac.new(KEY.encode(),f"{head}.{payload}".encode(),hashlib.sha256).digest())
    return f"{head}.{payload}.{sig}"
def count():
    status,payload=request(MAIL)
    assert status==200,(status,payload)
    return len(payload.get("messages",[]))
for prohibited in ("https://example.com", "http://auth:9999.evil.invalid/health", "http://mailpit:8025.evil.invalid/api/v1/messages", "http://127.0.0.1:9999/health"):
    try:
        request(prohibited)
    except AssertionError:
        pass
    else:
        raise AssertionError("external URL guard bypassed: " + prohibited)
print("PASS outbound URL allowlist rejects external, lookalike and host-loopback targets", flush=True)
last_health_error = "no response"
for attempt in range(35):
    try:
        s, health = request(AUTH+"/health")
        if s == 200 and isinstance(health, dict) and health.get("name") == "GoTrue":
            print("PASS local GoTrue health:", health.get("version", "unknown"))
            break
        last_health_error = f"status={s}, name={health.get('name') if isinstance(health, dict) else 'not-json-object'}"
    except Exception as exc:
        last_health_error = f"{type(exc).__name__}: {str(exc)[:180]}"
    if attempt in (0, 4, 14, 34):
        print(f"GoTrue health attempt {attempt + 1}: {last_health_error}", flush=True)
    time.sleep(2)
else:
    raise AssertionError("local GoTrue did not become healthy: " + last_health_error)
assert count()==0, "Mailpit not empty"
def case(label,endpoint,body,token=None):
    prior_status, prior_mailbox=request(MAIL)
    assert prior_status==200
    prior_ids={m["ID"] for m in prior_mailbox.get("messages",[])}
    before=len(prior_ids)
    status,response=request(AUTH+endpoint,"POST",body,token)
    assert status in (200,201),f"{label} status={status}, response={response}"
    for _ in range(20):
        if count()>before: break
        time.sleep(.5)
    assert count()==before+1,f"{label}: expected exactly one captured message"
    mail_status, mailbox=request(MAIL)
    assert mail_status==200, (label,mail_status)
    messages=mailbox.get("messages",[])
    expected=body["email"].lower()
    matched=[m for m in messages if m["ID"] not in prior_ids and expected in json.dumps(m.get("To",[])).lower()]
    assert len(matched)==1, f"{label}: expected one message addressed to synthetic recipient {expected}"
    print("PASS local GoTrue "+label+" -> one Mailpit message addressed to expected synthetic recipient")
case("confirmation","/signup",{"email":"confirm@example.invalid","password":"G4SyntheticPassword!123"})
case("recovery","/recover",{"email":"confirm@example.invalid"})
case("OTP","/otp",{"email":"otp@example.invalid","create_user":True})
case("invitation","/invite",{"email":"invite@example.invalid"},jwt())
assert count()==4
print("PASS all four real local GoTrue API email flows, internal SMTP capture only")
print("LIMIT: no link redemption, token expiry or external egress packet audit")
