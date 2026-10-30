#!/usr/bin/env python3
"""Audit a pinned checkout. Extraction is descriptive, not automatic scientific inference.

Example: .venv/bin/python scripts/scan_repository.py --source content/source/ComputationalAnalyticalMechanics
"""
from __future__ import annotations
import argparse, ast, hashlib, json, os, subprocess, sys
from pathlib import Path

import nbformat
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'content'
REPO = 'https://github.com/unlam/ComputationalAnalyticalMechanics'
EXPECTED_COMMIT = '387f2df07e70ba3bdff2c66460c04f6ae6ba2055'


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def source_text(cell):
    value = cell.get('source', '')
    return ''.join(value) if isinstance(value, list) else value


def omit_data_uris(text: str) -> str:
    # Embedded binary images can be megabytes; the original remains linked by commit and cell index.
    while True:
        start = text.find('data:image/')
        if start == -1:
            return text
        end = text.find(')', start)
        if end == -1:
            return text[:start] + '[embedded image omitted]'
        text = text[:start] + '[embedded image omitted]' + text[end:]


def extract_math(text: str) -> list[dict]:
    """Delimiter state machine retaining original TeX; NOT a LaTeX semantic parser.

    Math is not promoted to a verified equation automatically. Python is separately AST-parsed.
    """
    result, i, n = [], 0, len(text)
    delimiters = [('$$', '$$', 'display'), ('\\[', '\\]', 'display'), ('\\(', '\\)', 'inline'), ('$', '$', 'inline')]
    while i < n:
        match = next(((opening, closing, kind) for opening, closing, kind in delimiters
                      if text.startswith(opening, i) and (i == 0 or text[i-1] != '\\')), None)
        if not match:
            i += 1; continue
        opening, closing, kind = match
        j = i + len(opening)
        while j < n:
            if text.startswith(closing, j) and (j == 0 or text[j-1] != '\\'):
                body = text[i + len(opening):j]
                if body.strip(): result.append({'kind': kind, 'latex': body})
                i = j + len(closing); break
            j += 1
        else:
            i += len(opening)
    return result


def dotted(node):
    if isinstance(node, ast.Name): return node.id
    if isinstance(node, ast.Attribute):
        parent = dotted(node.value)
        return f'{parent}.{node.attr}' if parent else node.attr
    return ''


def analyze_python(code: str) -> dict:
    info = {'imports': [], 'calls': [], 'literalAssignments': {}, 'parseError': None}
    try: tree = ast.parse(code)
    except SyntaxError as exc:
        info['parseError'] = f'{exc.msg} (line {exc.lineno})'; return info
    imports, calls = set(), set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import): imports.update(a.name for a in node.names)
        elif isinstance(node, ast.ImportFrom): imports.add(node.module or '')
        elif isinstance(node, ast.Call):
            name = dotted(node.func)
            if name: calls.add(name)
        elif isinstance(node, (ast.Assign, ast.AnnAssign)):
            targets = node.targets if isinstance(node, ast.Assign) else [node.target]
            try: value = ast.literal_eval(node.value)
            except (ValueError, TypeError, SyntaxError): continue
            if isinstance(value, (str, int, float, bool, list, tuple, dict)) and len(repr(value)) <= 500:
                for target in targets:
                    if isinstance(target, ast.Name): info['literalAssignments'][target.id] = value
    info['imports'], info['calls'] = sorted(imports), sorted(calls)
    return info


def output_text(cell):
    entries = []
    for output in cell.get('outputs', []):
        record = {'type': output.get('output_type', 'unknown')}
        if 'text' in output:
            record['text'] = ''.join(output['text']) if isinstance(output['text'], list) else output['text']
        for kind in ('text/plain', 'text/latex'):
            value = output.get('data', {}).get(kind)
            if value is not None: record[kind] = ''.join(value) if isinstance(value, list) else value
        if output.get('ename'): record['error'] = {'name': output['ename'], 'value': output.get('evalue', '')}
        if len(record) > 1: entries.append(record)
    return entries


def inspect_notebook(path: Path, relative: str, commit: str):
    raw = json.loads(path.read_text(encoding='utf-8'))
    # Validate a separate NotebookNode so auto-generated missing IDs never become fake source IDs.
    validation = 'valid'
    try: nbformat.validate(nbformat.from_dict(raw))
    except Exception as exc: validation = f'{type(exc).__name__}: {exc}'
    chapter = relative.split('/')[0]
    cells, all_imports, all_calls = [], set(), set()
    for index, cell in enumerate(raw.get('cells', [])):
        original = source_text(cell)
        text = omit_data_uris(original)
        actual_id = cell.get('id')
        cell_ref = actual_id if actual_id else f'index:{index}'
        rec = {'sourceRef': cell_ref, 'cellIndex': index, 'originalCellId': actual_id,
               'type': cell.get('cell_type', 'unknown'), 'source': text,
               'sourceSha256': sha(original.encode()), 'outputs': output_text(cell),
               'outputMimeTypes': sorted({kind for out in cell.get('outputs', []) for kind in out.get('data', {})}),
               'attachmentNames': sorted(cell.get('attachments', {}).keys())}
        if rec['type'] == 'markdown': rec['math'] = extract_math(text)
        if rec['type'] == 'code':
            rec['pythonAst'] = analyze_python(text)
            all_imports.update(rec['pythonAst']['imports']); all_calls.update(rec['pythonAst']['calls'])
        cells.append(rec)
    title = next((line.lstrip('# ').strip() for c in cells if c['type'] == 'markdown'
                  for line in c['source'].splitlines() if line.startswith('# ')), path.stem)
    features = {
        'sympy': any(i.startswith('sympy') for i in all_imports),
        'numpy': any(i.startswith('numpy') for i in all_imports),
        'scipy': any(i.startswith('scipy') for i in all_imports),
        'matplotlib': any(i.startswith('matplotlib') for i in all_imports),
        'solveIvp': any(name.endswith('solve_ivp') for name in all_calls),
    }
    return {'chapterId': chapter, 'notebookPath': relative, 'sourceCommit': commit,
            'originalLanguage': 'unclassified; English-dominant course',
            'codeLanguage': raw.get('metadata', {}).get('language_info', {}).get('name', 'unknown'),
            'title': title, 'metadata': raw.get('metadata', {}), 'nbformat': raw.get('nbformat'),
            'validation': validation, 'features': features, 'imports': sorted(all_imports),
            'cells': cells, 'citation': f'{REPO}/blob/{commit}/{relative}',
            'classification': 'unreviewed source extraction; not an interactive lesson'}


def inspect_pdf(path: Path):
    try:
        reader = PdfReader(str(path))
        pages = [(p.extract_text() or '') for p in reader.pages]
        text = '\n'.join(pages)
        return {'pages': len(pages), 'extractedTextChars': len(text), 'textSha256': sha(text.encode()),
                'textPreview': text[:350]}
    except Exception as exc:
        return {'error': f'{type(exc).__name__}: {exc}'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', default=os.environ.get('COURSE_SOURCE', 'content/source/ComputationalAnalyticalMechanics'))
    parser.add_argument('--allow-other-commit', action='store_true')
    args = parser.parse_args()
    source = Path(args.source).resolve()
    if not (source / '.git').exists(): sys.exit(f'Not a course git checkout: {source}')
    commit = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if commit != EXPECTED_COMMIT and not args.allow_other_commit:
        sys.exit(f'Expected {EXPECTED_COMMIT}; got {commit}. Pass --allow-other-commit to inspect intentionally.')
    paths = sorted(p for p in source.rglob('*') if p.is_file() and '.git' not in p.relative_to(source).parts)
    chapters = sorted(p.name for p in source.iterdir() if p.is_dir() and len(p.name) > 2 and p.name[:2].isdigit())
    files, inventory = [], []
    for path in paths:
        rel = path.relative_to(source).as_posix(); data = path.read_bytes()
        entry = {'path': rel, 'bytes': len(data), 'sha256': sha(data), 'kind': path.suffix.lower() or 'other'}
        if path.suffix.lower() == '.pdf': entry['pdf'] = inspect_pdf(path)
        if path.suffix.lower() == '.tex':
            text = data.decode('utf-8', errors='replace')
            entry['textChars'] = len(text); entry['mathCandidates'] = len(extract_math(text))
        files.append(entry)
        if path.suffix.lower() == '.ipynb':
            lesson = inspect_notebook(path, rel, commit)
            safe_name = rel.replace('/', '__').replace('.ipynb', '.json')
            target = OUT / 'lessons/source' / safe_name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(json.dumps(lesson, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
            inventory.append({key: lesson[key] for key in ('chapterId', 'notebookPath', 'sourceCommit', 'originalLanguage', 'codeLanguage', 'title', 'nbformat', 'validation', 'features', 'imports', 'citation')}
                             | {'cellCount': len(lesson['cells']), 'extraction': str(target.relative_to(ROOT))})
    manifest = {'repository': REPO, 'commit': commit, 'license': 'CC BY-NC-SA 4.0', 'chapters': chapters,
                'fileCount': len(files), 'notebookCount': len(inventory), 'files': files}
    (OUT / 'manifest').mkdir(parents=True, exist_ok=True)
    (OUT / 'manifest/source-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    (OUT / 'manifest/notebook-inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{commit}: {len(files)} files, {len(inventory)} notebooks, {len(chapters)} chapter directories')
    print('PDF text errors:', sum('error' in x.get('pdf', {}) for x in files))
    print('Code AST parse errors:', sum(1 for p in (OUT/'lessons/source').glob('*.json') for c in json.loads(p.read_text())['cells'] if c.get('pythonAst', {}).get('parseError')))

if __name__ == '__main__': main()
