#!/usr/bin/env python3
"""F5: deterministic, offline, synthetic-only model checks; no SQL, network or Supabase."""
from concurrent.futures import ThreadPoolExecutor
from threading import Lock, Barrier
from pathlib import Path
import json, re, unicodedata

MAX_I8=9223372036854775807
MAX_SAFE=9007199254740991
def norm(s):
    if not isinstance(s,str): raise ValueError("text")
    s=unicodedata.normalize("NFC",s)
    if any((ord(c)<32 and not c.isspace()) or 127<=ord(c)<=159 or c in "\u200b\ufeff" for c in s):
        raise ValueError("control")
    return " ".join(s.split())
def identity(customer,province,municipality,neighborhood,address):
    if not type(customer) is int or not 1<=customer<=2147483647: raise ValueError("customer")
    vals=tuple(norm(s) for s in (province,municipality,neighborhood,address))
    if not 2<=len(vals[0])<=100 or not 2<=len(vals[1])<=100 or len(vals[2])>150 or not 8<=len(vals[3])<=500:
        raise ValueError("address")
    return (customer,"NORM-v1",*vals)
def id_string(v):
    if isinstance(v,str):
        if not re.fullmatch(r"[1-9][0-9]*",v) or len(v)>19 or int(v)>MAX_I8: raise ValueError("id")
        return v
    if type(v) is int and 0<v<=MAX_SAFE: return str(v)
    raise ValueError("unsafe id")
class Model:
    def __init__(self):
        self.lock=Lock();self.rows={};self.next_id=9007199254740993;self.snapshots=[]
    def save(self,token,customer,province,municipality,neighborhood,address,recipient):
        if token!=f"synthetic-session-{customer}": raise PermissionError("session/ownership")
        key=identity(customer,province,municipality,neighborhood,address)
        with self.lock:
            if key in self.rows: return {"id":self.rows[key]["id"],"reused":True}
            value=str(self.next_id);self.next_id+=1
            self.rows[key]={"id":value,"recipient":recipient}
            return {"id":value,"reused":False}
    def snapshot(self,customer,id_value,recipient):
        ident=id_string(id_value)
        with self.lock:
            if not any(k[0]==customer and row["id"]==ident for k,row in self.rows.items()):
                raise PermissionError("cross-customer")
            self.snapshots.append((customer,ident,recipient))
def run():
    m=Model()
    base=(1,"La Habana","Playa","","Calle 12 #5 apto 01")
    assert identity(*base)==identity(1," La  Habana\u00a0","Playa","","Calle 12 #5 apto 01")
    assert norm("\u00c1")==norm("A\u0301")
    for a,b in (("Calle 12 #5","calle 12 #5"),("Peña","Pena"),("Apto 01","Apto 1")):
        assert norm(a)!=norm(b)
    for v in ("A\u200bB","A\ufeffB"):
        try: norm(v);assert False
        except ValueError: pass
    gate=Barrier(20)
    def worker(i):
        gate.wait()
        return m.save(f"synthetic-session-1",*base,"Recipient "+str(i))
    with ThreadPoolExecutor(max_workers=20) as pool: results=list(pool.map(worker,range(20)))
    assert len({r["id"] for r in results})==1
    assert sum(not r["reused"] for r in results)==1
    assert len(m.rows)==1
    original=next(iter(m.rows.values()))["recipient"]
    assert original.startswith("Recipient ")
    assert m.save("synthetic-session-1",*base,"Different recipient")["reused"]
    assert next(iter(m.rows.values()))["recipient"]==original
    second=m.save("synthetic-session-2",2,*base[1:],"Second customer")
    assert second["id"]!=results[0]["id"] and len(m.rows)==2
    for token,customer in (("synthetic-session-2",1),("invalid",1)):
        try: m.save(token,customer,*base[1:],"Fake");assert False
        except PermissionError: pass
    try: m.snapshot(2,results[0]["id"],"Not owner");assert False
    except PermissionError: pass
    m.snapshot(1,results[0]["id"],"Original snapshot")
    assert m.snapshots==[(1,results[0]["id"],"Original snapshot")]
    assert id_string(results[0]["id"])==results[0]["id"]
    for value in ("1","9007199254740991","9007199254740992",str(MAX_I8)):
        assert id_string(value)==value
    for value in ("01","1e3","-1","0",str(MAX_I8+1),9007199254740992,True,None,[]):
        try: id_string(value);assert False
        except ValueError: pass
    assert id_string(1)=="1"
    assert json.loads(json.dumps(results[0]))["id"]==results[0]["id"]
    # Simulated migration: copy-on-write, historical duplicate audit, no silent merge.
    legacy=[(1,"La Habana","Playa","","Calle 12 #5 apto 01"),(1," La  Habana ","Playa","","Calle 12 #5 apto 01")]
    migrated=list(legacy)
    collisions=len(migrated)-len({identity(*r) for r in migrated})
    assert collisions==1 and migrated==legacy
    can_add_unique=(collisions==0)
    assert not can_add_unique
    before=(dict(m.rows),list(m.snapshots))
    shadow=dict(m.rows);shadow.clear()  # rollback of isolated shadow, not source
    assert (m.rows,m.snapshots)==before
    print("PASS F5: synthetic NFC/whitespace, invalid controls, 20-thread dedup model, cross-customer isolation, immutable recipient, bigint, JSON, duplicate preflight, rollback shadow")
    print("LIMIT: Python in-memory lock models uniqueness; does NOT test PostgreSQL ON CONFLICT, RLS, Edge, PostgREST, live migrations or real concurrency.")
if __name__=="__main__": run()
