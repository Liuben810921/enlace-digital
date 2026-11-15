"""Synthetic delivery quotation model. No geographic verification or commercial approval."""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP


def quote(warehouses, route_distances_km, *, rate_cup_km='200', minimum_km='3', special_fee_cup=None):
    result = {'valid_synthetic': False, 'commercial_approval': False, 'commercial_quote_enabled': False, 'fee_cup': None, 'selected_warehouse': None, 'errors': []}
    try:
        if not isinstance(warehouses, list) or not warehouses or len(warehouses) > 20 or len(set(warehouses)) != len(warehouses) or any(type(w) is not str or not w or len(w)>80 for w in warehouses):
            raise ValueError('invalid warehouses')
        if type(route_distances_km) is not dict or set(route_distances_km) != set(warehouses):
            raise ValueError('incomplete or unexpected routes')
        def number(value):
            if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
                raise ValueError('invalid numeric type')
            try: d = Decimal(str(value))
            except InvalidOperation: raise ValueError('invalid numeric value')
            if not d.is_finite() or d < 0 or d > 1000000: raise ValueError('invalid numeric range')
            return d
        distances = {w:number(route_distances_km[w]) for w in warehouses}
        rate, floor = number(rate_cup_km), number(minimum_km)
        if rate == 0 or floor == 0: raise ValueError('invalid rate or minimum')
        # Conservative charging policy: longest valid route across listed warehouses.
        warehouse = max(warehouses, key=lambda w:(distances[w], w))
        distance = distances[warehouse]
        if special_fee_cup is not None:
            fee = number(special_fee_cup)
        else:
            fee = max(distance, floor) * rate
        result.update(valid_synthetic=True, selected_warehouse=warehouse,
                      fee_cup=str(fee.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)),
                      distance_km=str(distance))
    except (ValueError, TypeError, ArithmeticError) as exc:
        result['errors'].append(str(exc))
    return result
