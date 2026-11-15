"""Offline synthetic state: private data, validated copy-on-write, CAS versions."""
from copy import deepcopy
from warehouse_assignment_v2 import allocate, valid_versions, KEYS


def _valid(kind, value):
    if kind == 'basket':
        return type(value) is dict and 0 < len(value) <= 100 and all(type(k) is str and 0 < len(k) <= 80 and type(v) is int and 1 <= v <= 10000 for k, v in value.items())
    if kind == 'warehouses':
        return type(value) is dict and 0 < len(value) <= 20 and all(type(w) is str and 0 < len(w) <= 80 and type(s) is dict and len(s) <= 1000 and all(type(k) is str and 0 < len(k) <= 80 and type(v) is int and 0 <= v <= 1000000 for k, v in s.items()) for w, s in value.items())
    if kind == 'routes':
        return type(value) is dict and len(value) <= 20 and all(type(k) is str and 0 < len(k) <= 80 and type(v) in (str, int, float) for k, v in value.items())
    if kind == 'address':
        return value is None or (type(value) is str and 0 < len(value) <= 300)
    return False


class HardenedState:
    __slots__ = ('__data', '__versions')

    def __init__(self, basket, warehouses, routes, address=None):
        initial = dict(basket=basket, warehouses=warehouses, routes=routes, address=address)
        if not all(_valid(k, v) for k, v in initial.items()):
            raise ValueError('invalid initial state')
        self.__data = deepcopy(initial)
        self.__versions = dict.fromkeys(KEYS, 0)

    @property
    def data(self):
        return deepcopy(self.__data)

    @property
    def versions(self):
        return self.__versions.copy()

    def snapshot(self):
        return {'data': deepcopy(self.__data), 'versions': self.__versions.copy()}

    def change(self, kind, value, expected):
        if type(kind) is not str or kind not in KEYS or not valid_versions(expected) or expected != self.__versions or self.__versions[kind] >= 2**63 - 1 or not _valid(kind, value):
            return False
        self.__data[kind] = deepcopy(value)
        self.__versions[kind] += 1
        return True

    def evaluate(self, snapshot):
        denied = {'valid_synthetic': False, 'commercial_quote_enabled': False, 'commercial_approval': False, 'fee_cup': None, 'errors': ['invalid or stale snapshot']}
        if type(snapshot) is not dict or set(snapshot) != {'data', 'versions'} or not valid_versions(snapshot['versions']) or snapshot['versions'] != self.__versions:
            return denied
        if snapshot['data'] != self.__data:
            return denied
        data = deepcopy(self.__data)
        result = allocate(data['basket'], data['warehouses'], data['routes'], self.__versions.copy(), snapshot['versions'])
        if snapshot['versions'] != self.__versions or data != self.__data:
            return denied
        return result
