import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { LESSONS } from '../app/src/lessons.js';
const html=await readFile('dist/index.html','utf8');
if(!html.includes('type="module"')||!html.includes('<!doctype html>'))throw new Error('Unexpected Vite output');
await writeFile('index.html',html);
await mkdir('cases',{recursive:true});
for(const lesson of LESSONS){
  const page=html.replace('<head>',`<head><script>window.__CASE_ID__=${JSON.stringify(lesson.id)};<\/script>`);
  await writeFile(`cases/${lesson.id}.html`,page);
}
await writeFile('cases/index.json',JSON.stringify(LESSONS.map(({id,title,section,sources})=>({id,title,section,sources})),null,2)+'\n');
console.log(`Generated root standalone book and ${LESSONS.length} self-contained case pages.`);
