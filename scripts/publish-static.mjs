import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
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
// Each page remains completely self-contained: the compressed payload includes
// the application, code, styles and fonts. A small native browser decoder keeps
// dozens of duplicate static pages well below the workspace/repository size cap.
// The case id is injected before the module executes; query-string overrides
// and file:// access have exactly the same semantics as the root page.
const payload=gzipSync(Buffer.from(html),{level:9,mtime:0}).toString('base64');
for(const lesson of LESSONS){
  const page=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${lesson.title} · 经典力学图鉴</title></head><body><p id="loading">正在离线加载案例……</p><script>
(async()=>{try{
  if(typeof window.DecompressionStream!=='function')throw Error('浏览器不支持离线解压，请使用新版浏览器或打开根目录 index.html。');
  const raw=atob('${payload}'),bytes=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);
  const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  let page=await new Response(stream).text();
  page=page.replace('<head>','<head><script>window.__CASE_ID__='+JSON.stringify(${JSON.stringify(lesson.id)})+';<\\/script>');
  document.open();document.write(page);document.close();
}catch(e){const status=document.getElementById('loading');status.textContent='案例加载失败：'+e.message+' ';const a=document.createElement('a');a.href='../index.html?case='+encodeURIComponent(${JSON.stringify(lesson.id)});a.textContent='打开未压缩首页的此案例';status.appendChild(a);console.error(e);}})();<\/script></body></html>`;
  await writeFile(`cases/${lesson.id}.html`,page);
}
await writeFile('cases/index.json',JSON.stringify(LESSONS.map(({id,title,section,sources})=>({id,title,section,sources})),null,2)+'\n');
console.log(`Generated root standalone book and ${LESSONS.length} self-contained case pages.`);
