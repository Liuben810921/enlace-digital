#!/usr/bin/env python3
"""Real isolated GoTrue flows; internal Docker DNS, fake addresses, no hosted project."""
import base64, hashlib, hmac, html, json, os, re, time, urllib.error, urllib.request, urllib.parse
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

# Negative control: a second attempt to use a syntactically invalid destination
# must be rejected before any network request, even when the host is internal.
for malformed in ("http://auth:notaport/health", "http://mailpit:65536/api/v1/messages"):
    try:
        request(malformed)
    except AssertionError:
        pass
    else:
        raise AssertionError("malformed port accepted: " + malformed)
print("PASS malformed internal destination ports rejected", flush=True)

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

# Negative authentication controls against real local GoTrue. Invalid tokens
# must not gain service-role permissions or emit invitation emails.
def invalid_invite(label,token):
    before=count()
    status,response=request(AUTH+"/invite","POST",{"email":"blocked-"+label+"@example.invalid"},token)
    assert status in (400,401,403), f"{label}: invalid token unexpectedly accepted (status {status})"
    assert count()==before, f"{label}: invalid token caused an email"
    print("PASS local GoTrue rejected "+label+" service token without sending email", flush=True)
invalid_invite("unsigned","not.a.jwt")
valid_jwt=jwt()
parts=valid_jwt.split(".")
assert len(parts)==3
# Mutate the first signature character, guaranteeing changed decoded signature bytes.
tampered_signature=("A" if parts[2][0]!="A" else "B")+parts[2][1:]
invalid_invite("tampered",parts[0]+"."+parts[1]+"."+tampered_signature)
# Validly signed but expired token must not gain administrative invite rights.
def signed_jwt_with_exp(expiration):
    enc=lambda b:base64.urlsafe_b64encode(b).rstrip(b"=").decode()
    head=enc(b'{"alg":"HS256","typ":"JWT"}')
    payload=enc(json.dumps({"role":"service_role","iss":"supabase","iat":int(time.time())-3600,"exp":expiration}).encode())
    signature=enc(hmac.new(KEY.encode(),f"{head}.{payload}".encode(),hashlib.sha256).digest())
    return f"{head}.{payload}.{signature}"
invalid_invite("expired",signed_jwt_with_exp(int(time.time())-120))

# Exercise GoTrue's actual verification endpoint with synthetic invalid tokens.
# These requests cannot consume a real link, issue a session, or send mail.
def reject_invalid_verification(label,body):
    before=count()
    status,response=request(AUTH+"/verify","POST",body)
    assert status in (400,401,403,404,422), f"{label}: invalid verification accepted (status {status})"
    assert not (isinstance(response,dict) and response.get("access_token")), f"{label}: session issued for invalid token"
    assert count()==before, f"{label}: invalid verification sent mail"
    print("PASS GoTrue rejected "+label+" verification without session or email",flush=True)
reject_invalid_verification("fabricated signup token",{"type":"signup","token_hash":"0"*64})
reject_invalid_verification("fabricated recovery token",{"type":"recovery","token_hash":"f"*64})
reject_invalid_verification("fabricated invite token",{"type":"invite","token_hash":"a"*64})
# Redeem an authentic signup link captured from the local Mailpit API.
# Never print the link, token, redirect Location, response body or session.
def raw_local(url):
    parsed=urllib.parse.urlsplit(url)
    assert (parsed.scheme,parsed.hostname,parsed.port)==("http","auth",9999), "non-local redemption target"
    assert parsed.path=="/verify" and not parsed.username and not parsed.password
    req=urllib.request.Request(url,method="GET")
    try:
        with OPENER.open(req,timeout=8) as response:
            return response.status,response.headers.get("Location","")
    except urllib.error.HTTPError as exc:
        # NoRedirect refuses redirects; urllib exposes them as HTTPError.
        return exc.code,exc.headers.get("Location","")
def local_signup_link():
    status,listing=request(MAIL)
    assert status==200
    for item in listing.get("messages",[]):
        if "confirm@example.invalid" not in json.dumps(item.get("To",[])).lower():
            continue
        mid=item["ID"]
        assert re.fullmatch(r"[A-Za-z0-9_-]+",mid), "unexpected Mailpit message ID"
        status,detail=request("http://mailpit:8025/api/v1/message/"+mid)
        assert status==200
        body=html.unescape(str(detail.get("Text",""))+" "+str(detail.get("HTML","")))
        # Only accept a URL pointing to the local GoTrue verification endpoint.
        for candidate in re.findall(r"https?://[^\\s<>]+",body):
            candidate=candidate.rstrip(chr(34)+chr(39)+".,);")
            parsed=urllib.parse.urlsplit(candidate)
            if parsed.path!="/verify" or parsed.hostname not in ("127.0.0.1","localhost"):
                continue
            query=urllib.parse.parse_qs(parsed.query)
            if query.get("type")!=["signup"] or not query.get("token"):
                continue
            return AUTH+"/verify?"+parsed.query
    raise AssertionError("Mailpit signup verification link not found")
signup_link=local_signup_link()
first_status,first_location=raw_local(signup_link)
assert first_status in (200,302,303), f"first signup redemption status={first_status}"
assert "error=" not in first_location.lower() and "error_code=" not in first_location.lower(), "first signup redemption returned error"
print("PASS authentic Mailpit signup verification link redeemed locally",flush=True)
replay_status,replay_location=raw_local(signup_link)
assert replay_status in (400,401,403,404,422) or (
    replay_status in (302,303) and ("error=" in replay_location.lower() or "error_code=" in replay_location.lower())
), f"signup link replay not rejected (status={replay_status})"
print("PASS redeemed signup verification link rejected on replay",flush=True)
print("LIMIT: recovery/invite redemption, link expiry and external egress packet audit remain unverified")
