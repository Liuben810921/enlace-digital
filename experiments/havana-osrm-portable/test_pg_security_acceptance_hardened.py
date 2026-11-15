"""Strict offline contract and in-memory mutation tests. No database access."""
import copy
import json
from pathlib import Path
import unittest

FILE = Path(__file__).with_name('pg_security_acceptance_matrix.json')
EXPECTED = {
 'ID01':('identity_rls','DENY'),'ID02':('identity_rls','DENY'),
 'ID03':('identity_rls','DENY'),'ID04':('identity_rls','DENY'),
 'ID05':('identity_rls','DENY'),
 'RO01':('roles','BLOCK_DEPLOYMENT'),'RO02':('roles','BLOCK_DEPLOYMENT'),
 'RO03':('roles','BLOCK_DEPLOYMENT'),'RO04':('roles','BLOCK_DEPLOYMENT'),
 'RO05':('roles','BLOCK_DEPLOYMENT'),
 'CA01':('cas','REJECT_STALE'),'CA02':('cas','REJECT_STALE'),
 'CA03':('cas','REJECT_STALE'),'CA04':('cas','REJECT_STALE'),
 'CA05':('cas','ONE_COMMIT'),'CA06':('cas','REJECT_OVERFLOW'),
 'CA07':('cas','BLOCK_DEPLOYMENT'),
 'IP01':('idempotency','SINGLE_RESULT'),'IP02':('idempotency','REJECT_CONFLICT'),
 'IP03':('idempotency','RECONCILE'),'IP04':('idempotency','BLOCK_DEPLOYMENT'),
 'IP05':('idempotency','BLOCK_DEPLOYMENT'),'IP06':('idempotency','ROLLBACK_RETRY'),
 'RP01':('rpc','BLOCK_DEPLOYMENT'),'RP02':('rpc','BLOCK_DEPLOYMENT'),
 'RP03':('rpc','DENY'),'RP04':('rpc','BLOCK_DEPLOYMENT'),
 'RP05':('rpc','DENY'),
}
REQUIRED = frozenset(('id','area','attack','oracle','evidence','blocker'))

def defects(doc):
    errors=[]
    if doc.get('status') != 'OFFLINE_SPECIFICATION_ONLY': errors.append('status')
    if doc.get('commercial_quote_enabled') is not False or doc.get('commercial_approval') is not False: errors.append('commercial')
    cases=doc.get('cases')
    if not isinstance(cases,list): return errors+['cases']
    ids=[]
    for item in cases:
        if not isinstance(item,dict) or set(item)!=REQUIRED or any(not isinstance(v,str) or not v.strip() for v in item.values()):
            errors.append('fields'); continue
        ids.append(item['id'])
        if (item['area'],item['oracle']) != EXPECTED.get(item['id']): errors.append('mapping:'+item['id'])
    if len(ids)!=len(EXPECTED) or set(ids)!=set(EXPECTED) or len(ids)!=len(set(ids)):
        errors.append('ids')
    return errors

class HardenedAcceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.document=json.loads(FILE.read_text(encoding='utf-8'))
        cls.by_id={item['id']:item for item in cls.document['cases']}

    def test_contract_valid(self): self.assertEqual(defects(self.document),[])
    def test_mutation_oracle(self):
        doc=copy.deepcopy(self.document)
        doc['cases'][0]['oracle']='BLOCK_DEPLOYMENT'
        self.assertTrue(defects(doc))
    def test_mutation_area(self):
        doc=copy.deepcopy(self.document)
        doc['cases'][0]['area']='rpc'
        self.assertTrue(defects(doc))
    def test_mutation_duplicate(self):
        doc=copy.deepcopy(self.document)
        doc['cases'][0]=copy.deepcopy(doc['cases'][1])
        self.assertTrue(defects(doc))
    def test_mutation_missing(self):
        doc=copy.deepcopy(self.document)
        doc['cases'].pop()
        self.assertTrue(defects(doc))
    def test_mutation_commercial(self):
        doc=copy.deepcopy(self.document)
        doc['commercial_approval']=True
        self.assertTrue(defects(doc))
    def test_mutation_empty_evidence(self):
        doc=copy.deepcopy(self.document)
        doc['cases'][0]['evidence']=''
        self.assertTrue(defects(doc))
    def test_mutation_unknown_id(self):
        doc=copy.deepcopy(self.document)
        doc['cases'][0]['id']='ID99'
        self.assertTrue(defects(doc))

def make_test(case_id, expected):
    def check(self):
        self.assertEqual((self.by_id[case_id]['area'],self.by_id[case_id]['oracle']),expected)
    return check
for case_id, expected in EXPECTED.items():
    setattr(HardenedAcceptance,'test_exact_'+case_id.lower(),make_test(case_id,expected))

if __name__ == '__main__': unittest.main()
