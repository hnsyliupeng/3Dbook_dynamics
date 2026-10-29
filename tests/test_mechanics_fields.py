import unittest, json
from pathlib import Path
import numpy as np
from tools.mechanics import model_for, make_matrices

class FieldVerification(unittest.TestCase):
    def test_fields_match_equilibrium_and_graph(self):
        data=json.loads(Path('data/mechanics-fields-w032.json').read_text())
        model=model_for(.32);B,D,L,edges=make_matrices(model,True)
        self.assertEqual(data['node_count'],len(model['vertices']))
        self.assertEqual(data['edge_count'],len(edges))
        np.testing.assert_allclose(data['positions'],[v['p'] for v in model['vertices']],atol=1e-12)
        self.assertEqual(data['edge_keys'],[[e['a'],e['b'],*e['o']] for e in edges])
        R=[]
        for i,mode in enumerate(data['modes']):
            u=np.array(mode['fluctuation']).reshape(-1)[3:]
            r=B@u+D[:,i]
            np.testing.assert_allclose(r/np.sqrt(L),mode['axial_strain'],atol=2e-8)
            self.assertLess(np.linalg.norm(B.T@r)/np.linalg.norm(B.T@D[:,i]),1e-8)
            R.append(r)
        C=np.column_stack(R).T@np.column_stack(R)
        report=json.loads(Path('data/mechanics-default.json').read_text())
        np.testing.assert_allclose(C,report['with_boundary_webs']['C_over_EA_a2'],atol=1e-8)

if __name__=='__main__':unittest.main()
