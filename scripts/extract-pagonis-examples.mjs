// Optional metadata refresh, given a local checkout of the fixed upstream
// revision. Only example labels and cell indices are retained, not code/text.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
const upstream=process.argv[2];
if(!upstream)throw new Error('Usage: node scripts/extract-pagonis-examples.mjs /path/to/Classical_Mechanics_2nd_Edition');
const catalog=JSON.parse(await readFile('app/data/pagonis-catalog.json','utf8'));
const hashes=JSON.parse(await readFile('data/source-examples/pagonis-sha256.json','utf8'));
if(hashes.commit!==catalog.commit)throw new Error('Pinned source hashes and catalog commit differ');
const result={repository:catalog.repository,commit:catalog.commit,description:'仅原 Notebook 中明确标注的例号及零基单元索引；不复制代码、题干或输出。',notebooks:[]};
for(const nb of catalog.notebooks){
  const bytes=await readFile(join(upstream,nb.file));
  if(createHash('sha256').update(bytes).digest('hex')!==hashes.files[nb.file])throw new Error(`${nb.file}: source bytes differ from pinned revision`);
  const document=JSON.parse(bytes.toString('utf8'));
  if(document.cells.length!==nb.cellCount)throw new Error(`${nb.file}: cell count differs from pinned catalog`);
  const headers=[];
  document.cells.forEach((cell,index)=>{
    const text=Array.isArray(cell.source)?cell.source.join(''):cell.source||'';
    const match=text.match(/^\s*#*\s*Example\s+((?:\d+|[A-Z])\.\d+[a-z]?)\b/im);
    if(match)headers.push({label:match[1],start:index});
  });
  const examples=headers.map((header,i)=>({label:header.label,cells:Array.from({length:(headers[i+1]?.start??document.cells.length)-header.start},(_,j)=>header.start+j)}));
  result.notebooks.push({file:nb.file,examples});
}
await mkdir('data/source-examples',{recursive:true});
await writeFile('data/source-examples/pagonis.json',JSON.stringify(result,null,2)+'\n');
console.log(`Indexed ${result.notebooks.reduce((n,b)=>n+b.examples.length,0)} example headings in ${result.notebooks.length} Python notebooks.`);
