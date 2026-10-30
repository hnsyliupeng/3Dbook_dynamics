#!/usr/bin/env python3
"""Independent SymPy + SciPy references, including explicit source-model distinction."""
from __future__ import annotations
import json, math
from pathlib import Path
import numpy as np
import sympy as s
from scipy.integrate import solve_ivp

ROOT = Path(__file__).resolve().parents[1]
m1, m2, g = s.symbols('m1 m2 g', positive=True)
q, v, a = s.symbols('q v a', real=True)
kinetic = s.Rational(1,2)*(m1+m2)*v**2
potential = (m1-m2)*g*q
lagrangian = kinetic-potential
# Because L has no q-v cross term, d/dt(dL/dv) = d²L/dv² * a.
el = s.diff(lagrangian,v,2)*a - s.diff(lagrangian,q)
a_expr = s.solve(el,a)[0]
tension_expr = s.simplify(m1*(g+a_expr))
assert s.simplify(a_expr-(m2-m1)*g/(m1+m2)) == 0
assert s.simplify(tension_expr-2*m1*m2*g/(m1+m2)) == 0


def sample_case(name, p):
    m_1,m_2,gravity,v0=p
    acc=float(a_expr.subs({m1:m_1,m2:m_2,g:gravity}))
    tension=float(tension_expr.subs({m1:m_1,m2:m_2,g:gravity}))
    def rhs(_t,y): return [y[1],acc]
    def upper(_t,y): return y[0]-.5
    def lower(_t,y): return y[0]+.5
    upper.terminal=lower.terminal=True
    solution=solve_ivp(rhs,(0,4),[0,v0],rtol=1e-12,atol=1e-13,events=[upper,lower],dense_output=True,max_step=.01)
    assert solution.success
    end=float(solution.t[-1])
    ts=np.linspace(0,end,41); ys=solution.sol(ts)
    analytic=v0*ts+.5*acc*ts**2
    analytical_v=v0+acc*ts
    total=.5*(m_1+m_2)*ys[1]**2+(m_1-m_2)*gravity*ys[0]
    error=float(np.max(np.abs(ys[0]-analytic)))
    vel_error=float(np.max(np.abs(ys[1]-analytical_v)))
    energy_error=float(np.max(np.abs(total-total[0])))
    assert error < 1e-10 and vel_error < 1e-10 and energy_error < 1e-9
    assert np.max(np.abs((.75-ys[0])+(.75+ys[0])-1.5)) < 1e-12
    return {'name':name,'parameters':{'m1':m_1,'m2':m_2,'g':gravity,'v0':v0},
            'acceleration':acc,'tension':tension,'endTime':end,'stop':bool(any(len(x) for x in solution.t_events)),
            'maxPositionError':error,'maxVelocityError':vel_error,'maxEnergyDrift':energy_error,
            'samples':[{'t':float(t),'q':float(y[0]),'velocity':float(y[1])} for t,y in zip(ts[::10],ys.T[::10])]}

cases=[sample_case('default',(1,2,9.81,0)), sample_case('equal masses',(2,2,9.81,0)),
       sample_case('reversed masses',(2,1,9.81,0)), sample_case('initial velocity with reversal',(1,2,9.81,-1))]
assert abs(cases[0]['acceleration']-3.27)<1e-12 and abs(cases[0]['tension']-13.08)<1e-12
assert cases[1]['acceleration']==0 and not cases[1]['stop']
assert cases[2]['acceleration']==-cases[0]['acceleration']
# Reproduce exactly what the source 05 notebook wrote, without treating it as the ideal model:
# cell 11 has theta_dot = pi*x1_dot/R, so cell 37 has pi^2*M in the denominator.
source_acc=2*9.81*(8-1)/(math.pi**2*4+2*8+2*1)
source_solution=solve_ivp(lambda _t,y:[y[1],source_acc],(0,10),[25,-10],rtol=1e-12,atol=1e-13)
source_position=float(source_solution.y[0,-1]);source_velocity=float(source_solution.y[1,-1])
assert abs(source_position-(25-100+50*source_acc))<1e-9
reference={'method':'SymPy differentiation and scipy.integrate.solve_ivp (RK45); SI units',
           'idealEulerLagrange':str(el),'idealAcceleration':str(a_expr),'idealTension':str(tension_expr),
           'cases':cases,
           'source05Reproduction':{'notebook':'05Simulation/atwoodSimulationSolved.ipynb','cells':['index:11','index:20','index:24','index:37','index:53','index:56','index:60'],
               'modelNote':'Reproduces the source cell 11 pi factor and pulley inertia; this is NOT the ideal browser model.',
               'acceleration_m_s2':source_acc,'initialState':[25,-10],'t_s':10,'position_m':source_position,'velocity_m_s':source_velocity}}
out=ROOT/'content/references/physics-reference.json';out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(reference,indent=2)+'\n')
print('SymPy Euler–Lagrange:',el,'= 0')
for c in cases: print(f"{c['name']}: a={c['acceleration']:.6f}, T={c['tension']:.6f}, end={c['endTime']:.6f}, max |RK45−analytic|={c['maxPositionError']:.3e}, max energy drift={c['maxEnergyDrift']:.3e}")
print(f'source 05 (with its pi factor): a={source_acc:.9f}, x(10)={source_position:.6f}, v(10)={source_velocity:.6f}')
print('Wrote',out.relative_to(ROOT))
