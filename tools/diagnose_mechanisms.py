#!/usr/bin/env python3
"""Show an explicit local null direction and a boundary sampling sensitivity scan."""
import argparse,json
from pathlib import Path
import numpy as np
from mechanics import model_for,make_matrices,analyze

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path)
args=parser.parse_args()
s=model_for(.32);B,D,lengths,edges=make_matrices(s,True)
p=np.array([v['p'] for v in s['vertices']]);degree=np.zeros(len(p),int);inc=[[] for _ in p]
for i,e in enumerate(edges):
    degree[e['a']]+=1;degree[e['b']]+=1;inc[e['a']].append(i);inc[e['b']].append(i)
case=None
for node in np.flatnonzero(degree==2):
    if node==0 or s['vertices'][node].get('role')!='boundary':continue
    directions=[]
    for i in inc[node]:
        e=edges[i];d=p[e['b']]+e['o']-p[e['a']];directions.append(d/np.linalg.norm(d))
    z=np.cross(directions[0],directions[1]);zn=np.linalg.norm(z)
    if zn<1e-8:continue
    z/=zn;v=np.zeros(B.shape[1]);v[3*node-3:3*node]=z
    fields=json.loads(Path('data/mechanics-fields-w032.json').read_text())
    u=np.array(fields['modes'][0]['fluctuation']).reshape(-1)[3:]*.01
    r0=B@u+D[:,0]*.01;r1=B@(u+.05*v)+D[:,0]*.01
    case={'node':int(node),'role':s['vertices'][node]['role'],'position':p[node].tolist(),
          'incident_edge_indices':inc[node],'null_direction':z.tolist(),'amplitude_in_a':.05,
          'max_weighted_extension_change':float(np.max(np.abs(r1-r0))),
          'note':'Linearized illustration only; arbitrary finite-amplitude null displacement is not a nonlinear equilibrium prediction.'}
    break
if case is None:raise RuntimeError('No suitable degree-2 node found')
scan=[]
for res in (24,48,96):
    m=model_for(.32,res);r=analyze(m,True,1e-12,20000)
    if not r['converged']:raise RuntimeError('solver did not converge')
    scan.append({'resolution':res,'nodes':r['vertices'],'edges':r['edges'],'min_length':r['min_length'],
                 'young_x_over_EA_a2':r['directional_moduli_over_EA_a2']['young_x'],
                 'shear_yz_over_EA_a2':r['directional_moduli_over_EA_a2']['shear_yz_fixed_other_strains'],
                 'max_relative_normal_residual':max(q['relative_normal_residual'] for q in r['solves'])})
out={'w':.32,'degree_two_count':int(np.sum(degree==2)),'null_direction_example':case,'resolution_scan':scan,
     'note':'Fixed-cell periodic pin joints and axial bars. No bending stiffness. The scan does not validate beam convergence, stability, paper fidelity or collision-free solids.'}
text=json.dumps(out,ensure_ascii=False,indent=2)+'\n'
if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(text)
else:print(text,end='')
