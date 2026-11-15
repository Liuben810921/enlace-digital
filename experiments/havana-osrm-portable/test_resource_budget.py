import importlib.util
import pathlib
import unittest
spec = importlib.util.spec_from_file_location('resource_budget', pathlib.Path(__file__).with_name('resource-budget.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
estimate = module.estimate

class BudgetTests(unittest.TestCase):
    def test_zero(self): self.assertEqual(estimate(0, 0)['synthetic_peak_bytes'], 0)
    def test_example(self): self.assertEqual(estimate(10000, 25000)['synthetic_graph_bytes'], 6080000)
    def test_rejects_negative(self):
        with self.assertRaises(ValueError): estimate(-1, 2)
    def test_rejects_float(self):
        with self.assertRaises(ValueError): estimate(1.5, 2)
    def test_rejects_bad_multiplier(self):
        with self.assertRaises(ValueError): estimate(1, 2, multiplier=21)
    def test_scaling(self): self.assertEqual(estimate(2, 4)['synthetic_peak_bytes'], 2*estimate(1, 2)['synthetic_peak_bytes'])
if __name__ == '__main__': unittest.main()
