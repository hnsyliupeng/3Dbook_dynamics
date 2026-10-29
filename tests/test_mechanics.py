import unittest
import numpy as np
from tools.mechanics import analyze, model_for, make_matrices

class PeriodicTrussMechanics(unittest.TestCase):
    def test_orthogonal_periodic_rods(self):
        # One node per periodic cell, 3 unit axial bars; no shear stiffness.
        cube={'vertices':[{'p':[0,0,0]}],'edges':[{'a':0,'b':0,'o':o} for o in [[1,0,0],[0,1,0],[0,0,1]]]}
        C=np.array(analyze(cube,True,1e-12,1000)['C_over_EA_a2'])
        np.testing.assert_allclose(C,np.diag([1,1,1,0,0,0]),atol=1e-12)
    def test_engineering_shear_diagonal_bar(self):
        diagonal={'vertices':[{'p':[0,0,0]}], 'edges':[{'a':0,'b':0,'o':[1,1,0]}]}
        c=np.array(analyze(diagonal,True,1e-12,1000)['C_over_EA_a2'])
        self.assertAlmostEqual(c[5,5],1/(2*np.sqrt(2)),places=12)
        self.assertAlmostEqual(c[0,5],1/(2*np.sqrt(2)),places=12)
        self.assertAlmostEqual(c[0,0],1/(2*np.sqrt(2)),places=12)
    def test_zero_energy_mechanism_and_relaxation(self):
        # A non-wrapping single member can relax its affine extension completely.
        model={'vertices':[{'p':[0,0,0]},{'p':[.5,0,0]}], 'edges':[{'a':0,'b':1,'o':[0,0,0]}]}
        c=np.array(analyze(model,True,1e-12,1000)['C_over_EA_a2'])
        np.testing.assert_allclose(c,np.zeros((6,6)),atol=1e-12)
    def test_explicit_boundary_node_null_motion(self):
        model=model_for(.32); B,D,lengths,edges=make_matrices(model,True)
        node=564
        self.assertEqual(model['vertices'][node]['role'],'boundary')
        incidence=[e for e in edges if e['a']==node or e['b']==node]
        self.assertEqual(len(incidence),2)
        # Both contour bars lie in x=0: x motion is an exact first-order null direction.
        v=np.zeros(B.shape[1]);v[3*node-3]=-1
        np.testing.assert_allclose(B@v,0,atol=1e-14)
    def test_boundary_sampling_comparison(self):
        coarse=analyze(model_for(.32,24),True,1e-10,20000)
        medium=analyze(model_for(.32,48),True,1e-10,20000)
        self.assertNotEqual(coarse['vertices'],medium['vertices'])
        np.testing.assert_allclose(coarse['C_over_EA_a2'],medium['C_over_EA_a2'],atol=1e-7)
    def test_gyroid_convergence_energy_and_braces(self):
        s=model_for(.32)
        with_web=analyze(s,True,1e-10,10000)
        without=analyze(s,False,1e-10,10000)
        self.assertTrue(with_web['converged'] and without['converged'])
        c=np.array(with_web['C_over_EA_a2']);d=np.array(without['C_over_EA_a2'])
        self.assertLess(np.max(np.abs(c-c.T)),1e-12)
        self.assertGreaterEqual(np.linalg.eigvalsh(c).min(),-1e-10)
        # Adding bars cannot lower minimized strain energy (to numerical tolerance).
        self.assertGreaterEqual(np.linalg.eigvalsh(c-d).min(),-1e-8)
        self.assertEqual(with_web['edges']-without['edges'],24)
        self.assertLess(max(s['relative_normal_residual'] for s in with_web['solves']),1e-6)

if __name__=='__main__': unittest.main()
