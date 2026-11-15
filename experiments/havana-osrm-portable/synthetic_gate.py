"""Fail-closed offline synthetic gate; never approves commercial routing."""
from provenance_gate import validate_manifest
from compare_graphs_v2 import validate as compare


def evaluate(manifest_raw, corpus_raw):
    result = {
        'accepted_for_synthetic_review': False,
        'commercial_quote_enabled': False,
        'commercial_approval': False,
        'integrity': {'passed': False, 'error': None},
        'coverage': {'passed': False, 'errors': [], 'geographic_verified': False},
        'equivalence': {'passed': False, 'errors': []},
    }
    try:
        integrity = validate_manifest(manifest_raw, corpus_raw)
        if not integrity['integrity_verified'] or not integrity['synthetic_coverage_counts_verified']:
            raise ValueError('integrity not verified')
        result['integrity'] = {'passed': True, 'error': None}
    except (ValueError, TypeError, OverflowError, UnicodeError, RecursionError) as exc:
        result['integrity']['error'] = type(exc).__name__ + ': ' + str(exc)
        return result
    try:
        comparison = compare(corpus_raw)
        result['coverage'] = {
            'passed': comparison['coverage_audit']['passed'],
            'errors': comparison['coverage_audit']['errors'],
            'geographic_verified': False,
            'outside_unverified': comparison['coverage_audit']['outside_unverified'],
        }
        result['equivalence'] = {
            'passed': comparison['route_equivalence']['passed'],
            'errors': comparison['route_equivalence']['errors'],
        }
        result['accepted_for_synthetic_review'] = (
            comparison['accepted'] and result['coverage']['passed'] and result['equivalence']['passed']
        )
    except (ValueError, TypeError, OverflowError, UnicodeError, RecursionError) as exc:
        result['coverage']['errors'] = [['global', 'comparison_invalid', type(exc).__name__]]
        result['equivalence']['errors'] = [['global', 'comparison_invalid', type(exc).__name__]]
    return result
