"""Offline adversarial tests; no SQL, network or external services."""
import copy
import hashlib
import json
import unicodedata
import unittest
from pathlib import Path
from test_pg_security_semantic_manifest import fingerprint, violations

ROOT = Path(__file__).parent
MATRIX = ROOT / 'pg_security_acceptance_matrix.json'
MANIFEST = ROOT / 'pg_security_semantic_manifest.json'


def reject_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('duplicate JSON key: ' + key)
        result[key] = value
    return result


def strict_json(raw):
    return json.loads(raw, object_pairs_hook=reject_duplicate_keys,
                      parse_constant=lambda x: (_ for _ in ()).throw(ValueError(x)))


class AdversarialManifest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.matrix = strict_json(MATRIX.read_text(encoding='utf-8'))
        cls.manifest = strict_json(MANIFEST.read_text(encoding='utf-8'))

    def test_01_baseline(self):
        self.assertEqual(violations(self.matrix, self.manifest), [])

    def test_02_coordinated_edit_bypasses_unanchored_check(self):
        doc, man = copy.deepcopy(self.matrix), copy.deepcopy(self.manifest)
        doc['cases'][0]['attack'] += ' unauthorized coordinated change'
        man['entries']['ID01'] = fingerprint(doc['cases'][0])
        self.assertEqual(violations(doc, man), [], 'Document known trust-boundary gap')
        self.assertNotEqual(hashlib.sha256(json.dumps(doc).encode()).hexdigest(), man['source_sha256'])

    def test_03_duplicate_case_field_rejected_by_strict_parser(self):
        raw = '{"id":"ID01","attack":"good","attack":"evil"}'
        with self.assertRaises(ValueError): strict_json(raw)

    def test_04_duplicate_manifest_entry_rejected(self):
        with self.assertRaises(ValueError): strict_json('{"entries":{"ID01":"a","ID01":"b"}}')

    def test_05_duplicate_top_level_key_rejected(self):
        with self.assertRaises(ValueError): strict_json('{"status":"safe","status":"unsafe"}')

    def test_06_extra_case_field_is_not_covered_by_fingerprint(self):
        case = copy.deepcopy(self.matrix['cases'][0])
        before = fingerprint(case)
        case['extra_unreviewed'] = 'value'
        self.assertEqual(fingerprint(case), before)
        self.assertNotEqual(set(case), {'id','area','attack','oracle','evidence','blocker'})

    def test_07_extra_manifest_field_not_checked_by_legacy_violations(self):
        man = copy.deepcopy(self.manifest)
        man['unreviewed'] = 'extra'
        self.assertEqual(violations(self.matrix, man), [])

    def test_08_unicode_nfc_nfd_change_detected(self):
        a = copy.deepcopy(self.matrix['cases'][0]); b = copy.deepcopy(a)
        a['attack'] += ' café'
        b['attack'] += ' cafe\u0301'
        self.assertEqual(unicodedata.normalize('NFC', a['attack']), unicodedata.normalize('NFC', b['attack']))
        self.assertNotEqual(fingerprint(a), fingerprint(b))

    def test_09_unicode_confusable_distinguished(self):
        a = copy.deepcopy(self.matrix['cases'][0]); b = copy.deepcopy(a)
        a['attack'] += ' A'; b['attack'] += ' А'  # Latin vs Cyrillic
        self.assertNotEqual(fingerprint(a), fingerprint(b))

    def test_10_unicode_escape_equivalence(self):
        self.assertEqual(strict_json('"\u00e9"'), strict_json('"é"'))

    def test_11_canonicalization_key_order_ignored(self):
        case = self.matrix['cases'][0]
        self.assertEqual(fingerprint(case), fingerprint(dict(reversed(list(case.items())))))

    def test_12_canonicalization_field_order_matters(self):
        case = copy.deepcopy(self.matrix['cases'][0])
        case['attack'], case['evidence'] = case['evidence'], case['attack']
        self.assertNotEqual(fingerprint(case), fingerprint(self.matrix['cases'][0]))

    def test_13_nonfinite_json_constant_rejected(self):
        with self.assertRaises(ValueError): strict_json('{"x":NaN}')

    def test_14_approval_evidence_absent_from_manifest(self):
        self.assertNotIn('approval', self.manifest)
        self.assertNotIn('approved_by', self.manifest)

    def test_15_manifest_source_blob_is_not_signature(self):
        self.assertEqual(len(self.manifest['source_blob']), 40)
        self.assertNotIn('signature', self.manifest)

    def test_16_manifest_sha256_is_not_approval(self):
        self.assertEqual(len(self.manifest['source_sha256']), 64)
        self.assertNotIn('approval_reference', self.manifest)

    def test_17_coordinated_rehash_does_not_prove_review(self):
        doc, man = copy.deepcopy(self.matrix), copy.deepcopy(self.manifest)
        doc['cases'][1]['blocker'] = 'weakened'
        man['entries']['ID02'] = fingerprint(doc['cases'][1])
        self.assertEqual(violations(doc, man), [])

    def test_18_original_matrix_unchanged(self):
        self.assertEqual(hashlib.sha256(MATRIX.read_bytes()).hexdigest(), self.manifest['source_sha256'])

if __name__ == '__main__': unittest.main()
