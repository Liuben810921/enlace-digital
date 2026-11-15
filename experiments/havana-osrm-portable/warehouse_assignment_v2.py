"""Synthetic deterministic allocation and version invalidation; never commercial."""
from delivery_quote import quote
KEYS=('basket','address','routes','warehouses')
def valid_versions(v):
    return type(v) is dict and set(v)==set(KEYS) and all(type(v[k]) is int and 0<=v[k]<2**63 for k in KEYS)
def allocate(basket,stock,routes,versions,expected=None):
    out=dict(valid_synthetic=False,commercial_quote_enabled=False,commercial_approval=False,fee_cup=None,allocation={},participants=[],errors=[])
    try:
        if not valid_versions(versions) or (expected is not None and (not valid_versions(expected) or expected!=versions)): raise ValueError('stale/invalid versions')
        if type(basket) is not dict or not basket or len(basket)>100: raise ValueError('basket')
        if any(type(k) is not str or not k or len(k)>80 or type(v) is not int or not 1<=v<=10000 for k,v in basket.items()): raise ValueError('basket line')
        if type(stock) is not dict or not stock or len(stock)>20: raise ValueError('warehouses')
        if any(type(w) is not str or not w or len(w)>80 or type(s) is not dict or len(s)>1000 for w,s in stock.items()): raise ValueError('stock structure')
        if any(type(k) is not str or not k or len(k)>80 or type(v) is not int or not 0<=v<=1000000 for s in stock.values() for k,v in s.items()): raise ValueError('stock value')
        allocation={}
        for sku in sorted(basket):
            remaining=basket[sku]
            for w in sorted(stock):
                take=min(remaining,stock[w].get(sku,0))
                if take: allocation.setdefault(w,{})[sku]=take; remaining-=take
                if not remaining: break
            if remaining: raise ValueError('insufficient stock')
        participants=sorted(allocation)
        if type(routes) is not dict or set(routes)!=set(participants): raise ValueError('routes')
        result=quote(participants,routes)
        if not result['valid_synthetic']: raise ValueError('quote')
        out.update(valid_synthetic=True,fee_cup=result['fee_cup'],allocation=allocation,participants=participants,selected_warehouse=result['selected_warehouse'],versions=versions.copy())
    except (ValueError,TypeError,OverflowError) as exc: out['errors'].append(str(exc))
    return out
class State:
    """Single-process compare-and-swap simulation; not database concurrency."""
    def __init__(self,basket,stock,routes):
        self.data=dict(basket=basket.copy(),warehouses={k:v.copy() for k,v in stock.items()},routes=routes.copy(),address=None)
        self.versions=dict.fromkeys(KEYS,0)
    def snapshot(self):
        return dict(data={k:({w:v.copy() for w,v in x.items()} if k=='warehouses' else x.copy() if type(x) is dict else x) for k,x in self.data.items()},versions=self.versions.copy())
    def change(self,kind,value,expected):
        if kind not in KEYS or not valid_versions(expected) or expected!=self.versions or self.versions[kind]>=2**63-1:return False
        if kind in ('basket','routes') and type(value) is not dict:return False
        if kind=='warehouses' and (type(value) is not dict or any(type(w) is not str or type(v) is not dict for w,v in value.items())):return False
        if kind=='address' and value is not None and type(value) is not str:return False
        self.data[kind]=({w:v.copy() for w,v in value.items()} if kind=='warehouses' and type(value) is dict else value.copy() if type(value) is dict else value)
        self.versions[kind]+=1
        return True
    def evaluate(self,snap):
        if self.versions!=snap['versions']:return dict(valid_synthetic=False,commercial_quote_enabled=False,commercial_approval=False,errors=['stale snapshot'])
        d=snap['data']
        result=allocate(d['basket'],d['warehouses'],d['routes'],snap['versions'],self.versions)
        if self.versions!=snap['versions']:return dict(valid_synthetic=False,commercial_quote_enabled=False,commercial_approval=False,errors=['changed during evaluation'])
        return result
