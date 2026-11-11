#!/usr/bin/env python3
"""Real local GoTrue flows; localhost only, fake addresses, no hosted project."""
import base64, hashlib, hmac, json, os, time, urllib.error, urllib.request
AUTH="http://127.0.0.1:9999"
MAIL="http://127.0.0.1:8025/api/v1/messages"
KEY="g4-local-only-synthetic-jwt-secret-32-bytes-minimum"
def request(url,method="GET",data=None,token=None):
    assert url.startswith((AUTH,MAIL)), "external URL prohibited"
    headers={"Content-Type":"application/json"}
    if token: headers["Authorization"]="Bearer "+token
    body=None if data is None else json.dumps(data).encode()
    req=urllib.request.Request(url,data=body,headers=headers,method=method)
    try:
        with urllib.request.urlopen(req,timeout=8) as r:
            return r.status,json.load(r)
    except urllib.error.HTTPError as e:
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
for _ in range(35):
    try:
        s,_=request(AUTH+"/health")
        if s==200: break
    except Exception: pass
    time.sleep(2)
else: raise AssertionError("local GoTrue did not become healthy")
assert count()==0, "Mailpit not empty"
def case(label,endpoint,body,token=None):
    before=count()
    status,response=request(AUTH+endpoint,"POST",body,token)
    assert status in (200,201),f"{label} status={status}, response={response}"
    for _ in range(20):
        if count()>before: break
        time.sleep(.5)
    assert count()==before+1,f"{label}: expected exactly one captured message"
    print("PASS local GoTrue "+label+" -> one Mailpit message")
case("confirmation","/signup",{"email":"confirm@example.invalid","password":"G4SyntheticPassword!123"})
case("recovery","/recover",{"email":"confirm@example.invalid"})
case("OTP","/otp",{"email":"otp@example.invalid","create_user":True})
case("invitation","/invite",{"email":"invite@example.invalid"},jwt())
assert count()==4
print("PASS all four real local GoTrue API email flows, internal SMTP capture only")
print("LIMIT: no link redemption, token expiry or external egress packet audit")
