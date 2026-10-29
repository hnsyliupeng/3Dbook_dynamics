#!/usr/bin/env python3
"""Fixed-cell periodic axial truss homogenization (normalized a=1, EA=1).

An affine macroscopic strain is imposed, while nodal fluctuations are periodic.
Each edge has energy 1/2*(EA/L)*(n·(u_j-u_i+strain·d))².
The solution minimizes total energy by sparse least squares; rigid translations
are gauged by fixing the first node's fluctuation. Results are not beam FEA.
"""
import argparse
import json
import subprocess
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import lsmr

ROOT=Path(__file__).resolve().parent.parent

def model_for(w, resolution=48):
    p=subprocess.run(['node',str(ROOT/'tools/export_model.mjs'),str(w),str(resolution)],cwd=ROOT,check=True,text=True,capture_output=True)
    return json.loads(p.stdout)

def make_matrices(model, webs=True):
    points=np.asarray([v['p'] for v in model['vertices']],dtype=float)
    edges=[e for e in model['edges'] if webs or e.get('role')!='boundary-web']
    row=[];col=[];values=[];D=np.zeros((len(edges),6));lengths=[]
    for i,e in enumerate(edges):
        a,b=e['a'],e['b']
        d=points[b]+np.array(e['o'])-points[a]
        length=np.linalg.norm(d)
        if length<1e-10: raise ValueError(f'Zero length edge {i}')
        lengths.append(float(length))
        direction=d/length
        weight=1/np.sqrt(length) # sqrt(EA/L), EA=1
        for k in range(3):
            row.extend([i,i]);col.extend([3*a+k,3*b+k]);values.extend([-weight*direction[k],weight*direction[k]])
        x,y,z=d; nx,ny,nz=direction
        D[i]=weight*np.array([nx*x,ny*y,nz*z,(ny*z+nz*y)/2,(nx*z+nz*x)/2,(nx*y+ny*x)/2])
    B=coo_matrix((values,(row,col)),shape=(len(edges),3*len(points))).tocsr()
    # Remove the first node's three DOFs as a translation gauge; mechanism DOFs remain.
    return B[:,3:],D,np.array(lengths),edges

def analyze(model, webs, tolerance, maxiter):
    B,D,lengths,edges=make_matrices(model,webs)
    R=np.zeros_like(D);results=[]
    for i in range(6):
        # LSMR minimizes ||B u + D_i||. In singular systems u is non-unique,
        # but the residual/energy is unique if the least-squares solve converges.
        sol=lsmr(B,-D[:,i],atol=tolerance,btol=tolerance,conlim=1e14,maxiter=maxiter)
        residual=B@sol[0]+D[:,i]
        R[:,i]=residual
        gradient=np.linalg.norm(B.T@residual)
        relative_gradient=gradient/max(np.linalg.norm(B.T@D[:,i]),1e-30)
        results.append(dict(mode=['exx','eyy','ezz','gamma_yz','gamma_xz','gamma_xy'][i],stop=int(sol[1]),iterations=int(sol[2]),residual_norm=float(np.linalg.norm(residual)),relative_normal_residual=float(relative_gradient),condition_estimate=float(sol[6])))
    C=R.T@R # unit cell volume is 1; normalized by EA/a²
    vals=np.linalg.eigvalsh(C)
    moduli=None
    if vals[0]>1e-10*vals[-1]:
        compliance=np.linalg.inv(C)
        # Directional quantities are for loading along cell axes, not isotropic averages.
        moduli={'young_x':float(1/compliance[0,0]),'young_y':float(1/compliance[1,1]),'young_z':float(1/compliance[2,2]),
                'poisson_xy':float(-compliance[1,0]/compliance[0,0]),
                'shear_yz_fixed_other_strains':float(C[3,3]),
                'uniform_volumetric_strain_bulk':float(np.sum(C[:3,:3])/9)}
    web_rows=np.array([e.get('role')=='boundary-web' for e in edges])
    web_energy_fraction=[]
    for i in range(6):
        total=float(np.dot(R[:,i],R[:,i])); numerator=float(np.dot(R[web_rows,i],R[web_rows,i]))
        web_energy_fraction.append(numerator/total if total>1e-30 else None)
    return {'vertices':len(model['vertices']),'edges':len(edges),'min_length':float(lengths.min()),'max_length':float(lengths.max()),'C_over_EA_a2':C.tolist(),'affine_upper_bound_C_over_EA_a2':(D.T@D).tolist(),'eigenvalues_C_over_EA_a2':vals.tolist(),'directional_moduli_over_EA_a2':moduli,'boundary_web_energy_fraction':web_energy_fraction,'converged':all(r['stop'] in (0,1,2) for r in results),'solves':results}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--w',type=float,default=.32);parser.add_argument('--resolution',type=int,default=48);parser.add_argument('--tol',type=float,default=1e-10);parser.add_argument('--maxiter',type=int,default=20000);parser.add_argument('--output',type=Path)
    args=parser.parse_args()
    if not .15<=args.w<=.5 or args.tol<=0 or args.maxiter<1: parser.error('w must be 0.15..0.50; tol and maxiter must be positive')
    model=model_for(args.w,args.resolution)
    result={'method':'fixed-lattice periodic pin-jointed axial truss, six affine strain cases and periodic displacement relaxation','w':args.w,'boundary_resolution':args.resolution,'normalization':'a=1, EA=1; C is in units EA/a²; strain order exx, eyy, ezz, gamma_yz, gamma_xz, gamma_xy','assumptions':['all bars identical axial rigidity EA','linear elastic axial bars and freely hinged nodes','no bending, torsion, prestress, buckling, contact, finite joint size or material nonlinearity','fixed cubic reference cell; affine strain with periodic fluctuations','geometry is the approximate model, not paper figure 4'], 'with_boundary_webs':analyze(model,True,args.tol,args.maxiter),'without_boundary_webs':analyze(model,False,args.tol,args.maxiter)}
    text=json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if args.output: args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(text,encoding='utf8')
    else: print(text,end='')
if __name__=='__main__':main()
