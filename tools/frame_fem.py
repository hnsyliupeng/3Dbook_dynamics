#!/usr/bin/env python3
"""Periodic 3D Euler–Bernoulli rigid-joint frame homogenization.

Normalized cell a=1, material E=1; circular solid section r/a. Six affine
strain cases with periodic translational AND rotational fluctuations. This is
an exploratory linear frame model, not solid FEA or an engineering certificate.
"""
import argparse,json,math
from pathlib import Path
import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import splu, eigsh, LinearOperator
try:
    from .mechanics import model_for
except ImportError:
    from mechanics import model_for

MATERIALS={
 'PLA':{'E_GPa':3.5,'nu':0.36},
 'ABS':{'E_GPa':2.0,'nu':0.35},
 'PC':{'E_GPa':2.3,'nu':0.37},
}

def local_stiffness(L, E, nu, r):
    if L<=0 or E<=0 or r<=0 or not (-1<nu<.5): raise ValueError('Invalid beam parameters')
    A=math.pi*r*r; I=math.pi*r**4/4; J=2*I; G=E/(2*(1+nu))
    k=np.zeros((12,12))
    def pair(i,j,c):
        k[i,i]+=c;k[j,j]+=c;k[i,j]-=c;k[j,i]-=c
    pair(0,6,E*A/L);pair(3,9,G*J/L)
    l=L
    mat=np.array([[12,6*l,-12,6*l],[6*l,4*l*l,-6*l,2*l*l],[-12,-6*l,12,-6*l],[6*l,2*l*l,-6*l,4*l*l]])*(E*I/L**3)
    iy=[1,5,7,11]; k[np.ix_(iy,iy)]+=mat
    signs=np.diag([1,-1,1,-1]);iz=[2,4,8,10];k[np.ix_(iz,iz)]+=signs@mat@signs
    return k

def frame_transform(d):
    ex=d/np.linalg.norm(d)
    seed=np.zeros(3);seed[np.argmin(np.abs(ex))]=1
    ez=np.cross(ex,seed);ez/=np.linalg.norm(ez);ey=np.cross(ez,ex)
    R=np.vstack([ex,ey,ez]);T=np.zeros((12,12))
    for i in range(4):T[3*i:3*i+3,3*i:3*i+3]=R
    return T

def affine_cases(d):
    x,y,z=d
    # engineering strain ordering [xx, yy, zz, gamma_yz, gamma_xz, gamma_xy]
    return np.array([[x,0,0,0,z/2,y/2],[0,y,0,z/2,0,x/2],[0,0,z,y/2,x/2,0.]])

def solve_frame(model,nu=.36,r=.006,include_fields=False,verify_modes=False):
    if not (0<r<.25) or not (-1<nu<.5):raise ValueError('Invalid r/a or Poisson ratio')
    points=np.asarray([v['p'] for v in model['vertices']],float)
    V=len(points);ndof=6*V; E=1.;edges=model['edges'];Q=np.zeros((ndof,6));H=np.zeros((6,6))
    rows=[];cols=[];vals=[]; element_data=[];lengths=[]
    for e in edges:
        a,b=e['a'],e['b'];d=points[b]+np.asarray(e['o'])-points[a];L=float(np.linalg.norm(d))
        T=frame_transform(d); k=T.T@local_stiffness(L,E,nu,r)@T
        ids=np.r_[np.arange(6*a,6*a+6),np.arange(6*b,6*b+6)]
        rows.extend(np.repeat(ids,12));cols.extend(np.tile(ids,12));vals.extend(k.ravel())
        h=np.zeros((12,6));h[6:9,:]=affine_cases(d)
        q=k@h;np.add.at(Q,ids,q);H+=h.T@q
        element_data.append((ids,k,h,T,L));lengths.append(L)
    K=coo_matrix((vals,(rows,cols)),shape=(ndof,ndof)).tocsc();K.sum_duplicates()
    # Fix only the first node's three translations (gauge). Do not pin rotation:
    # doing so would artificially stiffen rigid-jointed periodic frames.
    free=np.arange(3,ndof);Kf=K[free,:][:,free].tocsc();Qf=Q[free]
    lu=splu(Kf);u=np.zeros((ndof,6));u[free]=lu.solve(-Qf)
    residual=Kf@u[free]+Qf
    rel=[float(np.linalg.norm(residual[:,i])/max(np.linalg.norm(Qf[:,i]),1e-30)) for i in range(6)]
    # Sum energy in element coordinates; more stable than H - QᵀK⁻¹Q.
    C=np.zeros((6,6));N=[];moments=[]
    for ids,k,h,T,L in element_data:
        v=u[ids]+h;C+=v.T@k@v
        if include_fields:
            f=T@(k@v);N.append(f[6,:]);moments.append(np.max(np.abs(f[[4,5,10,11],:]),axis=0))
    C=(C+C.T)/2; eig=np.linalg.eigvalsh(C);m=None
    if eig[0]>1e-12*max(eig[-1],1e-300):
        S=np.linalg.inv(C)
        m={'young_x_over_E':float(1/S[0,0]),'young_y_over_E':float(1/S[1,1]),'young_z_over_E':float(1/S[2,2]),
           'poisson_xy':float(-S[1,0]/S[0,0]),'shear_yz_fixed_over_E':float(C[3,3]),'bulk_uniform_strain_over_E':float(np.sum(C[:3,:3])/9)}
    result={'V':V,'edges':len(edges),'dof_free':len(free),'nu':nu,'r_over_a':r,'section':{'A_over_a2':math.pi*r*r,'I_over_a4':math.pi*r**4/4,'J_over_a4':math.pi*r**4/2},
            'min_length_over_a':min(lengths),'C_over_E':C.tolist(),'C_eigenvalues_over_E':eig.tolist(),'moduli':m,'relative_equilibrium_residual':rel,
            'max_equilibrium_residual':max(rel),'solver':'sparse direct LU; periodic fluctuations; first-node translations gauged; all rotations free'}
    if verify_modes:
        # Eigenvalues of the translation-gauged stiffness are coordinate-dependent
        # and are NOT frequencies. Use LU-based shift-invert to check k=0 zeros.
        inv=LinearOperator(Kf.shape,matvec=lu.solve,dtype=float)
        vals,vecs=eigsh(Kf,k=4,sigma=0.,which='LM',OPinv=inv,tol=1e-9,maxiter=2000)
        mode_errors=[float(np.linalg.norm(Kf@vecs[:,i]-vals[i]*vecs[:,i])) for i in range(len(vals))]
        result['gauged_stiffness_modes']={'eigenvalues':vals.tolist(),'absolute_residuals':mode_errors,
           'note':'k=0 only, coordinate- and scaling-dependent; eigenvalues of static gauged K, not frequencies; no global buckling or BZ stability result.'}
    if include_fields:result['fields']={'fluctuation':u.tolist(),'axial_end_force_over_Ea2':np.array(N).tolist(),'max_end_moment_over_Ea3':np.array(moments).tolist()}
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--material',choices=list(MATERIALS));p.add_argument('--E-GPa',type=float,dest='E_GPa');p.add_argument('--nu',type=float);p.add_argument('--w',type=float,default=.32);p.add_argument('--resolution',type=int,default=48);p.add_argument('--r',type=float,default=.006);p.add_argument('--a-mm',type=float,default=100.);p.add_argument('--fields',action='store_true');p.add_argument('--verify-modes',action='store_true');p.add_argument('--output',type=Path)
    args=p.parse_args()
    if not (.15<=args.w<=.5 and 12<=args.resolution<=128 and 0<args.r<.25 and args.a_mm>0):p.error('invalid parameters')
    if (args.E_GPa is not None or args.nu is not None) and not args.material:p.error('--E-GPa and --nu require --material')
    if args.E_GPa is not None and args.E_GPa<=0:p.error('--E-GPa must be positive')
    if args.nu is not None and not -1<args.nu<.5:p.error('--nu must be between -1 and 0.5')
    model=model_for(args.w,args.resolution);results={}
    for name,defaults in MATERIALS.items():
        if args.material and args.material!=name:continue
        m=dict(defaults)
        if args.E_GPa is not None:m['E_GPa']=args.E_GPa
        if args.nu is not None:m['nu']=args.nu
        s=solve_frame(model,m['nu'],args.r,args.fields,args.verify_modes);s['material_assumption']=m;s['nominal_E_MPa']=m['E_GPa']*1000
        s['nominal_Ex_MPa']=None if s['moduli'] is None else s['moduli']['young_x_over_E']*s['nominal_E_MPa']
        s['nominal_C44_MPa']=s['C_over_E'][3][3]*s['nominal_E_MPa'];results[name]=s
    result={'model':'linear 3D Euler-Bernoulli frame; rigid joints; fixed-cell periodic fluctuation with six macro strain cases',
       'w':args.w,'resolution':args.resolution,'a_mm':args.a_mm,'r_over_a':args.r,'r_mm':args.a_mm*args.r,
       'strain_order':['exx','eyy','ezz','gamma_yz','gamma_xz','gamma_xy'],
       'warnings':['elastic constants are assumed illustrative values, not measured or guaranteed; printed polymers are anisotropic','linear rigid-joint beam model is not solid FEA; does not include joint solids, shear deformation, plasticity, large deformation, creep, buckling or contact','approximate graph includes artificial boundary frames; not paper figure 4 coordinates','known capsule interference and extremely short beams; model is not fabrication-ready','small residual and positive homogenized stiffness do not certify stability at nonzero wavevector or for a finite specimen'],
       'materials':results}
    text=json.dumps(result,ensure_ascii=False,indent=2,allow_nan=False)+'\n'
    if args.output:args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(text)
    else:print(text,end='')
if __name__=='__main__':main()
