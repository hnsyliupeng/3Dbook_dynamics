#!/usr/bin/env python3
"""Prove the twelve displayed ideal-model steps and generate independent cases.

The displayed LaTeX is checked against the reviewed expressions, not silently
replaced. SymPy proves each step; high-precision roots and SciPy RK45 generate
separate references for the TypeScript solver and visual adapters.
"""
from __future__ import annotations
import hashlib, json, random, re
from pathlib import Path
import mpmath as mp
import numpy as np
import sympy as s
from scipy.integrate import solve_ivp

ROOT=Path(__file__).resolve().parents[1]
lesson=(ROOT/'src/lessons/atwood/lesson.ts').read_text(encoding='utf-8')
actual=dict(re.findall(r"step\(\{\s*id:'([^']+)'[^`]+latex:String\.raw`([^`]+)`",lesson))
expected={
'constraint':r'\ell_1+\ell_2+\pi R=L',
'coordinate':r'q=\ell_2-\ell_{2,0},\qquad \ell_1=\ell_{1,0}-q',
'velocity':r'\dot y_1=\dot q,\qquad \dot y_2=-\dot q',
'kinetic':r'T_{\rm kin}=\tfrac12(m_1+m_2)\dot q^2',
'potential':r'V=(m_1-m_2)gq',
'lagrangian':r'\mathcal L=\tfrac12(m_1+m_2)\dot q^2+(m_2-m_1)gq',
'partials':r'\frac{\partial\mathcal L}{\partial q}=(m_2-m_1)g,\quad \frac{d}{dt}\frac{\partial\mathcal L}{\partial\dot q}=(m_1+m_2)\ddot q',
'euler':r'\frac{d}{dt}\frac{\partial\mathcal L}{\partial\dot q}-\frac{\partial\mathcal L}{\partial q}=0',
'acceleration':r'a=\ddot q=\frac{(m_2-m_1)g}{m_1+m_2}',
'tension':r'T_{\rm rope}=m_1(g+a)=\frac{2m_1m_2g}{m_1+m_2}',
'solution':r'q(t)=v_0t+\tfrac12at^2,\qquad \dot q(t)=v_0+at',
'validation':r'T_{\rm kin}+V=\tfrac12(m_1+m_2)v_0^2',
}
assert set(actual)==set(expected),(actual.keys(),expected.keys())
for key in expected: assert actual[key]==expected[key],f'{key}: displayed LaTeX differs from reviewed equation'

m1,m2,g,R=s.symbols('m1 m2 g R',positive=True)
t=s.symbols('t',real=True); q=s.Function('q')(t); qdot=s.diff(q,t); qdd=s.diff(q,t,2)
l10,l20,y10,y20,v0=s.symbols('l10 l20 y10 y20 v0',real=True)
left,right=l10-q,l20+q; y1,y2=y10+q,y20-q
K=s.expand((m1*s.diff(y1,t)**2+m2*s.diff(y2,t)**2)/2)
V=s.expand(g*(m1*y1+m2*y2)-g*(m1*y10+m2*y20))
Lag=K-V
partial_q=s.diff(Lag,q); partial_v=s.diff(Lag,qdot); ddt=s.diff(partial_v,t)
el=s.simplify(ddt-partial_q); acceleration=s.solve(el,qdd)[0]
tension=s.simplify(m1*(g+acceleration))
q_solution=v0*t+s.Rational(1,2)*acceleration*t*t
energy=s.simplify((K+V).subs({q:q_solution,qdot:s.diff(q_solution,t)}))
proofs={
 'constraint':s.simplify(left+right+s.pi*R-(l10+l20+s.pi*R))==0,
 'coordinate':s.simplify((right-l20)-q)==0 and s.simplify(left-(l10-q))==0,
 'velocity':s.simplify(s.diff(y1,t)-qdot)==0 and s.simplify(s.diff(y2,t)+qdot)==0,
 'kinetic':s.simplify(K-(m1+m2)*qdot**2/2)==0,
 'potential':s.simplify(V-(m1-m2)*g*q)==0,
 'lagrangian':s.simplify(Lag-((m1+m2)*qdot**2/2+(m2-m1)*g*q))==0,
 'partials':s.simplify(partial_q-(m2-m1)*g)==0 and s.simplify(ddt-(m1+m2)*qdd)==0,
 'euler':s.simplify(el-((m1+m2)*qdd-(m2-m1)*g))==0,
 'acceleration':s.simplify(acceleration-(m2-m1)*g/(m1+m2))==0,
 'tension':s.simplify(tension-2*m1*m2*g/(m1+m2))==0 and s.simplify(tension-m2*(g-acceleration))==0,
 'solution':s.simplify(s.diff(q_solution,t,2)-acceleration)==0 and q_solution.subs(t,0)==0 and s.diff(q_solution,t).subs(t,0)==v0,
 'validation':s.simplify(energy-(m1+m2)*v0**2/2)==0,
}
assert all(proofs.values()),proofs

# High precision root isolation also detects a tangential touch, unlike a
# sign-crossing-only numerical event detector. The browser still uses RK4.
mp.mp.dps=70

def reference(name,p):
    m_1,m_2,grav,initial=(mp.mpf(str(x)) for x in p)
    acc=(m_2-m_1)*grav/(m_1+m_2); tension=2*m_1*m_2*grav/(m_1+m_2)
    roots=[]
    for target in (mp.mpf('-.5'),mp.mpf('.5')):
        if acc==0:
            if initial:roots.append(target/initial)
        else:
            discriminant=initial**2+2*acc*target
            # 70-digit decimal arithmetic itself can leave a 10^-70 residue
            # for a mathematically exact tangent; do not call it a near miss.
            eps=mp.mpf('1e-60')*(abs(initial**2)+abs(2*acc*target))
            if discriminant>=-eps:
                d=mp.sqrt(0 if abs(discriminant)<=eps else discriminant)
                roots.extend(((-initial+d)/acc,(-initial-d)/acc))
    valid=[x for x in roots if x>0 and x<=4]
    stop=min(valid) if valid else None
    end=float(stop if stop is not None else 4)
    a=float(acc); ts=np.linspace(0,end,9)
    sol=solve_ivp(lambda _t,y:[y[1],a],(0,end),[0,float(initial)],t_eval=ts,rtol=2e-12,atol=2e-13,max_step=.015)
    assert sol.success
    for time,position,velocity in zip(ts,sol.y[0],sol.y[1]):
        assert abs(position-(float(initial)*time+.5*a*time*time))<2e-10
        assert abs(velocity-(float(initial)+a*time))<2e-10
    return {'name':name,'parameters':dict(zip(('m1','m2','g','v0'),map(float,p))),
      'acceleration':a,'tension':float(tension),'endTime':end,'stop':stop is not None,
      'samples':[{'t':float(time),'q':float(position),'velocity':float(velocity)} for time,position,velocity in zip(ts,sol.y[0],sol.y[1])]}

named=[
 ('default',(1,2,9.81,0)),('reversed masses',(2,1,9.81,0)),
 ('equal stationary',(2,2,9.81,0)),('equal moving at .05',(2,2,9.81,.05)),
 ('equal moving hits positive stop',(2,2,9.81,1)),('initial reversal',(1,2,9.81,-1)),
 ('reverse direction with initial velocity',(2,1,9.81,1)),('maximum gravity and unequal masses',(.2,5,20,0)),
 ('minimum gravity',(5,.2,1,0)),('tangential endpoint touch',(1,3,2,-1)),
 ('near equal masses, cancellation stress',(1,1.00000000002,1,1)),
 ('touch exactly at observation horizon',(1.5,1.7,1,0)),
 ('tangency with mass cancellation',(4.3,4.4,7.83,-.3)),
 ('tangency rounded positive',(.2,.3,1.25,-.5)),
 ('negative tangency with rounding',(.2,1,1.5,-1)),
 ('positive tangency with rounding',(1,.2,1.5,1)),
 ('near tangent but hits',(.2,1,1.49,-1)),
 ('near tangent but misses',(.2,1,1.51,-1)),
]
rng=random.Random(20261031)
for i in range(100):
    named.append((f'seeded-ui-{i+1:03}',(rng.randint(2,50)/10,rng.randint(2,50)/10,rng.randint(100,2000)/100,rng.randint(-20,20)/20)))
cases=[reference(name,p) for name,p in named]
ref={'method':'SymPy symbolic derivation; mpmath 70-digit endpoint roots; independent scipy.integrate.solve_ivp RK45; SI units',
     'seed':20261031,'namedCases':18,'randomUICases':100,'cases':cases}
(ROOT/'content/references/deep-physics-reference.json').write_text(json.dumps(ref,indent=2)+'\n')
report={'method':'exact reviewed LaTeX match + SymPy symbolic identities; not a proof of unimplemented models',
        'lessonSha256':hashlib.sha256(lesson.encode()).hexdigest(),
        'steps':[{'number':i+1,'id':key,'reviewedLatex':expected[key],'latexMatchesReviewedExpression':True,'symbolicIdentity':bool(proofs[key])} for i,key in enumerate(actual)],
        'cases':{'named':18,'seededUI':100,'samplesPerCase':9,'reference':'content/references/deep-physics-reference.json'},
        'notes':['q is m2 downward; y1 and y2 are upward.',
                 'Tangent end-stop is checked by high-precision root isolation, not merely sign-changing events.',
                 'Only the implemented ideal Atwood model is covered.']}
(ROOT/'reports/derivation-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(f"Derivations: {len(proofs)}/{len(proofs)} symbolic identities match displayed LaTeX")
print(f"SciPy references: {len(cases)} cases × 9 samples, including tangent and near-equal stress")
print('Wrote reports/derivation-audit.json and content/references/deep-physics-reference.json')
