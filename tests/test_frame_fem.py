import unittest,math
import numpy as np
from tools.frame_fem import local_stiffness,frame_transform,solve_frame
from tools.mechanics import model_for

class FrameFE(unittest.TestCase):
 def test_local_symmetry_and_rigid_modes(self):
  L=2.;k=local_stiffness(L,3.,.3,.05)
  np.testing.assert_allclose(k,k.T,atol=1e-13)
  self.assertGreaterEqual(np.linalg.eigvalsh(k).min(),-1e-12)
  for axis in range(3):
   v=np.zeros(12);v[axis]=v[6+axis]=1
   np.testing.assert_allclose(k@v,0,atol=1e-12)
  # Rigid rotation around z, including the associated y translation at x=L.
  v=np.zeros(12);v[5]=v[11]=1;v[7]=L
  np.testing.assert_allclose(k@v,0,atol=1e-12)
 def test_cantilever_transverse_tip_stiffness(self):
  L=2;E=3;r=.05;I=math.pi*r**4/4;k=local_stiffness(L,E,.3,r)
  tip=k[np.ix_([7,11],[7,11])];u=np.linalg.solve(tip,[1,0])
  self.assertAlmostEqual(u[0],L**3/(3*E*I),places=6)
 def test_transform_orthogonal(self):
  t=frame_transform(np.array([.2,.4,.7]));np.testing.assert_allclose(t@t.T,np.eye(12),atol=1e-12)
 def test_periodic_orthogonal_grid(self):
  model={'vertices':[{'p':[0,0,0]}],'edges':[{'a':0,'b':0,'o':o} for o in [[1,0,0],[0,1,0],[0,0,1]]]}
  r=.1;s=solve_frame(model,.36,r);C=np.asarray(s['C_over_E']);A=math.pi*r*r;I=math.pi*r**4/4
  np.testing.assert_allclose(np.diag(C),[A,A,A,6*I,6*I,6*I],atol=1e-12)
  self.assertLess(s['max_equilibrium_residual'],1e-12)
 def test_real_graph_symmetric_positive_and_residual(self):
  m=model_for(.32);s=solve_frame(m,.36,.006,verify_modes=True);C=np.asarray(s['C_over_E'])
  np.testing.assert_allclose(C,C.T,atol=1e-13)
  self.assertGreater(np.linalg.eigvalsh(C).min(),0)
  self.assertLess(s['max_equilibrium_residual'],1e-9)
  self.assertEqual(s['V'],1416);self.assertEqual(s['edges'],2952)
  self.assertGreater(min(s['gauged_stiffness_modes']['eigenvalues']),0)
  self.assertLess(max(s['gauged_stiffness_modes']['absolute_residuals']),1e-12)

class FrameFieldTests(unittest.TestCase):
 def test_saved_fields_match_beam_equilibrium_and_report(self):
  import json
  from pathlib import Path
  from tools.frame_fem import frame_transform,local_stiffness,affine_cases
  field=json.loads(Path('data/frame-fem-fields-w032-r006.json').read_text())
  report=json.loads(Path('data/frame-fem-default.json').read_text())
  model=model_for(.32);pts=np.array([v['p'] for v in model['vertices']]);self.assertEqual(field['edge_count'],len(model['edges']))
  for name in ['PLA','ABS','PC']:
   data=field['materials'][name];u=np.array(data['fluctuation']);N=np.array(data['axial_force_over_Ea2']);C=np.zeros((6,6))
   for i,e in enumerate(model['edges']):
    a,b=e['a'],e['b'];d=pts[b]+np.array(e['o'])-pts[a];L=np.linalg.norm(d);T=frame_transform(d);k=T.T@local_stiffness(L,1,data['nu'],.006)@T
    h=np.zeros((12,6));h[6:9]=affine_cases(d);v=np.vstack((u[a],u[b]))+h;C+=v.T@k@v
    force=(T@(k@v))[6,:];np.testing.assert_allclose(force,N[i],atol=1e-9,rtol=1e-5)
   np.testing.assert_allclose(C,report['materials'][name]['C_over_E'],atol=2e-9,rtol=1e-5)

if __name__=='__main__':unittest.main()
