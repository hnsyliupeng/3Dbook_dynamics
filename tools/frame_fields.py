#!/usr/bin/env python3
"""Recompute rigid-joint periodic beam fields for the built-in sample."""
import json
from pathlib import Path
import numpy as np
try:
 from .frame_fem import solve_frame,MATERIALS
 from .mechanics import model_for
except ImportError:
 from frame_fem import solve_frame,MATERIALS
 from mechanics import model_for

model=model_for(.32);out={'w':.32,'resolution':48,'r_over_a':.006,'node_count':len(model['vertices']),'edge_count':len(model['edges']),'materials':{}}
for name,m in MATERIALS.items():
 result=solve_frame(model,m['nu'],.006,include_fields=True)
 if result['max_equilibrium_residual']>1e-8:raise RuntimeError(f'{name} equilibrium residual too large')
 field=result['fields'];u=np.asarray(field['fluctuation']).reshape(-1,6,6)
 axial=np.asarray(field['axial_end_force_over_Ea2'])
 out['materials'][name]={'nu':m['nu'],'fluctuation':np.round(u,11).tolist(),
   'axial_force_over_Ea2':np.round(axial,13).tolist(),'max_equilibrium_residual':result['max_equilibrium_residual']}
path=Path('data/frame-fem-fields-w032-r006.json');path.write_text(json.dumps(out,separators=(',',':'))+'\n');print(path,path.stat().st_size)
