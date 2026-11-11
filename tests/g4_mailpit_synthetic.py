#!/usr/bin/env python3
"""Synthetic SMTP flows to Mailpit only; no GoTrue/Supabase API is called."""
import json, os, smtplib, urllib.request
from email.message import EmailMessage
from pathlib import Path

host=os.environ.get("G4_MAILPIT_HOST","127.0.0.1")
port=int(os.environ.get("G4_MAILPIT_PORT","1025"))
api=f"http://{host}:8025/api/v1/messages"
cases=("confirmation","recovery","otp","invitation","email_change")
assert host in ("127.0.0.1","localhost"), "Mailpit must be loopback only"
source=Path("supabase/functions/enlace-cliente-auth-staging/index.ts").read_text()
# Fail closed: never allow outbound Supabase Auth/email actions in the staging controller.
for forbidden in ("auth.signUp(", "auth.resetPasswordForEmail(", "auth.signInWithOtp(",
                  "auth.admin.inviteUserByEmail(", "auth.admin.generateLink(",
                  "auth.updateUser(", "auth.admin.inviteUserByEmail(", "sendEmail(",
                  "smtp://", "smtps://"):
    assert forbidden not in source, f"Forbidden outbound/auth path: {forbidden}"
assert 'ED_STAGING_CUSTOMER_AUTH_ENABLED' in source
with smtplib.SMTP(host,port,timeout=5) as smtp:
    for case in cases:
        msg=EmailMessage()
        msg["From"]="synthetic@example.invalid"
        msg["To"]=f"{case}@example.invalid"
        msg["Subject"]=f"G4 SYNTHETIC {case}"
        msg.set_content(f"offline synthetic {case} - no real account")
        smtp.send_message(msg)
with urllib.request.urlopen(api,timeout=5) as response:
    payload=json.load(response)
items=payload.get("messages",[])
subjects=[m.get("Subject","") for m in items]
for case in cases:
    assert subjects.count(f"G4 SYNTHETIC {case}")==1, f"missing or duplicated {case}"
assert len(items)==len(cases),f"unexpected captured messages: {len(items)}"
print("PASS: 5 synthetic flows captured only by loopback Mailpit; forbidden controller calls absent")
print("LIMIT: synthetic SMTP fixtures, NOT actual GoTrue confirmation/OTP/invitation delivery tests")
