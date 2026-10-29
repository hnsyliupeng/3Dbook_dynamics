import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { LESSONS } from '../app/src/lessons.js';
// Modern WebGL browsers support WOFF2. Keep the 20 self-contained WOFF2 fonts,
// and drop only KaTeX's redundant WOFF/TTF fallbacks from published copies.
// This saves over 1 MB per standalone case without adding network requests.
const built=await readFile('dist/index.html','utf8');
const legacyFont=/,url\(data:font\/(?:woff|ttf);base64,[^)]+\) format\("(?:woff|truetype)"\)/g;
const fallbacks=[...built.matchAll(legacyFont)];
if(fallbacks.length!==40)throw new Error(`Unexpected KaTeX fallback count: ${fallbacks.length}`);
const html=built.replace(legacyFont,'');
if(!html.includes('type="module"')||!html.includes('<!doctype html>'))throw new Error('Unexpected Vite output');
await writeFile('index.html',html);
await mkdir('cases',{recursive:true});
for(const lesson of LESSONS){
  const page=html.replace('<head>',`<head><script>window.__CASE_ID__=${JSON.stringify(lesson.id)};<\/script>`);
  await writeFile(`cases/${lesson.id}.html`,page);
}
await writeFile('cases/index.json',JSON.stringify(LESSONS.map(({id,title,section,sources})=>({id,title,section,sources})),null,2)+'\n');
console.log(`Generated root standalone book and ${LESSONS.length} self-contained case pages.`);
