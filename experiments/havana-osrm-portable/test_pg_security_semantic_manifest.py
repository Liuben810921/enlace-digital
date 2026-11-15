"""Offline SHA-256 manifest validation and in-memory mutation tests only."""
import copy
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).parent
SOURCE = ROOT / 'pg_security_acceptance_matrix.json'
MANIFEST = ROOT / 'pg_security_semantic_manifest.json'
FIELDS = ('area', 'attack', 'oracle', 'evidence', 'blocker')

def fingerprint(case):
    payload = json.dumps([case[field] for field in FIELDS], ensure_ascii=False,
                         separators=(',', ':')).encode('utf-8')
    return hashlib.sha256(payload).hexdigest()

def violations(doc, manifest):
    errors = []
    if manifest.get('manifest_version') != 1 or manifest.get('algorithm') != 'sha256':
        errors.append('manifest_metadata')
    entries = manifest.get('entries')
    if not isinstance(entries, dict):
        return errors + ['entries_type']
    cases = doc.get('cases')
    if not isinstance(cases, list):
        return errors + ['cases_type']
    ids = [c.get('id') for c in cases if isinstance(c, dict)]
    if len(ids) != 28 or len(set(ids)) != 28 or set(ids) != set(entries):
        errors.append('id_set')
    for case in cases:
        if not isinstance(case, dict) or not all(isinstance(case.get(k), str) for k in ('id',) + FIELDS):
            errors.append('case_type')
            continue
        if fingerprint(case) != entries.get(case['id']):
            errors.append('semantic:' + case['id'])
    return errors

class SemanticManifestTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.doc = json.loads(SOURCE.read_text(encoding='utf-8'))
        cls.manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))

    def test_manifest_matches_original(self):
        self.assertEqual(violations(self.doc, self.manifest), [])

    def test_source_sha256(self):
        self.assertEqual(hashlib.sha256(SOURCE.read_bytes()).hexdigest(), self.manifest['source_sha256'])

    def test_source_git_blob(self):
        data = SOURCE.read_bytes()
        blob = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
        self.assertEqual(blob, self.manifest['source_blob'])

    def test_manifest_has_28_entries(self):
        self.assertEqual(len(self.manifest['entries']), 28)

    def test_reject_mutated_attack(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][0]['attack'] += ' changed'
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_mutated_evidence(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][0]['evidence'] += ' changed'
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_mutated_blocker(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][0]['blocker'] += ' changed'
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_swapped_semantics(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][0]['attack'], doc['cases'][1]['attack'] = doc['cases'][1]['attack'], doc['cases'][0]['attack']
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_mutated_manifest_hash(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['entries']['ID01'] = '0' * 64
        self.assertTrue(violations(self.doc, manifest))

    def test_reject_missing_entry(self):
        manifest = copy.deepcopy(self.manifest)
        del manifest['entries']['ID01']
        self.assertTrue(violations(self.doc, manifest))

    def test_reject_added_entry(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['entries']['ID99'] = '0' * 64
        self.assertTrue(violations(self.doc, manifest))

    def test_reject_duplicate_case(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][1] = copy.deepcopy(doc['cases'][0])
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_mutated_oracle(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][0]['oracle'] = 'BLOCK_DEPLOYMENT'
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_mutated_area(self):
        doc = copy.deepcopy(self.doc)
        doc['cases'][0]['area'] = 'rpc'
        self.assertTrue(violations(doc, self.manifest))

    def test_reject_manifest_version(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['manifest_version'] = 2
        self.assertTrue(violations(self.doc, manifest))

if __name__ == '__main__':
    unittest.main()
