#!/usr/bin/env python3
"""Runs against a DISPOSABLE PostgreSQL only. Requires local psql and PG* env.
Never run against Supabase, staging or production.
"""
import os, subprocess, shutil, concurrent.futures, time
from pathlib import Path
ROOT=Path(__file__).resolve().parent
def run(sql, timeout=25):
    p=subprocess.run(['psql','-X','-v','ON_ERROR_STOP=1','-At','-c',sql],capture_output=True,text=True,timeout=timeout,env=os.environ)
    if p.returncode: raise RuntimeError(p.stderr)
    return p.stdout.strip()
def main():
    if not shutil.which('psql'): raise SystemExit('BLOCKED: local psql executable unavailable')
    if os.environ.get('ED_DISPOSABLE_PG_CONFIRMED')!='YES': raise SystemExit('BLOCKED: set ED_DISPOSABLE_PG_CONFIRMED=YES only for a disposable local DB')
    host=os.environ.get('PGHOST','')
    if host not in ('localhost','127.0.0.1','/var/run/postgresql'):
        raise SystemExit('BLOCKED: PGHOST must be local; remote Supabase prohibited')
    for file in ('001_geoapify_ledger.sql','003_geoapify_minute_budget.sql','005_geoapify_lifecycle.sql','007_geoapify_replay_dispatch_guard.sql','009_geoapify_gateway_contract.sql','002_geoapify_ledger_tests.sql','004_geoapify_quota_tests.sql','006_geoapify_lifecycle_tests.sql','008_geoapify_guard_tests.sql','010_geoapify_gateway_contract_tests.sql','011_geoapify_trusted_context_lock.sql','012_geoapify_trusted_context_tests.sql','015_geoapify_outbox_clean.sql','014_geoapify_dispatch_outbox_tests.sql','016_geoapify_outbox_recovery_tests.sql','017_geoapify_claim_context_quarantine.sql','018_geoapify_claim_context_tests.sql','019_geoapify_final_send_gate.sql','020_geoapify_final_send_gate_tests.sql'):
        p=subprocess.run(['psql','-X','-v','ON_ERROR_STOP=1','-f',str(ROOT/file)],capture_output=True,text=True,timeout=30)
        if p.returncode: raise RuntimeError(p.stderr)
        print('PASS',file)
    day="(now() AT TIME ZONE 'UTC')::date"
    key='operation-concurrent-0001'
    q=lambda h:f"SELECT reason FROM geoapify_disposable.reserve('synthetic-user','{key}',repeat('{h}',64),1,{day})"
    def first():
        return run('BEGIN; '+q('a')+'; SELECT pg_sleep(2); COMMIT;',timeout=20)
    def second():
        time.sleep(.3)
        return run(q('a'),timeout=20)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        a=pool.submit(first); b=pool.submit(second); av=a.result();bv=b.result()
    if 'RESERVED' not in av or 'REPLAY_RESERVED' not in bv: raise AssertionError((av,bv))
    n=run(f"SELECT count(*),sum(credits) FROM geoapify_disposable.reservation WHERE principal='synthetic-user' AND operation_id='{key}'")
    if n!='1|1': raise AssertionError(n)
    conflict=run(q('b'))
    if 'IDEMPOTENCY_CONFLICT' not in conflict: raise AssertionError(conflict)
    lookup=run(f"SELECT matched FROM geoapify_disposable.lookup('synthetic-user','{key}',repeat('a',64))")
    if lookup!='t': raise AssertionError(lookup)
    print('PASS two-session serialization / replay / single debit / hash conflict / lookup')
if __name__=='__main__': main()
