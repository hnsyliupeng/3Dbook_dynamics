#!/usr/bin/env python3
"""Generate reproducible per-node fluctuations and per-bar axial strain fields."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from scipy.sparse.linalg import lsmr
from mechanics import model_for, make_matrices

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,default=Path('data/mechanics-fields-w032.json'))
args=parser.parse_args()
model=model_for(.32)
B,D,lengths,edges=make_matrices(model,True)
modes=[]
for i,name in enumerate(['exx','eyy','ezz','gamma_yz','gamma_xz','gamma_xy']):
    solution=lsmr(B,-D[:,i],atol=1e-12,btol=1e-12,conlim=1e14,maxiter=20000)
    if solution[1] not in (0,1,2): raise RuntimeError(f'{name} did not converge: {solution[1]}')
    residual=B@solution[0]+D[:,i]
    displacement=np.concatenate([np.zeros(3),solution[0]]).reshape((-1,3))
    axial_strain=residual/np.sqrt(lengths)
    modes.append({'name':name,'fluctuation':np.round(displacement,14).tolist(),
                  'axial_strain':np.round(axial_strain,14).tolist(),
                  'max_abs_axial_strain':float(np.max(np.abs(axial_strain))),
                  'normal_residual':float(np.linalg.norm(B.T@residual)/max(np.linalg.norm(B.T@D[:,i]),1e-30))})
# Hash graph in stable textual precision for reproducibility, not runtime identity checking.
graph={'vertices':model['vertices'],'edges':model['edges']}
fingerprint=hashlib.sha256(json.dumps(graph,sort_keys=True,separators=(',',':')).encode()).hexdigest()
result={'w':.32,'node_count':len(model['vertices']),'edge_count':len(edges),'graph_sha256':fingerprint,
        'positions':[v['p'] for v in model['vertices']],
        'edge_keys':[[e['a'],e['b'],*e['o']] for e in edges],
        'note':'Unit macroscopic strain; fluctuation from LSMR minimum-norm gauge; axial force/EA equals axial strain. Mechanisms make displacement non-unique. Apply chosen small strain linearly.', 'modes':modes}
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(result,separators=(',',':'))+'\n',encoding='utf8')
print('wrote',args.output,'nodes',result['node_count'],'edges',result['edge_count'],'max strain',[(x['name'],x['max_abs_axial_strain']) for x in modes])
