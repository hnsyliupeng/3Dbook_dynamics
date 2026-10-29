import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LESSONS} from '../app/src/lessons.js';
const read=path=>JSON.parse(readFileSync(path,'utf8'));

test('Pagonis 例号目录只保存固定来源元数据，未实施例不误标',()=>{
  const catalog=read('app/data/pagonis-catalog.json');
  const index=read('data/source-examples/pagonis.json');
  const hashes=read('data/source-examples/pagonis-sha256.json');
  assert.equal(index.commit,catalog.commit);assert.equal(hashes.commit,catalog.commit);
  assert.equal(index.notebooks.length,catalog.notebooks.length);
  assert.equal(index.notebooks.reduce((n,b)=>n+b.examples.length,0),101);
  for(const book of index.notebooks){
    const source=catalog.notebooks.find(n=>n.file===book.file);assert.ok(source);
    assert.match(hashes.files[book.file],/^[0-9a-f]{64}$/);
    assert.equal(new Set(book.examples.map(e=>e.label)).size,book.examples.length);
    let previous=-1;
    for(const example of book.examples){
      assert.deepEqual(Object.keys(example).sort(),['cells','label']);
      assert.match(example.label,/^(\d+|A)\.\d+[a-z]?$/);
      assert.ok(example.cells.length>0&&example.cells[0]>previous);
      for(const [i,c] of example.cells.entries())assert.ok(Number.isInteger(c)&&c===example.cells[0]+i&&c>=0&&c<source.cellCount);
      previous=example.cells.at(-1);
    }
  }
  const hasLink=(book,example)=>LESSONS.some(l=>l.sources.some(s=>s.repo==='pagonis'&&s.file===book.file&&s.cells.some(c=>example.cells.includes(c))));
  const all=index.notebooks.flatMap(book=>book.examples.map(example=>({book,example})));
  const mapped=all.filter(({book,example})=>hasLink(book,example));
  assert.ok(mapped.length>=16); // Partial associations, not a claim of complete reproduction.
  assert.ok(mapped.some(({example})=>example.label==='12.1'));
  const doc=readFileSync('docs/pagonis-examples.md','utf8');
  assert.ok(doc.includes(`${mapped.length}/${all.length} 个例号有至少部分单元关联`));
  const pending=all.find(({book,example})=>!hasLink(book,example));
  if(pending)assert.ok(doc.includes(`| ${pending.example.label} | ${pending.example.cells.join(', ')} | 待核对 / 实施 | — |`));
});
