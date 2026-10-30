#!/usr/bin/env python3
"""Execute the two pinned source notebooks in a local Jupyter kernel.
No notebook is rewritten; image outputs are counted, not checked into git.
"""
from __future__ import annotations
import argparse, hashlib, json, os, subprocess
from pathlib import Path
import nbformat
from nbclient import NotebookClient

ROOT=Path(__file__).resolve().parents[1]
EXPECTED='387f2df07e70ba3bdff2c66460c04f6ae6ba2055'
FILES=['04Constraints/atwoodConstraint.ipynb','05Simulation/atwoodSimulationSolved.ipynb']
os.environ['MPLBACKEND']='Agg'

def main():
    p=argparse.ArgumentParser();p.add_argument('--source',default=os.environ.get('COURSE_SOURCE','content/source/ComputationalAnalyticalMechanics'));args=p.parse_args()
    source=Path(args.source).resolve()
    commit=subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()
    if commit!=EXPECTED: raise SystemExit(f'Expected {EXPECTED}; got {commit}')
    runs=[]
    for relative in FILES:
        path=source/relative
        original_sha=hashlib.sha256(path.read_bytes()).hexdigest()
        notebook=nbformat.read(path,as_version=4)
        result={'notebook':relative,'sourceSha256':original_sha,'sourceCommit':commit,'status':'running'}
        try:
            client=NotebookClient(notebook,timeout=120,kernel_name='python3',resources={'metadata':{'path':str(path.parent)}})
            client.execute()
            result['status']='passed'
        except Exception as exc:
            result['status']='failed';result['error']=f'{type(exc).__name__}: {exc}'[-3000:]
        result['codeCells']=sum(c.cell_type=='code' for c in notebook.cells)
        result['executedCells']=sum(c.cell_type=='code' and c.get('execution_count') is not None for c in notebook.cells)
        result['imageOutputs']=sum(1 for c in notebook.cells for o in c.get('outputs',[]) if any(k.startswith('image/') for k in o.get('data',{})))
        selected=[35,61] if relative.startswith('04') else [37,53,60]
        result['selectedOutputs']=[]
        for i in selected:
            if i>=len(notebook.cells): continue
            cell=notebook.cells[i]; entries=[]
            for o in cell.get('outputs',[]):
                data=o.get('data',{})
                for kind in ('text/latex','text/plain'):
                    if kind in data:
                        text=data[kind]
                        entries.append({'mime':kind,'value':(''.join(text) if isinstance(text,list) else text)[:3000]})
            result['selectedOutputs'].append({'cellRef':f'index:{i}','outputs':entries})
        assert hashlib.sha256(path.read_bytes()).hexdigest()==original_sha, 'Source notebook was modified!'
        runs.append(result);print(relative,result['status'],f"({result['executedCells']}/{result['codeCells']} code cells, {result['imageOutputs']} image outputs)")
        if result.get('error'):print(result['error'][-900:])
    out=ROOT/'reports/source-notebook-execution.json';out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({'sourceCommit':commit,'environment':'local nbclient, ipykernel, Agg; source files not changed','runs':runs},ensure_ascii=False,indent=2)+'\n')
    if any(r['status']!='passed' for r in runs):raise SystemExit(1)

if __name__=='__main__':main()
