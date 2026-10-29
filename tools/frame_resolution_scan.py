#!/usr/bin/env python3
"""Diagnostic comparison across regenerated boundary samplings (not a mesh convergence study)."""
import json
from pathlib import Path
try:
 from .mechanics import model_for
 from .frame_fem import solve_frame
except ImportError:
 from mechanics import model_for
 from frame_fem import solve_frame
rows=[]
for res in (24,48,96):
 s=solve_frame(model_for(.32,res),.36,.006)
 rows.append({'resolution':res,'vertices':s['V'],'edges':s['edges'],'minimum_length_over_a':s['min_length_over_a'],
              'young_x_over_E':s['moduli']['young_x_over_E'],'shear_yz_over_E':s['moduli']['shear_yz_fixed_over_E'],
              'residual':s['max_equilibrium_residual']})
out={'w':.32,'nu':.36,'r_over_a':.006,'material':'PLA assumed','warning':'Each sampling regenerates a different boundary graph and connections. This is not a fixed-geometry mesh convergence study.','results':rows}
path=Path('data/frame-fem-resolution-scan.json');path.write_text(json.dumps(out,indent=2)+'\n');print(path)
