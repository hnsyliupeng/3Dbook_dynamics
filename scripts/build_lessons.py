#!/usr/bin/env python3
"""Compile a truthful source catalog; only reviewed interactive adapters are playable.

AST candidates and TeX are preserved in content/lessons/source, but are NOT
implicitly interpreted as governing equations or original initial conditions.
"""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
inventory=json.loads((ROOT/'content/manifest/notebook-inventory.json').read_text())
chapters=[
 ('01Vector','01','向量运动学','Vector kinematics'),('02Energy','02','能量','Energy'),
 ('03EulerLagrange','03','欧拉–拉格朗日方程','Euler–Lagrange'),('04Constraints','04','约束 · 阿特伍德机','Constraints'),
 ('05Simulation','05','数值仿真','Simulation'),('06ConstraintForces','06','约束反力','Constraint forces'),
 ('07Nonconservative','07','非保守力','Nonconservative'),('08InertiaTensor','08','惯性张量','Inertia tensor'),
 ('09DistributedMass','09','分布质量','Distributed mass'),('10EulerRotation','10','刚体旋转','Euler rotation'),
 ('12OscillationsSDOF','12','单自由度振动','Single DOF'),('13OscillationsMDOF','13','多自由度振动','Multiple DOF'),
 ('15FinalProject','15','期末项目','Final project')]
output=[]
for folder,n,title,en in chapters:
    notebooks=[x['notebookPath'] for x in inventory if x['chapterId']==folder]
    output.append({'chapterId':folder,'number':n,'title':title,'englishTitle':en,'notebooks':notebooks,
                   'interactiveLessonId':'atwood-ideal' if folder=='04Constraints' else None,
                   'status':'reviewed interactive adaptation' if folder=='04Constraints' else 'source indexed; interactive lesson not implemented'})
(ROOT/'content/manifest/lesson-catalog.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
# Trace raw candidates back to cells. These are *not* inferred governing
# equations, parameter meanings, physical validity, or a lesson implementation.
models=[]
for entry in inventory:
    extracted=json.loads((ROOT/entry['extraction']).read_text())
    dynamic=[]; literals=[]; solver=[]; math_refs=[]; image_refs=[]
    for cell in extracted['cells']:
        ref=cell['sourceRef']; text=cell['source']; ast_info=cell.get('pythonAst',{})
        if cell['type']=='code' and any(token in text for token in ('dynamicsymbols(', 'symbols(', 'Function(')):
            dynamic.append({'cell':ref,'codeExcerpt':text[:500]})
        for name,value in ast_info.get('literalAssignments',{}).items():
            if isinstance(value,(int,float,list,tuple)) and not isinstance(value,bool):
                literals.append({'cell':ref,'name':name,'literal':value})
        relevant=[x for x in ast_info.get('calls',[]) if x.split('.')[-1] in ('solve_ivp','solve','solveset','dsolve','linsolve','nsolve')]
        if relevant: solver.append({'cell':ref,'calls':relevant})
        if cell.get('math'): math_refs.append({'cell':ref,'candidates':len(cell['math'])})
        mimes=[m for m in cell.get('outputMimeTypes',[]) if m.startswith('image/')]
        if mimes: image_refs.append({'cell':ref,'mimeTypes':mimes})
    reviewed=entry['notebookPath'] in ('04Constraints/atwoodConstraint.ipynb','05Simulation/atwoodSimulationSolved.ipynb')
    models.append({'notebook':entry['notebookPath'],'title':entry['title'],'citation':entry['citation'],
        'sourceExtraction':entry['extraction'],'features':entry['features'],
        'candidateStatus':'raw AST, literal and TeX candidates; NOT reviewed parameter meanings or governing equations',
        'symbolDeclarationCandidates':dynamic,'numericLiteralCandidates':literals,
        'solverCallCandidates':solver,'markdownMathCandidateCells':math_refs,'imageOutputCells':image_refs,
        'status':'reviewed for Atwood ideal adaptation' if reviewed else 'unreviewed: no inferred equations'})
(ROOT/'content/manifest/model-inventory.json').write_text(json.dumps(models,ensure_ascii=False,indent=2)+'\n')
print(f'Compiled {len(output)} chapter records and {len(models)} notebook records; 1 interactive lesson registered.')
