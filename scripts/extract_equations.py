#!/usr/bin/env python3
"""Index source TeX and attempt SymPy's Lark parser on bounded candidates.

A successful parse is NOT a proof or a governing-equation classification. Raw
TeX and source refs are retained regardless of parse support. Complex/multiline
TeX is intentionally left for manual review; no regex-only semantic claim.
"""
from __future__ import annotations
import json
from pathlib import Path
from sympy.parsing.latex import parse_latex
ROOT=Path(__file__).resolve().parents[1]
cache={}; records=[]
for path in sorted((ROOT/'content/lessons/source').glob('*.json')):
    lesson=json.loads(path.read_text())
    for cell in lesson['cells']:
        for candidate in cell.get('math',[]):
            latex=candidate['latex'].strip()
            if latex not in cache:
                if len(latex)>80 or '\\begin' in latex or '\\text{' in latex or '\n' in latex:
                    cache[latex]={'status':'preserved; complex candidate not parsed'}
                else:
                    try:
                        result=parse_latex(latex,backend='lark')
                        cache[latex]={'status':'parsed candidate; unverified','sympy':str(result)}
                    except Exception as exc:
                        cache[latex]={'status':'preserved; unsupported by parser','errorType':type(exc).__name__}
            records.append({'notebook':lesson['notebookPath'],'cell':cell['sourceRef'],'kind':candidate['kind'],
                            'latex':latex,'parse':cache[latex]})
out=ROOT/'content/manifest/equation-index.json'
out.write_text(json.dumps({'repositoryCommit':'387f2df07e70ba3bdff2c66460c04f6ae6ba2055',
   'method':'delimiter state machine + SymPy Lark parse for bounded candidates; no automatic scientific verification',
   'candidateCount':len(records),'uniqueCount':len(cache),'candidates':records},ensure_ascii=False,indent=2)+'\n')
from collections import Counter
print('Candidates:',len(records),'unique:',len(cache),'unique parse statuses:',dict(Counter(x['status'] for x in cache.values())))
print('Wrote',out.relative_to(ROOT))
